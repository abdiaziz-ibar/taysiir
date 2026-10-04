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

const readSaved = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGS.some((l) => l.code === saved) ? saved : "so";
  } catch {
    return "so";
  }
};

let current = readSaved();

// Arabic is written right-to-left: flip the whole page layout with the language.
const applyToDocument = () => {
  document.documentElement.lang = current;
  document.documentElement.dir = current === "ar" ? "rtl" : "ltr";
};
applyToDocument();

const listeners = new Set();
export const subscribeLang = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getLang = () => current;
export const isRTL = () => current === "ar";

export const setLang = (code) => {
  if (!LANGS.some((l) => l.code === code) || code === current) return;
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* private mode: the choice just won't persist */
  }
  applyToDocument();
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
