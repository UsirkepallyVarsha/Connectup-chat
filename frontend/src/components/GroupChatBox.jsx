import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { API } from "../api";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

function GroupChatBox({ currentUser, group }) {
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [membersInfo, setMembersInfo] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  /* ================= MEMBERS INFO ================= */

  const loadMembersInfo = useCallback(async () => {
    if (!group) return;
    try {
      const info = await API.getGroupMembers(group._id);
      setMembersInfo(info);

      if (info && currentUser) {
        const meId = currentUser._id;
        const adminMatch = info.admin?._id === meId;
        const memberMatch = info.members?.some((m) => m._id === meId);
        setIsAdmin(adminMatch);
        setIsMember(adminMatch || memberMatch);
      }
    } catch {
      setIsMember(false);
      setIsAdmin(false);
    }
  }, [group, currentUser]);

  useEffect(() => {
    setMembersInfo(null);
    setIsMember(false);
    setIsAdmin(false);

    if (group && currentUser) {
      loadMembersInfo();
    }
  }, [group, currentUser, loadMembersInfo]);

  /* ================= SOCKET ================= */

  useEffect(() => {
    if (!socketRef.current) {
      const socketUrl =
        process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
      socketRef.current = io(socketUrl);
    }

    const socket = socketRef.current;
    if (!currentUser || !group) return;

    const handleGroupMessage = (msg) => {
      if (msg.group !== group._id) return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    };

    socket.emit("join_group", group._id);
    socket.on("group_message", handleGroupMessage);

    const loadHistory = async () => {
      try {
        const data = await API.getGroupMessages(group._id);
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setMessages([]);
      }
    };

    loadHistory();

    return () => {
      socket.off("group_message", handleGroupMessage);
    };
  }, [currentUser, group]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= ACTIONS ================= */

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !group || !currentUser || !isMember) return;

    socketRef.current?.emit("group_message", {
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
    recognition.onresult = (e) =>
      setInput(e.results[0][0].transcript);

    recognition.start();
  };

  const handleRequestJoin = async () => {
    await API.requestJoinGroup(group._id);
    alert(t("joinRequested") || "Join request sent");
    loadMembersInfo();
  };

  const handleApprove = async (userId) => {
    await API.approveMember(group._id, userId);
    loadMembersInfo();
  };

  const handleReject = async (userId) => {
    await API.rejectMember(group._id, userId);
    loadMembersInfo();
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove member?")) return;
    await API.removeMember(group._id, userId);
    loadMembersInfo();
  };

  const handleDeleteGroupMessage = async (id) => {
    if (!window.confirm("Delete message?")) return;
    await API.deleteGroupMessage(id);
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  if (!group) return null;

  /* ================= UI HELPERS ================= */

  const renderMembersPanel = () => {
    if (!membersInfo) return null;

    return (
      <div className="mb-3 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs space-y-2">
        <div className="text-slate-400">
          Admin: {membersInfo.admin?.name || membersInfo.admin?.email}
        </div>

        <div>
          <span className="text-slate-400">
            Members: {membersInfo.members?.length || 0}
          </span>

          <div className="flex flex-wrap gap-1 mt-1">
            {membersInfo.members?.map((m) => (
              <span key={m._id} className="badge badge-sm bg-slate-800">
                {m.name || m.email}
                {isAdmin && m._id !== membersInfo.admin._id && (
                  <button
                    onClick={() => handleRemoveMember(m._id)}
                    className="ml-1 text-red-400"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {isAdmin && membersInfo.pendingMembers?.length > 0 && (
          <div>
            <span className="text-slate-400">Pending:</span>
            {membersInfo.pendingMembers.map((u) => (
              <div key={u._id} className="flex gap-2 mt-1">
                <span>{u.name || u.email}</span>
                <button
                  onClick={() => handleApprove(u._id)}
                  className="btn btn-xs btn-success"
                >
                  ✓
                </button>
                <button
                  onClick={() => handleReject(u._id)}
                  className="btn btn-xs btn-error"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderJoinGate = () => {
    if (isMember) return null;
    const isPending = membersInfo?.pendingMembers?.some(
      (u) => u._id === currentUser._id
    );

    return (
      <div className="flex flex-col items-center justify-center h-52 space-y-2">
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

  /* ================= RENDER ================= */

  return (
    <div className="w-full max-w-3xl h-[calc(100vh-4rem)] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col px-4 py-3">
      <h2 className="text-sm font-semibold text-slate-50 mb-2">
        #{group.name}
      </h2>

      {renderMembersPanel()}

      {!isMember ? (
        renderJoinGate()
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {messages.map((m) => {
              const isMine = m.sender === currentUser._id;
              const canDelete = isMine || isAdmin;

              return (
                <div
                  key={m._id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-xl text-xs max-w-[80%] ${
                      isMine
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    <p>{m.content}</p>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteGroupMessage(m._id)}
                        className="text-[10px] opacity-70"
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm"
              placeholder={listening ? "Listening..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="button" onClick={handleVoiceInput}>
              🎤
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {t("send") || "Send"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default GroupChatBox;
