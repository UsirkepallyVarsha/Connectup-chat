import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API } from "../api";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

function ChatBox({ currentUser, otherUser }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket ONCE and store in ref
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(
        process.env.REACT_APP_SOCKET_URL || "https://connectup-chat-2.onrender.com",{
  transports: ["websocket"]
}
       
      );
    }

    const socket = socketRef.current;

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket.id);
      setConnected(true);
      if (currentUser) {
        console.log("📤 Emitting join for user:", currentUser._id);
        socket.emit("join", currentUser._id);
      }
    };

    const handlePrivateMessage = (msg) => {
      console.log("📨 Received private_message:", msg);
      if (
        !otherUser ||
        !(
          (msg.from === currentUser._id && msg.to === otherUser._id) ||
          (msg.from === otherUser._id && msg.to === currentUser._id)
        )
      ) {
        console.log("❌ Message filtered out (not for this conversation)");
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) {
          console.log("⚠️ Duplicate message, skipping");
          return prev;
        }
        console.log("✅ Adding message to state");
        return [...prev, msg];
      });
    };

    const handleMessageDeleted = ({ id }) => {
      console.log("🗑️ Message deleted:", id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("private_message", handlePrivateMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("disconnect", handleDisconnect);

    // If already connected, trigger join
    if (socket.connected && currentUser) {
      console.log("📤 Socket already connected, emitting join:", currentUser._id);
      socket.emit("join", currentUser._id);
      setConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("private_message", handlePrivateMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("disconnect", handleDisconnect);
    };
  }, [currentUser, otherUser]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentUser || !otherUser) return;
      console.log("📥 Loading message history with:", otherUser._id);
      const data = await API.getMessagesWith(otherUser._id);
      if (Array.isArray(data)) {
        console.log("✅ Loaded", data.length, "messages");
        setMessages(data);
      } else {
        console.log("❌ No messages or error");
        setMessages([]);
      }
    };
    loadHistory();
  }, [currentUser, otherUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !otherUser) return;

    const socket = socketRef.current;
    if (!socket) {
      console.error("❌ Socket not initialized");
      return;
    }

    const messageData = {
      from: currentUser._id,
      to: otherUser._id,
      content: input.trim(),
    };

    console.log("📤 Sending private_message:", messageData);
    socket.emit("private_message", messageData);
    setInput("");
  };

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      alert(
        t("voiceNotSupported") ||
          "Voice recognition is not supported in this browser."
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const speakMessage = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === "hi" ? "hi-IN" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleDeleteChat = async () => {
    if (!otherUser) return;
    if (
      !window.confirm(
        t("confirmDeleteChat") || "Delete this chat and its messages?"
      )
    )
      return;

    await API.deleteConversation(otherUser._id);
    setMessages([]);
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm(t("confirmDeleteMessage") || "Delete this message?"))
      return;
    await API.deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  if (!otherUser) return null;

  const gradientBg =
    "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950";

  return (
    <div
      className={`relative flex h-[600px] max-w-3xl w-full ${gradientBg} rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.9)] border border-white/5 overflow-hidden`}
    >
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#4f46e5_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22d3ee_0,_transparent_55%)] opacity-40" />

      {/* content */}
      <div className="relative flex flex-col h-full w-full bg-slate-900/70 backdrop-blur-2xl">
        {/* header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              {otherUser.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {otherUser.name?.[0]}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white">
                {otherUser.name}
              </span>
              <span
                className={`text-[11px] flex items-center gap-1 ${
                  connected ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-emerald-400" : "bg-slate-500"
                  } animate-pulse`}
                />
                {connected
                  ? t("online") || "Online"
                  : t("connecting") || "Connecting..."}
              </span>
            </div>
          </div>

          <button
            className="btn btn-xs btn-ghost rounded-full border border-red-500/40 text-red-300 hover:bg-red-500/20 hover:border-red-400"
            onClick={handleDeleteChat}
            type="button"
          >
            🗑 {t("deleteChat") || "Delete"}
          </button>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          {messages.length === 0 && (
            <p className="text-xs text-slate-300/70 text-center mt-10">
              {t("noMessagesYet") ||
                "No messages yet. Start the conversation."}
            </p>
          )}

          {messages.map((m) => {
            const isMine = m.from === currentUser._id;
            const dt = new Date(m.createdAt);
            const timeStr = dt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const nameToShow = isMine ? currentUser.name : otherUser.name;
            const avatarUrl = isMine
              ? currentUser.avatarUrl
              : otherUser.avatarUrl;
            const fallbackLetter = nameToShow?.charAt(0)?.toUpperCase() || "?";

            const statusText = m.seen
              ? `✔✔ ${t("seen") || "Seen"}`
              : `✔ ${t("delivered") || "Delivered"}`;

            return (
              <div
                key={m._id || `${m.from}-${m.createdAt}`}
                className={`flex ${
                  isMine ? "justify-end" : "justify-start"
                } gap-2`}
              >
                {!isMine && (
                  <div className="w-8 h-8 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/40">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={nameToShow}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {fallbackLetter}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col items-end max-w-[75%]">
                  <div
                    className={`relative px-3.5 py-2 rounded-2xl text-xs shadow-lg ${
                      isMine
                        ? "bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-br-none"
                        : "bg-slate-800/90 text-slate-100 rounded-bl-none border border-white/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words pr-6 py-2">
                      {m.content}
                    </p>
                    <span className="absolute bottom-1 right-2 text-[9px] opacity-70">
                      {timeStr}
                    </span>
                  </div>

                  <div className="flex gap-1 mt-1 text-[10px] opacity-70 items-center">
                    {isMine && (
                      <span className="text-slate-300">{statusText}</span>
                    )}
                    <div className="dropdown dropdown-end">
                      <button
                        tabIndex={0}
                        type="button"
                        className="btn btn-ghost btn-[10px] btn-circle text-slate-300 hover:bg-slate-800/80"
                      >
                        ⋮
                      </button>
                      <ul
                        tabIndex={-1}
                        className="dropdown-content menu menu-xs p-1 shadow bg-slate-900/95 rounded-xl border border-white/10 w-32 text-xs"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => speakMessage(m.content)}
                            className="flex items-center gap-1 text-slate-100"
                          >
                            🔊 {t("listenMessage") || "Listen"}
                          </button>
                        </li>
                        {isMine && m._id && (
                          <li>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-red-300 hover:text-red-200"
                              onClick={() => handleDeleteMessage(m._id)}
                            >
                              🗑 {t("deleteMessage") || "Delete"}
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-slate-950/80"
        >
          <div className="flex-1 flex items-center bg-slate-900/70 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-cyan-400/70 focus-within:ring-1 focus-within:ring-cyan-400/40 transition">
            <input
              className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
              placeholder={
                listening
                  ? t("listening") || "Listening..."
                  : t("typeMessage") || "Type a message..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
                        <button
                          type="button"
                          className={`ml-1 rounded-full p-1.5 text-lg ${
                            listening
                              ? "bg-rose-500/90 text-white shadow shadow-rose-500/40 animate-pulse"
                              : "text-cyan-300 hover:bg-slate-800/80"
                          } transition`}
                          onClick={handleVoiceInput}
                        >
                          🎤
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 border-0 text-white hover:from-indigo-600 hover:to-cyan-600"
                      >
                        {t("send") || "Send"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            }
            
            export default ChatBox;
