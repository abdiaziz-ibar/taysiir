import { Fragment, useEffect, useState } from "react";
import { getLang, subscribeLang } from "./index";

// Remounts the whole tree when the language changes, so every t() call runs again
// (strings are looked up while rendering, not stored in state).
const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(getLang());
  useEffect(() => subscribeLang(setLang), []);
  return <Fragment key={lang}>{children}</Fragment>;
};

export default LanguageProvider;
