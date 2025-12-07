import { useEffect, useState } from "react";
import { API } from "../api";
import { useTranslation } from "react-i18next";

function PeoplePage({ onOpenChat, activeChatUser, currentUser }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const DEFAULT_DISPLAY_LIMIT = 5;

  const load = async () => {
    setLoading(true);
    setError("");
    const data = await API.getPeople();

    if (Array.isArray(data)) {
      setPeople(data);
    } else if (data.message) {
      setError(data.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (type, id, e) => {
    e.stopPropagation();
    setActionLoadingId(id);

    if (type === "send") await API.sendRequest(id);
    if (type === "accept") await API.acceptRequest(id);
    if (type === "ignore") await API.ignoreRequest(id);

    setActionLoadingId(null);
    load();
  };

  let filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!searchTerm) {
    filteredPeople = filteredPeople.slice(0, DEFAULT_DISPLAY_LIMIT);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="h-full rounded-3xl overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.7)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-white/10 flex">

      {/* LEFT PANEL */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-slate-950/70 backdrop-blur-xl">

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-indigo-500/40">
            💬
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-50">
              {t("people") || "People"}
            </span>
            <span className="text-[11px] text-slate-400">
              {t("peopleSubtitle") || "Find and chat with others"}
            </span>
          </div>
        </div>

        {/* Search Box */}
        <div className="px-3 pt-3 pb-2 border-b border-white/10">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder={t("searchPeople") || "Search people..."}
              className="input input-sm w-full pl-8 bg-slate-900/80 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 rounded-2xl focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-400 mt-1">{error}</p>
          )}
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredPeople.length === 0 ? (
            <p className="text-xs text-slate-400 p-4">
              {t("noOtherUsers") || "No other users found."}
            </p>
          ) : (
            <ul>
              {filteredPeople.map((p) => (
                <li
                  key={p._id}
                  className={`flex items-center gap-3 px-3 py-2 transition ${
                    p.status === "friends"
                      ? "cursor-pointer hover:bg-slate-900/40"
                      : "cursor-not-allowed opacity-60"
                  }`}
                  onClick={() => {
                    if (p.status === "friends") onOpenChat(p);
                  }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-800">
                      <img
                        src={
                          p.avatarUrl ||
                          "https://img.daisyui.com/images/profile/demo/1@94.webp"
                        }
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {p.status === "friends" && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-xs text-slate-50 truncate">
                        {p.name}
                      </span>

                      {p.status === "friends" && (
                        <span className="badge badge-success badge-outline text-[9px] border-emerald-400/60 text-emerald-300 bg-emerald-400/10">
                          {t("Chat") || "Chat"}
                        </span>
                      )}

                      {p.status === "request_sent" && (
                        <span className="badge badge-info badge-outline text-[9px] bg-cyan-500/10 border-cyan-400/60 text-cyan-300">
                          {t("requestSent") || "Request sent"}
                        </span>
                      )}

                      {p.status === "request_received" && (
                        <span className="badge badge-warning badge-outline text-[9px] bg-amber-500/10 border-amber-400/60 text-amber-300">
                          {t("requestReceived") || "Request received"}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {p.bio || t("noBio") || "No bio yet."}
                    </p>

                    {/* Buttons */}
                    <div className="mt-2 flex gap-2">

                      {p.status === "none" && (
                        <button
                          onClick={(e) => handleAction("send", p._id, e)}
                          className="btn btn-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl"
                          disabled={actionLoadingId === p._id}
                        >
                          {actionLoadingId === p._id
                            ? t("sending") || "Sending..."
                            : t("connect") || "Connect"}
                        </button>
                      )}

                      {p.status === "request_received" && (
                        <>
                          <button
                            onClick={(e) =>
                              handleAction("accept", p._id, e)
                            }
                            className="btn btn-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                            disabled={actionLoadingId === p._id}
                          >
                            {t("accept") || "Accept"}
                          </button>
                          <button
                            onClick={(e) =>
                              handleAction("ignore", p._id, e)
                            }
                            className="btn btn-xs bg-red-600 hover:bg-red-500 text-white rounded-xl"
                            disabled={actionLoadingId === p._id}
                          >
                            {t("ignore") || "Ignore"}
                          </button>
                        </>
                      )}

                      {p.status === "friends" && (
                        <button
                          onClick={() => onOpenChat(p)}
                          className="btn btn-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                        >
                          {t("message") || "Message"}
                        </button>
                      )}
                    </div>

                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-3 py-2 border-t border-white/10 text-[10px] text-slate-500 bg-slate-950/80">
          {t("tipStartChat") || "Tip: click a user to open chat."}
        </div>
      </div>

      {/* RIGHT SIDE ChatBox mounts in parent */}
    </div>
  );
}

export default PeoplePage;
