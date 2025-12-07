import { useEffect, useState } from "react";
import { API } from "../api";
import { useTranslation } from "react-i18next";

function GroupsPage({ onOpenGroupChat }) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", logoUrl: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    logoUrl: ""
  });

  const load = async () => {
    setLoading(true);
    const data = await API.getGroups();
    if (Array.isArray(data)) setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) return;
    setCreating(true);
    const g = await API.createGroup({
      name: form.name.trim(),
      description: form.description.trim(),
      logoUrl: form.logoUrl.trim()
    });
    setCreating(false);
    setForm({ name: "", description: "", logoUrl: "" });
    setGroups((prev) => [...prev, g]);
  };

  const startEdit = (g) => {
    setEditingId(g._id);
    setEditForm({
      name: g.name || "",
      description: g.description || "",
      logoUrl: g.logoUrl || ""
    });
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const saveEdit = async (id) => {
    if (!editForm.name.trim()) return;
    const updated = await API.updateGroup(id, {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      logoUrl: editForm.logoUrl.trim()
    });
    setGroups((prev) =>
      prev.map((g) => (g._id === id ? { ...g, ...updated } : g))
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleRequestJoin = async (g) => {
    await API.requestJoinGroup(g._id);
    alert(
      t("joinRequested") || "Join request sent. Wait for admin approval."
    );
    load();
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        t("confirmDeleteGroup") || "Delete this group?"
      )
    )
      return;
    await API.deleteGroup(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {/* TOP: create group */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-lg px-5 py-4 flex flex-col md:flex-row gap-6">
        {/* preview + button */}
        <div className="flex flex-col items-center gap-3">
          <div className="avatar">
            <div className="w-24 h-24 rounded-full ring ring-indigo-500 ring-offset-2 ring-offset-slate-950 overflow-hidden">
              <img
                src={
                  form.logoUrl ||
                  "https://img.daisyui.com/images/stock/photo-1635805737707-575885ab0820.webp"
                }
                alt="Group"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !form.name.trim()}
            className={`btn btn-primary btn-sm sm:btn-md rounded-full px-5 ${
              creating ? "loading" : ""
            }`}
          >
            {creating
              ? t("creatingGroup") || "Creating..."
              : t("createGroup") || "Create group"}
          </button>
        </div>

        {/* form */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-50">
                {t("newGroupTitle") || "Create a new group"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t("newGroupHint") ||
                  "Fill in the details and click Create to add a new group."}
              </p>
            </div>
          </div>

          <form className="space-y-2" onSubmit={handleCreate}>
            <input
              className="input input-sm w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 rounded-xl"
              name="name"
              value={form.name}
              onChange={handleCreateChange}
              placeholder={t("groupName") || "Group name"}
            />
            <input
              className="input input-sm w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 rounded-xl"
              name="logoUrl"
              value={form.logoUrl}
              onChange={handleCreateChange}
              placeholder={t("groupLogoUrl") || "Logo URL (optional)"}
            />
            <textarea
              className="textarea textarea-sm w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 rounded-xl"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleCreateChange}
              placeholder={t("groupDescription") || "Description (optional)"}
            />
            <button type="submit" className="hidden">
              submit
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM: groups list */}
      {groups.length === 0 ? (
        <p className="text-xs text-slate-400">
          {t("noGroups") || "No groups yet. Create one above."}
        </p>
      ) : (
        <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {t("groupsSubtitle") || "Your groups and available groups"}
            </span>
            <span className="badge badge-xs bg-slate-800 border-slate-700 text-slate-200">
              {groups.length}
            </span>
          </div>

          <div className="h-[calc(100%-2.5rem)] overflow-y-auto p-3 space-y-2">
            {groups.map((g) => (
              <div
                key={g._id}
                className="flex items-start gap-3 rounded-2xl bg-slate-900 border border-slate-800 px-3 py-3 hover:border-indigo-500/60 hover:bg-slate-900/90 transition"
              >
                {/* logo */}
                <div className="shrink-0">
                  <img
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    src={
                      g.logoUrl ||
                      "https://img.daisyui.com/images/profile/demo/3@94.webp"
                    }
                    alt={g.name}
                  />
                </div>

                {/* content */}
                <div className="flex-1 min-w-0">
                  {editingId === g._id ? (
                    <div className="space-y-1">
                      <input
                        className="input input-xs w-full bg-slate-950 border border-slate-700 text-[11px] text-slate-100 rounded-lg"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                      />
                      <input
                        className="input input-xs w-full bg-slate-950 border border-slate-700 text-[11px] text-slate-100 rounded-lg"
                        name="logoUrl"
                        value={editForm.logoUrl}
                        onChange={handleEditChange}
                        placeholder={t("groupLogoUrl") || "Logo URL"}
                      />
                      <textarea
                        className="textarea textarea-xs w-full bg-slate-950 border border-slate-700 text-[11px] text-slate-100 rounded-lg"
                        name="description"
                        rows={2}
                        value={editForm.description}
                        onChange={handleEditChange}
                        placeholder={t("groupDescription") || "Description"}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          type="button"
                          className="btn btn-xs btn-primary rounded-full px-3"
                          onClick={() => saveEdit(g._id)}
                        >
                          {t("save") || "Save"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost rounded-full px-3"
                          onClick={cancelEdit}
                        >
                          {t("cancel") || "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-slate-50 truncate">
                          {g.name}
                        </span>
                        {g.role === "admin" && (
                          <span className="badge badge-primary badge-outline text-[9px]">
                            {t("youAreAdmin") || "Admin"}
                          </span>
                        )}
                        {g.role === "member" && (
                          <span className="badge badge-success badge-outline text-[9px]">
                            {t("youAreMember") || "Member"}
                          </span>
                        )}
                        {g.role === "pending" && (
                          <span className="badge badge-warning badge-outline text-[9px]">
                            {t("waitingApproval") || "Pending"}
                          </span>
                        )}
                      </div>
                      {g.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {g.description}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* actions */}
                <div className="flex flex-col gap-1 items-end">
                  {(g.role === "admin" || g.role === "member") && (
                    <button
                      className="btn btn-xxs rounded-full bg-indigo-600 border-0 text-white px-3"
                      onClick={() => onOpenGroupChat(g)}
                    >
                      {t("openChat") || "Open chat"}
                    </button>
                  )}

                  {g.role === "none" && (
                    <button
                      className="btn btn-xxs btn-outline rounded-full px-3"
                      onClick={() => handleRequestJoin(g)}
                    >
                      {t("requestJoin") || "Request"}
                    </button>
                  )}

                  {g.role === "pending" && (
                    <button
                      className="btn btn-xxs btn-outline rounded-full px-3"
                      disabled
                    >
                      {t("waitingApproval") || "Requested"}
                    </button>
                  )}

                  {g.role === "admin" && editingId !== g._id && (
                    <button
                      type="button"
                      className="btn btn-xxs btn-outline rounded-full px-3"
                      onClick={() => startEdit(g)}
                    >
                      {t("editGroup") || "Edit"}
                    </button>
                  )}

                  {g.role === "admin" && (
                    <button
                      className="btn btn-xxs btn-error btn-outline rounded-full px-3"
                      onClick={() => handleDelete(g._id)}
                    >
                      {t("deleteGroup") || "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsPage;
