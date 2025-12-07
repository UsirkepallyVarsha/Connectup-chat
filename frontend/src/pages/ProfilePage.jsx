import { useEffect, useState } from "react";
import { API } from "../api";
import { useTranslation } from "react-i18next";

function ProfilePage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
    location: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await API.getMyProfile();
      if (data.message && !data._id) {
        setError(data.message);
      } else {
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          location: data.location || ""
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    const data = await API.updateMyProfile(form);
    setSaving(false);

    if (data.message && !data._id) {
      setError(data.message);
    } else {
      setMessage(t("profileUpdated") || "Profile updated successfully");
      setForm({
        name: data.name || "",
        bio: data.bio || "",
        avatarUrl: data.avatarUrl || "",
        location: data.location || ""
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral text-neutral-content flex items-center justify-center px-4">
      <div className="card card-side bg-base-100 text-base-content shadow-2xl max-w-4xl w-full border border-base-300/60">
        {/* LEFT SIDE - avatar strip with purple accent */}
        <figure className="p-6 flex flex-col items-center gap-4 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/40 text-primary-content">
          <div className="avatar">
            <div className="w-36 h-36 rounded-full ring ring-base-100 ring-offset-2 overflow-hidden">
              <img
                src={
                  form.avatarUrl ||
                  "https://img.daisyui.com/images/stock/photo-1635805737707-575885ab0820.webp"
                }
                alt="Profile"
              />
            </div>
          </div>

          <input
            className="input input-bordered input-sm w-40  h-20 text-xs bg-primary/20 border-primary/60 placeholder-primary-content/70"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="Avatar URL"
          />
        </figure>

        {/* RIGHT SIDE - Form */}
        <div className="card-body bg-base-100">
          <h2 className="card-title">
            {t("myProfile") || "My Profile"}
          </h2>

          {message && (
            <div className="alert alert-success py-2 text-sm mb-2">
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error py-2 text-sm mb-2">
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("name")}
                </span>
              </label>
              <input
                className="input input-bordered"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("bio") || "Bio"}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                name="bio"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                placeholder={
                  t("bioPlaceholder") ||
                  "Tell people something about yourself"
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("location") || "Location"}
                </span>
              </label>
              <input
                className="input input-bordered"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${saving ? "loading" : ""}`}
            >
              {t("saveChanges") || "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
