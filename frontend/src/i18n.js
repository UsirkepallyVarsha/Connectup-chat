import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      appName: "DivTinder Social",
      loginTitle: "Login to your account",
      registerTitle: "Create an account",
      login: "Login",
      register: "Register",
      logout: "Logout",
      profile: "Profile",
      people: "People",
      groups: "Groups",
      email: "Email",
      password: "Password",
      name: "Name",
      createAccount: "Create account",
      send: "Send",
      connect: "Connect",
      chat: "Chat"
    }
  },
  hi: {
    translation: {
      appName: "DivTinder सोशल",
      loginTitle: "अपने अकाउंट में लॉगिन करें",
      registerTitle: "नया अकाउंट बनाएं",
      login: "लॉगिन",
      register: "रजिस्टर",
      logout: "लॉगआउट",
      profile: "प्रोफ़ाइल",
      people: "लोग",
      groups: "ग्रुप",
      email: "ईमेल",
      password: "पासवर्ड",
      name: "नाम",
      createAccount: "अकाउंट बनाएं",
      send: "भेजें",
      connect: "कनेक्ट",
      chat: "चैट"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
