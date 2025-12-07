import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PeoplePage from "./pages/PeoplePage";
import ChatBox from "./components/ChatBox";
import GroupsPage from "./pages/GroupsPage";
import GroupChatBox from "./components/GroupChatBox";
import WelcomePage from "./pages/WelcomePage";
import "./i18n";

function App() {
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setShowProfile(false);
    setShowPeople(false);
    setShowGroups(false);
    setActiveChatUser(null);
    setActiveGroup(null);
  };

  const showWelcome =
    !showProfile && !showPeople && !showGroups && !activeChatUser && !activeGroup;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "url('https://www.shutterstock.com/shutterstock/videos/3733859641/thumb/1.jpg?ip=x480')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenProfile={(v) => {
          setShowProfile(v);
          if (v) {
            setShowPeople(false);
            setShowGroups(false);
            setActiveChatUser(null);
            setActiveGroup(null);
          }
        }}
        onOpenPeople={(v) => {
          setShowPeople(v);
          if (v) {
            setShowProfile(false);
            setShowGroups(false);
            setActiveGroup(null);
          }
        }}
        onOpenGroups={(v) => {
          setShowGroups(v);
          if (v) {
            setShowProfile(false);
            setShowPeople(false);
            setActiveChatUser(null);
          }
        }}
        onResetActiveChats={() => {
          setActiveChatUser(null);
          setActiveGroup(null);
        }}
      />

      {user ? (
        showWelcome ? (
          <div className="w-full min-h-[calc(100vh-70px)] flex justify-center items-center px-4">
            <WelcomePage
              user={user}
              onOpenPeople={() => {
                setShowPeople(true);
                setShowProfile(false);
                setShowGroups(false);
                setActiveChatUser(null);
                setActiveGroup(null);
              }}
              onOpenGroups={() => {
                setShowGroups(true);
                setShowProfile(false);
                setShowPeople(false);
                setActiveChatUser(null);
                setActiveGroup(null);
              }}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6 flex gap-4 h-[calc(100vh-70px)]">
            {/* LEFT - People / Groups Sidebar */}
            <div className="w-80 flex-shrink-0">
              {showPeople && (
                <PeoplePage
                  onOpenChat={(otherUser) => setActiveChatUser(otherUser)}
                  activeChatUser={activeChatUser}
                />
              )}

              {showGroups && (
                <GroupsPage
                  onOpenGroupChat={(g) => {
                    setActiveChatUser(null);
                    setActiveGroup(g);
                  }}
                />
              )}
            </div>
 {showProfile && <ProfilePage />}
            {/* RIGHT - Chat / Profile / Placeholder */}
            <div className="flex-1 flex flex-col">
            {!activeChatUser && !activeGroup && !showProfile && (
                <div className="flex-1 flex justify-center items-center bg-base-200 rounded-lg">
                  <h2 className="text-center text-base-content/70 p-4 font-semibold">
                    {t("startChatHint") ||
                      "Select a contact to start chatting."}
                  </h2>
                </div>
              )}
              {activeChatUser && !activeGroup && (
                <ChatBox currentUser={user} otherUser={activeChatUser} />
              )}
              {activeGroup && <GroupChatBox currentUser={user} group={activeGroup} />}
            </div>
          </div>
        )
      ) : (
        // LOGIN / REGISTER
        <div className="flex flex-col items-center justify-start py-10 gap-4">
          <div className="card w-full max-w-md bg-gray-500 shadow-2xl">
            <div className="card-body text-white">
              <div className="flex justify-center gap-2 mb-4">
                <button
                  className={`btn btn-sm ${showLogin ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setShowLogin(true)}
                >
                  {t("login")}
                </button>
                <button
                  className={`btn btn-sm ${!showLogin ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setShowLogin(false)}
                >
                  {t("register")}
                </button>
              </div>

              {showLogin ? (
                <LoginPage onLogin={setUser} />
              ) : (
                <RegisterPage onSuccess={() => setShowLogin(true)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
