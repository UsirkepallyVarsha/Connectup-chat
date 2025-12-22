import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API } from "../api";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

function GroupChatBox({ currentUser, group }) {
  console.log("🚀 GroupChatBox COMPONENT RENDERED");
  console.log("🚀 Props - currentUser:", currentUser);
  console.log("🚀 Props - group:", group);
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [membersInfo, setMembersInfo] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const loadMembersInfo = async () => {
    if (!group) return;
    try {
      const info = await API.getGroupMembers(group._id);
      setMembersInfo(info);
      if (info && currentUser) {
        const meId = currentUser._id;
        const adminMatch = info.admin && info.admin._id === meId;
        const memberMatch =
          info.members && info.members.some((m) => m._id === meId);
        setIsAdmin(adminMatch);
        setIsMember(adminMatch || memberMatch);
      }
    } catch (e) {
      setIsMember(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    setMembersInfo(null);
    setIsMember(false);
    setIsAdmin(false);
    if (group && currentUser) {
      loadMembersInfo();
    }
  }, [group, currentUser]);

  useEffect(() => {
    console.log("🔵 GroupChatBox useEffect triggered");
    console.log("🔵 currentUser:", currentUser?._id);
    console.log("🔵 group:", group?._id);
    console.log("🔵 REACT_APP_SOCKET_URL:", process.env.REACT_APP_SOCKET_URL);

    if (!socketRef.current) {
      const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
      console.log("🟢 Creating NEW socket connection to:", socketUrl);
      socketRef.current = io(socketUrl);
      
      socketRef.current.on("connect", () => {
        console.log("✅ Socket CONNECTED! ID:", socketRef.current.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Socket DISCONNECTED");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("🔴 Socket CONNECTION ERROR:", error);
      });
    } else {
      console.log("🟡 Socket already exists, reusing");
    }

    const socket = socketRef.current;
    if (!currentUser || !group) {
      console.log("⚠️ Missing currentUser or group, exiting early");
      return;
    }

    const handleGroupMessage = (msg) => {
      console.log("📨 Got group msg:", msg);
      if (msg.group !== group._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    console.log("📤 Emitting join_group for:", group._id);
    socket.emit("join_group", group._id);
    socket.on("group_message", handleGroupMessage);

    const loadHistory = async () => {
      try {
        console.log("📜 Loading message history for group:", group._id);
        const data = await API.getGroupMessages(group._id);
        if (Array.isArray(data)) {
          console.log("✅ Loaded", data.length, "messages");
          setMessages(data);
        } else {
          console.log("⚠️ No messages or invalid data");
          setMessages([]);
        }
      } catch (e) {
        console.error("🔴 Error loading history:", e);
        setMessages([]);
      }
    };
    loadHistory();

    return () => {
      console.log("🧹 Cleanup: removing group_message listener");
      socket.off("group_message", handleGroupMessage);
    };
  }, [currentUser, group]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !group || !currentUser || !isMember) return;

    const socket = socketRef.current;
    if (!socket) return;

    console.log("📤 Sending group message to group:", group._id);
    socket.emit("group_message", {
      groupId: group._id,
      from: currentUser._id,
      content: input.trim(),
    });
    setInput("");
  };

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      alert(t("voiceNotSupported") || "Voice not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const speakMessage = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === "hi" ? "hi-IN" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleRequestJoin = async () => {
    if (!group) return;
    await API.requestJoinGroup(group._id);
    alert(t("joinRequested") || "Join request sent");
    loadMembersInfo();
  };

  const handleApprove = async (userId) => {
    await API.approveMember(group._id, userId);
    await loadMembersInfo();
  };

  const handleReject = async (userId) => {
    await API.rejectMember(group._id, userId);
    await loadMembersInfo();
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm(t("confirmRemoveMember") || "Remove member?")) return;
    await API.removeMember(group._id, userId);
    await loadMembersInfo();
  };

  const handleDeleteGroupMessage = async (id) => {
    if (!window.confirm(t("confirmDeleteMessage") || "Delete?")) return;
    await API.deleteGroupMessage(id);
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  if (!group) return null;

  const renderMembersPanel = () => {
    if (!membersInfo) return null;
    return (
      <div className="mb-3 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Admin: {membersInfo.admin?.name || membersInfo.admin?.email}</span>
        </div>
        <div>
          <span className="text-slate-400">Members: {membersInfo.members?.length || 0}</span>
          {membersInfo.members?.map((m) => (
            <div key={m._id} className="badge badge-sm bg-slate-800 m-1">
              {m.name || m.email}
              {isAdmin && m._id !== membersInfo.admin._id && (
                <button onClick={() => handleRemoveMember(m._id)} className="ml-1 text-red-400">✕</button>
              )}
            </div>
          ))}
        </div>
        {isAdmin && membersInfo.pendingMembers?.length > 0 && (
          <div>
            <span className="text-slate-400">Pending:</span>
            {membersInfo.pendingMembers.map((u) => (
              <div key={u._id} className="flex items-center gap-2 mt-1">
                <span className="text-xs">{u.name || u.email}</span>
                <button onClick={() => handleApprove(u._id)} className="btn btn-xs btn-success">✓</button>
                <button onClick={() => handleReject(u._id)} className="btn btn-xs btn-error">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderJoinGate = () => {
    if (isMember) return null;
    const isPending = membersInfo?.pendingMembers?.some((u) => u._id === currentUser._id);
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center space-y-2">
        <p className="text-sm text-slate-300">
          {isPending ? "Waiting for approval..." : "You are not a member"}
        </p>
        {!isPending && (
          <button onClick={handleRequestJoin} className="btn btn-primary btn-sm">
            Request to join
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl h-[calc(100vh-4rem)] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col px-4 py-3">
      <div className="flex items-center gap-3 mb-3 border-b border-slate-800 pb-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
          #{group.name?.[0] || "G"}
        </div>
        <h2 className="text-sm font-semibold text-slate-50">{group.name}</h2>
      </div>

      {renderMembersPanel()}

      {!isMember ? (
        renderJoinGate()
      ) : (
        <>
          <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 overflow-y-auto px-3 py-2 space-y-2 mb-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">No messages yet</p>
            ) : (
              messages.map((m) => {
                const isMine = m.sender === currentUser._id;
                const canDelete = isMine || isAdmin;
                return (
                  <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`px-3 py-2 rounded-2xl text-xs max-w-[80%] ${isMine ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                      <p>{m.content}</p>
                      {canDelete && (
                        <button onClick={() => handleDeleteGroupMessage(m._id)} className="text-[10px] mt-1 opacity-70 hover:opacity-100">
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-2xl px-3 py-1.5">
              <input
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
                placeholder={listening ? "Listening..." : "Type a message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="button"
                className={`ml-1 rounded-full p-1.5 text-lg ${listening ? "bg-rose-500 text-white animate-pulse" : "text-indigo-300 hover:bg-slate-800"}`}
                onClick={handleVoiceInput}
              >
                🎤
              </button>
            </div>
            <button
              className="btn btn-sm rounded-2xl bg-indigo-600 border-0 text-white px-4 hover:bg-indigo-500"
              type="submit"
            >
              {t("send") || "Send"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default GroupChatBox;
