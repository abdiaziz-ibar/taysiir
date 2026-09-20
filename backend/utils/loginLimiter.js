// Locks a login identifier after MAX_ATTEMPTS wrong passwords for LOCK_MS.
// Kept in memory and keyed by identifier (not by DB row) so an unknown
// username is throttled exactly like a real one — otherwise the lock
// message would reveal which usernames exist. Counters reset on restart.
const MAX_ATTEMPTS = 3;
const LOCK_MS = 10 * 60 * 1000;

const store = new Map(); // key -> { count, lockedUntil, lastFailure }

const keyOf = (scope, id) => `${scope}:${String(id).trim().toLowerCase()}`;

const lockedMessage = (remainingMs) => {
  const minutes = Math.ceil(remainingMs / 60000);
  return `Isku day badan oo khaldan. Akoonka waa la xiray ${minutes} daqiiqo. Fadlan dib isku day markay dhamaato.`;
};

// Returns remaining lock time in ms, or 0 if not locked.
const getLockRemaining = (scope, id) => {
  const key = keyOf(scope, id);
  const entry = store.get(key);
  if (!entry || !entry.lockedUntil) return 0;
  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    store.delete(key);
    return 0;
  }
  return remaining;
};

// Records a wrong password. Returns { locked, remainingMs, attemptsLeft }.
const recordFailure = (scope, id) => {
  const key = keyOf(scope, id);
  const now = Date.now();
  const entry = store.get(key) || { count: 0, lockedUntil: 0, lastFailure: now };
  entry.count += 1;
  entry.lastFailure = now;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
    store.set(key, entry);
    return { locked: true, remainingMs: LOCK_MS, attemptsLeft: 0 };
  }
  store.set(key, entry);
  return { locked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS - entry.count };
};

const reset = (scope, id) => {
  store.delete(keyOf(scope, id));
};

// Currently locked identifiers, for the admin "unlock" screen.
const listLocked = () => {
  const now = Date.now();
  const out = [];
  for (const [key, entry] of store) {
    if (entry.lockedUntil > now) {
      const i = key.indexOf(":");
      out.push({ scope: key.slice(0, i), identifier: key.slice(i + 1), remainingMs: entry.lockedUntil - now });
    }
  }
  return out;
};

// Records a failure and returns the HTTP status + message to send back.
const failureResult = (scope, id, baseMessage) => {
  const r = recordFailure(scope, id);
  if (r.locked) return { status: 429, message: lockedMessage(r.remainingMs) };
  return { status: 401, message: `${baseMessage} Waxaa kuu hadhay ${r.attemptsLeft} isku day.` };
};

// Drop stale entries so random usernames can't grow the map forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    const expired = entry.lockedUntil ? entry.lockedUntil <= now : now - entry.lastFailure > LOCK_MS;
    if (expired) store.delete(key);
  }
}, 60 * 1000).unref();

module.exports = { getLockRemaining, failureResult, reset, listLocked, lockedMessage, MAX_ATTEMPTS, LOCK_MS };
