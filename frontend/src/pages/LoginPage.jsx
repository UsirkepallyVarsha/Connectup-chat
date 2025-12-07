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
    <form onSubmit={handleSubmit}>
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 mx-auto mt-6">

        <legend className="fieldset-legend text-lg font-semibold">{t("Login")}</legend>

        {error && (
          <div className="alert alert-error py-2 text-sm mt-2">
            <span>{error}</span>
          </div>
        )}

        <label className="label mt-2">{t("email")}</label>
        <input
          type="email"
          className="input input-bordered"
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
        />

        <label className="label mt-2">{t("password")}</label>
        <input
          type="password"
          className="input input-bordered"
          name="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
        />

        <button
          type="submit"
          className={`btn btn-neutral w-full mt-4 ${loading ? "loading" : ""}`}
        >
          {t("login")}
        </button>
      </fieldset>
    </form>
  );
}

export default LoginPage;
