import { useState } from "react";
import { API } from "../api";
import { useTranslation } from "react-i18next";

function RegisterPage({ onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = await API.register(form);
    setLoading(false);

    if (data.message && !data._id) {
      setError(data.message);
    } else {
      onSuccess(); 
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 mx-auto mt-6">

        <legend className="fieldset-legend text-lg font-semibold">{t("Register")}</legend>

        {error && (
          <div className="alert alert-error py-2 text-sm mt-2">
            <span>{error}</span>
          </div>
        )}

        <label className="label mt-2">{t("name")}</label>
        <input
          className="input input-bordered"
          name="name"
          placeholder={t("Your name")}
          value={form.name}
          onChange={handleChange}
        />

        <label className="label mt-2">{t("email")}</label>
        <input
          className="input input-bordered"
          name="email"
          placeholder={t("you@example.com")}
          value={form.email}
          onChange={handleChange}
        />

        <label className="label mt-2">{t("password")}</label>
        <input
          type="password"
          className="input input-bordered"
          name="password"
          placeholder={t("Create a strong password")}
          value={form.password}
          onChange={handleChange}
        />

        <button
          type="submit"
          className={`btn btn-neutral w-full mt-4 ${loading ? "loading" : ""}`}
        >
          {t("createAccount")}
        </button>
      </fieldset>
    </form>
  );
}

export default RegisterPage;
