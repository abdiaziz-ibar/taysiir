import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./en";
import ar from "./ar";

// Languages the app can be shown in. Somali is the source language: every UI
// string in the code is its own key, so Somali needs no dictionary and a missing
// translation simply falls back to the original text.
export const LANGS = [
  { code: "so", label: "Soomaali", short: "SO" },
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "ع" },
];

const STORAGE_KEY = "lang";
const DICTS = { en, ar };

let current = "so";
const listeners = new Set();

export const subscribeLang = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getLang = () => current;
export const isRTL = () => current === "ar";

// Arabic is right-to-left. React Native only applies the layout direction on the next
// launch, so after a change the app asks the user to close and reopen it.
const syncDirection = () => {
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== (current === "ar")) I18nManager.forceRTL(current === "ar");
};
export const needsRestart = () => I18nManager.isRTL !== (current === "ar");

// Reads the saved language before the first screen renders.
export const loadLang = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (LANGS.some((l) => l.code === saved)) current = saved;
  } catch {
    /* keep Somali */
  }
  syncDirection();
  return current;
};

export const setLang = async (code) => {
  if (!LANGS.some((l) => l.code === code) || code === current) return;
  current = code;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* the choice just won't persist */
  }
  syncDirection();
  listeners.forEach((fn) => fn(code));
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Keys with {placeholders} double as patterns, so a finished server message such as
// "Waxaa kuu hadhay 2 isku day." can be matched back to "Waxaa kuu hadhay {n} isku day.".
const templateCache = {};
const templatesFor = (code) => {
  if (!templateCache[code]) {
    templateCache[code] = Object.keys(DICTS[code])
      .filter((k) => k.includes("{"))
      .map((key) => {
        const names = [];
        const source = escapeRegex(key).replace(/\\\{(\w+)\\\}/g, (_, name) => {
          names.push(name);
          return "(.+?)";
        });
        return { key, names, regex: new RegExp(`^${source}$`, "s") };
      })
      .sort((a, b) => b.key.length - a.key.length);
  }
  return templateCache[code];
};

// A value captured out of a finished server message may itself be translatable
// (a category such as "Koronto", or a month such as "October 2026").
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const translateCaptured = (value, dict) => {
  if (dict[value] !== undefined) return dict[value];
  return value.replace(new RegExp(`\\b(${MONTHS.join("|")})\\b`, "g"), (m) => dict[m] ?? m);
};

const interpolate = (text, params) =>
  params ? text.replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? params[name] : m)) : text;

// Translate a UI string (or a message from the server). `params` fills {placeholders}.
export const t = (key, params) => {
  if (typeof key !== "string" || key === "") return key;
  const dict = DICTS[current];
  let out = key;
  if (dict) {
    if (dict[key] !== undefined) {
      out = dict[key];
    } else if (!params) {
      for (const { key: tpl, names, regex } of templatesFor(current)) {
        const m = regex.exec(key);
        if (m) {
          const found = {};
          names.forEach((n, i) => {
            found[n] = translateCaptured(m[i + 1], dict);
          });
          out = interpolate(dict[tpl], found);
          break;
        }
      }
    }
  }
  return interpolate(out, params);
};
