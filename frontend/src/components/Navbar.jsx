import { useTranslation } from "react-i18next";

function Navbar({ user, onLogout, onOpenProfile, onOpenPeople, onOpenGroups, onResetActiveChats }) {
  const { t, i18n } = useTranslation();
  const changeLang = (lng) => i18n.changeLanguage(lng);

  return (
    <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center px-4 py-2 md:py-3">
        {/* Logo */}
        <div className="flex-1">
          <button
            className="text-2xl font-extrabold tracking-wide hover:scale-105 hover:text-yellow-300 transition-transform"
            onClick={() => {
              onOpenProfile(false);
              onOpenPeople(false);
              onOpenGroups(false);
              onResetActiveChats();
            }}
          >
            {t("ChatConnect")}
          </button>
        </div>

        {/* Buttons / Dropdowns */}
        <div className="flex-none flex items-center gap-2 md:gap-4">
          <button
            className="btn btn-sm btn-ghost hover:bg-white/20 transition-all"
            onClick={() => {
              onOpenProfile(false);
              onOpenPeople(false);
              onOpenGroups(false);
              onResetActiveChats();
            }}
          >
            🏠 {t("home") || "Home"}
          </button>

          {/* Language Selector */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm btn-ghost hover:bg-white/20 transition-all">
              🌐 {t("language")}
            </label>
            <ul className="dropdown-content menu p-3 min-w-[160px] shadow-xl bg-purple-900 text-white rounded-box">
              <li>
                <button className="hover:bg-purple-600 rounded-md transition" onClick={() => changeLang("en")}>
                  🇺🇸 {t("ENGLISH")}
                </button>
              </li>
              <li>
                <button className="hover:bg-purple-600 rounded-md transition" onClick={() => changeLang("hi")}>
                  🇮🇳 {t("HINDI")}
                </button>
              </li>
            </ul>
          </div>

          {/* User Dropdown */}
          {user && (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-circle btn-ghost hover:scale-105 transition-transform p-0">
                <div className="avatar w-10 h-10">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || "User"} className="rounded-full object-cover w-full h-full border border-purple-500" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white text-black flex items-center justify-center font-bold border border-purple-500">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
              </label>

              <ul className="dropdown-content menu mt-3 p-3 shadow-xl bg-purple-900 text-white rounded-box min-w-[160px]">
                <li>
                  <button
                    className="hover:bg-purple-700 transition rounded-md"
                    onClick={() => {
                      onOpenProfile(true);
                      onOpenPeople(false);
                      onOpenGroups(false);
                      onResetActiveChats();
                    }}
                  >
                    👤 {t("profile")}
                  </button>
                </li>
                <li>
                  <button className="hover:bg-red-600 hover:text-white text-red-400 transition rounded-md" onClick={onLogout}>
                    🚪 {t("logout")}
                  </button>
                </li>
              </ul>
            </div>
          )}

          {!user && <span className="text-sm opacity-70">{t("notLoggedIn")}</span>}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
