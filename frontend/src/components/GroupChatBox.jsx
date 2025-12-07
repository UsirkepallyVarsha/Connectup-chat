import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API } from "../api";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

let socket;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, currentUser]);

  useEffect(() => {
    if (!currentUser || !group) return;

    if (!socket) {
      socket = io();
    }

    socket.emit("join_group", group._id);

    socket.on("group_message", (msg) => {
      if (msg.group !== group._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("group_message_deleted", ({ id }) => {
      setMessages((prev) => prev.filter((m) => m._id !== id));
    });

    const loadHistory = async () => {
      try {
        const data = await API.getGroupMessages(group._id);
        if (Array.isArray(data)) setMessages(data);
        else setMessages([]);
      } catch (e) {
        setMessages([]);
      }
    };
    loadHistory();

    return () => {
      if (socket) {
        socket.off("group_message");
        socket.off("group_message_deleted");
      }
    };
  }, [currentUser, group]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !group || !currentUser || !isMember) return;
    socket.emit("group_message", {
      groupId: group._id,
      from: currentUser._id,
      content: input.trim()
    });
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

  const handleRequestJoin = async () => {
    if (!group) return;
    await API.requestJoinGroup(group._id);
    alert(
      t("joinRequested") || "Join request sent. Wait for admin approval."
    );
    loadMembersInfo();
  };

  const handleApprove = async (userId) => {
    if (!group) return;
    await API.approveMember(group._id, userId);
    await loadMembersInfo();
  };

  const handleReject = async (userId) => {
    if (!group) return;
    await API.rejectMember(group._id, userId);
    await loadMembersInfo();
  };

  const handleRemoveMember = async (userId) => {
    if (!group) return;
    if (
      !window.confirm(
        t("confirmRemoveMember") || "Remove this member from group?"
      )
    )
      return;
    await API.removeMember(group._id, userId);
    await loadMembersInfo();
  };

  const handleDeleteGroupMessage = async (id) => {
    if (
      !window.confirm(
        t("confirmDeleteMessage") || "Delete this message?"
      )
    )
      return;
    await API.deleteGroupMessage(id);
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  if (!group) return null;

  const renderMembersPanel = () => {
    if (!membersInfo) return null;

    return (
      <div className="mb-3 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 space-y-2">
        {/* admin row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("admin") || "Admin"}
            </span>
            <span className="badge badge-sm bg-indigo-600/20 border-indigo-400 text-indigo-200">
              {membersInfo.admin?.name || membersInfo.admin?.email}
            </span>
          </div>
          <span className="badge badge-xs bg-amber-500/10 border-amber-400 text-amber-300">
            {t("groupOwner") || "Owner"}
          </span>
        </div>

        {/* members row */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("members") || "Members"}
            </span>
            <span className="badge badge-sm bg-slate-800 border-slate-600 text-slate-200">
              {membersInfo.members?.length || 0}
            </span>
          </div>
          {membersInfo.members && membersInfo.members.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {membersInfo.members.map((m) => (
                <div
                  key={m._id}
                  className="badge badge-sm bg-slate-800 border-slate-700 text-slate-100 flex items-center gap-1 rounded-full px-2"
                >
                  <span className="text-[11px]">
                    {m.name || m.email}
                  </span>
                  {isAdmin && m._id !== membersInfo.admin._id && (
                    <button
                      type="button"
                      className="btn btn-xxs btn-outline btn-warning rounded-full px-2"
                      onClick={() => handleRemoveMember(m._id)}
                    >
                      {t("removeMember") || "Remove"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              {t("noMembers") || "No members yet"}
            </p>
          )}
        </div>

        {/* pending */}
        {isAdmin && membersInfo.pendingMembers && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("pendingMembers") || "Pending requests"}
              </span>
              <span className="badge badge-sm bg-amber-500/10 border-amber-400 text-amber-300">
                {membersInfo.pendingMembers.length}
              </span>
            </div>
            {membersInfo.pendingMembers.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                {t("none") || "None"}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {membersInfo.pendingMembers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-950 border border-slate-800"
                  >
                    <span className="text-[11px] text-slate-100 truncate">
                      {u.name || u.email}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="btn btn-xxs btn-success btn-soft rounded-full px-2"
                        onClick={() => handleApprove(u._id)}
                      >
                        {t("approve") || "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-xxs btn-error btn-soft rounded-full px-2"
                        onClick={() => handleReject(u._id)}
                      >
                        {t("reject") || "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderJoinGate = () => {
    if (isMember) return null;

    const isPending =
      membersInfo &&
      membersInfo.pendingMembers &&
      currentUser &&
      membersInfo.pendingMembers.some((u) => u._id === currentUser._id);

    return (
      <div className="flex flex-col items-center justify-center h-52 text-center space-y-2 text-slate-100">
        <p className="text-sm">
          {isPending
            ? t("waitingApproval") ||
              "You have requested to join this group. Waiting for admin approval."
            : t("notMember") ||
              "You are not a member of this group."}
        </p>
        {!isPending && (
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-full px-5"
            onClick={handleRequestJoin}
          >
            {t("requestJoin") || "Request to join"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl h-[calc(100vh-4rem)] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col px-4 py-3">
      {/* header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
            #{group.name?.[0] || "G"}
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-slate-50">
              {group.name}
            </h2>
            {membersInfo && (
              <span className="text-[11px] text-slate-400">
                {isAdmin
                  ? t("youAreAdmin") || "You are admin"
                  : isMember
                  ? t("youAreMember") || "You are a member"
                  : t("youAreGuest") || "You are a guest"}
              </span>
            )}
          </div>
        </div>
      </div>

      {renderMembersPanel()}

      {!isMember ? (
        renderJoinGate()
      ) : (
        <>
          {/* messages (taller) */}
          <div className="flex-1 min-h-[18rem] mb-3 rounded-xl bg-slate-900 border border-slate-800 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t("noGroupMessages") || "No messages yet in this group."}
              </p>
            ) : (
              messages.map((m) => {
                const isMine = m.sender === currentUser._id;
                const canDelete = isMine || isAdmin;
                const dt = new Date(m.createdAt);
                const timeStr = dt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                });
                const nameToShow =
                  m.senderName ||
                  (isMine ? currentUser.name : t("someone") || "Someone");

                const avatarUrl =
                  m.avatarUrl ||
                  (isMine
                    ? currentUser.avatarUrl
                    : "https://img.daisyui.com/images/profile/demo/1@94.webp");
                const fallbackLetter =
                  nameToShow?.charAt(0)?.toUpperCase() || "?";

                const statusText = m.seen
                  ? `✔✔ ${t("seen") || "Seen"}`
                  : `✔ ${t("delivered") || "Delivered"}`;

                return (
                  <div
                    key={m._id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex max-w-[80%] gap-2 items-end">
                      {!isMine && (
                        <div className="w-8 h-8 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center text-xs text-slate-100">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={nameToShow}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{fallbackLetter}</span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5 items-start">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-200">
                            {nameToShow}
                          </span>
                          <span>{timeStr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={`px-3 py-1.5 rounded-2xl text-xs shadow-md ${
                              isMine
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-slate-800 text-slate-100 rounded-bl-none"
                            }`}
                          >
                            {m.content}
                          </div>
                          <div className="dropdown dropdown-end">
                            <button
                              type="button"
                              tabIndex={0}
                              className="btn btn-ghost btn-[10px] btn-circle text-slate-300 hover:bg-slate-800"
                            >
                              ⋮
                            </button>
                            <ul
                              tabIndex={-1}
                              className="dropdown-content menu menu-xs bg-slate-900 rounded-xl border border-slate-700 z-[1] w-40 p-1 shadow"
                            >
                              <li>
                                <button
                                  type="button"
                                  onClick={() => speakMessage(m.content)}
                                >
                                  🔊 {t("listenMessage") || "Listen"}
                                </button>
                              </li>
                              {canDelete && m._id && (
                                <li>
                                  <button
                                    type="button"
                                    className="text-error"
                                    onClick={() =>
                                      handleDeleteGroupMessage(m._id)
                                    }
                                  >
                                    🗑 {t("deleteMessage") || "Delete"}
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                        <span
                          className={`mt-0.5 text-[9px] ${
                            m.seen ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* input */}
          <form className="flex gap-2" onSubmit={handleSend}>
            <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-2xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/60 transition">
              <input
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
                placeholder={
                  listening
                    ? t("listening") || "Listening..."
                    : t("groupMessagePlaceholder") ||
                      "Type a group message..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="button"
                className={`ml-1 rounded-full p-1.5 text-lg ${
                  listening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-indigo-300 hover:bg-slate-800"
                } transition`}
                onClick={handleVoiceInput}
              >
                🎤
              </button>
            </div>
            <button
              className="btn btn-sm rounded-2xl bg-indigo-600 border-0 text-white px-4 hover:bg-indigo-500"
              type="submit"
            >
              {t("send")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default GroupChatBox;
