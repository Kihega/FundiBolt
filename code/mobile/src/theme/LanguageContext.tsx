import React, { createContext, useContext, useMemo, useState } from "react";

export type Language = "en" | "sw";

// Only covers strings inside the screens/components owned by a logged-in
// customer (home shell, side menu, account, bookings, messages) - the
// pre-login flow (welcome/login/signup/OTP) is out of scope here, per the
// request this was built for ("the app - starting in homepage and other
// screens owned by that user logged in only - will change to the
// selected language"). Falls back to the key itself if a translation is
// ever missing, so a typo'd key shows up obviously instead of crashing.
const STRINGS: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.bookings": "Bookings",
    "nav.messages": "Messages",
    "nav.account": "Account",

    "search.placeholder": "Search Technician",

    "sideMenu.viewProfile": "View Profile",
    "sideMenu.changePassword": "Change Password",
    "sideMenu.changeLanguage": "Change Language",
    "sideMenu.changeTheme": "Change Theme",
    "sideMenu.needSupport": "Customer Services",

    "language.english": "English",
    "language.swahili": "Swahili",

    "theme.dark": "Dark",
    "theme.light": "Light",

    "changePassword.title": "Change Password",
    "changePassword.oldPassword": "Old Password",
    "changePassword.newPassword": "New Password",
    "changePassword.confirmPassword": "Confirm New Password",
    "changePassword.forgotPassword": "Forgot password?",
    "changePassword.confirm": "Confirm",
    "changePassword.close": "Close",
    "changePassword.fillAllFields": "Please fill in all fields.",
    "changePassword.tooShort": "New password must be at least 6 characters.",
    "changePassword.mismatch": "New password and confirmation don't match.",
    "changePassword.success": "Your password has been changed.",

    "account.title": "Account",
    "account.roleLabel.customer": "Customer Account",
    "account.roleLabel.fundi": "Technician Account",
    "account.roleLabel.admin": "Admin Account",
    "account.name": "Full Name",
    "account.email": "Email",
    "account.phone": "Phone Number",
    "account.notProvided": "Not provided",
    "account.uploadPhoto": "Upload profile photo",
    "account.addPhotoTitle": "Add Profile Photo",
    "account.takePhoto": "Take Photo",
    "account.chooseFromGallery": "Choose from Gallery",
    "account.uploading": "Uploading...",
    "account.uploadFailed": "Could not upload your photo. Please try again.",
    "account.photoPermissionDenied": "FundiBolt needs permission to use your camera or photos to set a profile picture. You can allow this in your phone's Settings.",
    "account.submit": "Submit",
    "account.cancel": "Cancel",
    "account.logout": "Log Out",

    "bookings.title": "My Bookings",
    "bookings.empty": "You don't have any bookings yet. Once you book a technician, it'll show up here.",
    "bookings.status.active": "Active",
    "bookings.status.pending": "Pending",
    "bookings.status.rejected": "Rejected",

    "messages.title": "Messages",
    "messages.empty": "No conversations yet.",
    "messages.inputPlaceholder": "Type a message...",
    "messages.send": "Send",
    "messages.delete": "Delete",
    "messages.back": "Back",
    "messages.supportAutoReply": "Thanks for reaching out - a support agent will be with you shortly.",
    "messages.technicianAutoReply": "Got it, thanks for the message!",

    "common.close": "Close",
  },
  sw: {
    "nav.home": "Nyumbani",
    "nav.bookings": "Oda",
    "nav.messages": "Ujumbe",
    "nav.account": "Akaunti",

    "search.placeholder": "Tafuta Fundi",

    "sideMenu.viewProfile": "Tazama Wasifu",
    "sideMenu.changePassword": "Badilisha Nywila",
    "sideMenu.changeLanguage": "Badilisha Lugha",
    "sideMenu.changeTheme": "Badilisha Mandhari",
    "sideMenu.needSupport": "Huduma kwa Wateja",

    "language.english": "Kiingereza",
    "language.swahili": "Kiswahili",

    "theme.dark": "Giza",
    "theme.light": "Mwanga",

    "changePassword.title": "Badilisha Nywila",
    "changePassword.oldPassword": "Nywila ya Zamani",
    "changePassword.newPassword": "Nywila Mpya",
    "changePassword.confirmPassword": "Thibitisha Nywila Mpya",
    "changePassword.forgotPassword": "Umesahau nywila?",
    "changePassword.confirm": "Thibitisha",
    "changePassword.close": "Funga",
    "changePassword.fillAllFields": "Tafadhali jaza sehemu zote.",
    "changePassword.tooShort": "Nywila mpya lazima iwe na herufi 6 au zaidi.",
    "changePassword.mismatch": "Nywila mpya na uthibitisho hazifanani.",
    "changePassword.success": "Nywila yako imebadilishwa.",

    "account.title": "Akaunti",
    "account.roleLabel.customer": "Akaunti ya Mteja",
    "account.roleLabel.fundi": "Akaunti ya Fundi",
    "account.roleLabel.admin": "Akaunti ya Msimamizi",
    "account.name": "Jina Kamili",
    "account.email": "Barua Pepe",
    "account.phone": "Namba ya Simu",
    "account.notProvided": "Haijawekwa",
    "account.uploadPhoto": "Pakia picha ya wasifu",
    "account.addPhotoTitle": "Ongeza Picha ya Wasifu",
    "account.takePhoto": "Piga Picha",
    "account.chooseFromGallery": "Chagua kwenye Galari",
    "account.uploading": "Inapakia...",
    "account.uploadFailed": "Imeshindwa kupakia picha yako. Tafadhali jaribu tena.",
    "account.photoPermissionDenied": "FundiBolt inahitaji ruhusa ya kutumia kamera au picha zako ili kuweka picha ya wasifu. Unaweza kuruhusu hili kwenye Mipangilio ya simu yako.",
    "account.submit": "Wasilisha",
    "account.cancel": "Ghairi",
    "account.logout": "Toka",

    "bookings.title": "Oda Zangu",
    "bookings.empty": "Huna oda bado. Ukishaweka oda kwa fundi, itaonekana hapa.",
    "bookings.status.active": "Inaendelea",
    "bookings.status.pending": "Inasubiri",
    "bookings.status.rejected": "Imekataliwa",

    "messages.title": "Ujumbe",
    "messages.empty": "Hakuna mazungumzo bado.",
    "messages.inputPlaceholder": "Andika ujumbe...",
    "messages.send": "Tuma",
    "messages.delete": "Futa",
    "messages.back": "Rudi",
    "messages.supportAutoReply": "Asante kwa kuwasiliana nasi - mtaalamu wa msaada atawasiliana nawe hivi karibuni.",
    "messages.technicianAutoReply": "Nimepokea, asante kwa ujumbe!",

    "common.close": "Funga",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // English by default, matching the app's current copy everywhere else.
  const [language, setLanguage] = useState<Language>("en");

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => STRINGS[language][key] ?? STRINGS.en[key] ?? key,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
