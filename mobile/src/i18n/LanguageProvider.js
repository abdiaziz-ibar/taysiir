import { Fragment, useEffect, useState } from "react";
import { getLang, loadLang, subscribeLang } from "./index";

// Loads the saved language first, then remounts the whole tree whenever it changes so
// every t() call runs again (strings are looked up while rendering, not stored in state).
const LanguageProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    loadLang().then(() => {
      setLangState(getLang());
      setReady(true);
    });
    return subscribeLang(setLangState);
  }, []);

  if (!ready) return null;
  return <Fragment key={lang}>{children}</Fragment>;
};

export default LanguageProvider;
