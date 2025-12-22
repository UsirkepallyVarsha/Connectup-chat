import { useState } from "react";
import { API } from "../api";
import { useTranslation } from "react-i18next";

function LoginPage({ onLogin }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = await API.login(form);
    setLoading(false);

    if (data.message && !data.token) {
      setError(data.message);
    } else {
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700 px-4">
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-base-200 rounded-xl shadow-xl p-6 space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">
        {t("Login")}
      </h2>

      {error && (
        <div className="alert alert-error py-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t("email")}</span>
        </label>
        <input
          type="email"
          className="input input-bordered w-full"
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t("password")}</span>
        </label>
        <input
          type="password"
          className="input input-bordered w-full"
          name="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        className={`btn btn-neutral w-full ${loading ? "loading" : ""}`}
      >
        {t("login")}
      </button>
    </form>
  </div>
);

}

export default LoginPage;
