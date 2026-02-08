const STORAGE_KEY = "game_offer_wall_store_v1";
const STORE_VERSION = 1;

const DEFAULT_AVATARS = ["😎", "🕹️", "🎮", "🚀", "🐉", "🏆", "🧠", "🎯", "🛡️", "⚔️"];

function randomAvatar() {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
}

function createInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createBaseUser(payload) {
  const now = Date.now();
  const id = payload.id || `u_${now}_${Math.floor(Math.random() * 10000)}`;
  const nickname = payload.nickname || "Player";
  const initialCoins = Number.isFinite(payload.balance) ? payload.balance : 0;

  return {
    id,
    email: payload.email || "",
    password: payload.password || "",
    nickname,
    avatar: payload.avatar || randomAvatar(),
    createdAt: payload.createdAt || now,
    isGuest: Boolean(payload.isGuest),
    balance: initialCoins,
    totalEarned: Number.isFinite(payload.totalEarned) ? payload.totalEarned : initialCoins,
    totalRedeemed: Number.isFinite(payload.totalRedeemed) ? payload.totalRedeemed : 0,
    invitationCode: payload.invitationCode || createInviteCode(),
    invitedCount: Number.isFinite(payload.invitedCount) ? payload.invitedCount : 0,
    settings: {
      notifications: payload.settings?.notifications !== false,
      language: "en"
    },
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    ledger: Array.isArray(payload.ledger) ? payload.ledger : [],
    redemptions: Array.isArray(payload.redemptions) ? payload.redemptions : []
  };
}

function normalizeUser(user) {
  return createBaseUser(user || {});
}

function normalizeStore(raw) {
  const store = {
    version: STORE_VERSION,
    users: [],
    currentUserId: null
  };

  if (!raw || typeof raw !== "object") return store;

  store.version = STORE_VERSION;
  store.users = Array.isArray(raw.users) ? raw.users.map(normalizeUser) : [];

  const hasCurrent = store.users.some((item) => item.id === raw.currentUserId);
  store.currentUserId = hasCurrent ? raw.currentUserId : null;

  return store;
}

export function loadStore() {
  try {
    const cache = localStorage.getItem(STORAGE_KEY);
    if (!cache) return normalizeStore(null);
    const parsed = JSON.parse(cache);
    return normalizeStore(parsed);
  } catch (error) {
    return normalizeStore(null);
  }
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getCurrentUser(store) {
  if (!store?.currentUserId) return null;
  return store.users.find((user) => user.id === store.currentUserId) || null;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function registerUser(store, payload) {
  const email = String(payload?.email || "").trim().toLowerCase();
  const password = String(payload?.password || "");
  const nickname = String(payload?.nickname || "").trim();

  if (!isValidEmail(email)) return { ok: false, error: "invalidEmail" };
  if (password.length < 6) return { ok: false, error: "invalidPassword" };

  const exists = store.users.some((user) => !user.isGuest && user.email.toLowerCase() === email);
  if (exists) return { ok: false, error: "emailExists" };

  const user = createBaseUser({
    email,
    password,
    nickname: nickname || "Player",
    isGuest: false,
    balance: 100,
    totalEarned: 100,
    settings: { notifications: true, language: "en" },
    ledger: [
      {
        id: `l_${Date.now()}`,
        type: "income",
        amount: 100,
        description: "New user bonus",
        createdAt: Date.now()
      }
    ]
  });

  store.users.push(user);
  store.currentUserId = user.id;

  return { ok: true, user };
}

export function loginUser(store, payload) {
  const email = String(payload?.email || "").trim().toLowerCase();
  const password = String(payload?.password || "");

  const user = store.users.find(
    (item) => !item.isGuest && item.email.toLowerCase() === email && item.password === password
  );

  if (!user) return { ok: false, error: "loginFailed" };

  store.currentUserId = user.id;
  return { ok: true, user };
}

export function loginGuest(store) {
  const existedGuest = store.users.find((user) => user.isGuest);
  if (existedGuest) {
    store.currentUserId = existedGuest.id;
    return { ok: true, user: existedGuest };
  }

  const user = createBaseUser({
    id: "guest_local",
    email: "",
    password: "",
    nickname: "Guest",
    isGuest: true,
    balance: 100,
    totalEarned: 100,
    settings: { notifications: true, language: "en" },
    ledger: [
      {
        id: `l_${Date.now()}`,
        type: "income",
        amount: 100,
        description: "Guest starter coins",
        createdAt: Date.now()
      }
    ]
  });

  store.users.push(user);
  store.currentUserId = user.id;
  return { ok: true, user };
}

export function enforceGuestMode(store) {
  if (!store || typeof store !== "object") return null;

  let guest = store.users.find((user) => user.isGuest);

  if (!guest && store.currentUserId) {
    const current = store.users.find((user) => user.id === store.currentUserId);
    if (current) {
      current.isGuest = true;
      current.email = "";
      current.password = "";
      current.settings.language = "en";
      guest = current;
    }
  }

  if (!guest) {
    const now = Date.now();
    guest = createBaseUser({
      id: "guest_local",
      email: "",
      password: "",
      nickname: "Guest",
      isGuest: true,
      balance: 100,
      totalEarned: 100,
      settings: { notifications: true, language: "en" },
      ledger: [
        {
          id: `l_${now}`,
          type: "income",
          amount: 100,
          description: "Guest starter coins",
          createdAt: now
        }
      ]
    });
  }

  store.users = [guest];
  store.currentUserId = guest.id;
  return guest;
}

export function logout(store) {
  store.currentUserId = null;
}

export function setUserLanguage(user) {
  if (!user) return;
  user.settings.language = "en";
}

export function addLedger(user, entry) {
  if (!user) return;
  user.ledger.unshift({
    id: entry.id || `l_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: entry.type || "income",
    amount: Number(entry.amount) || 0,
    description: entry.description || "Coin change",
    createdAt: entry.createdAt || Date.now()
  });
}

export function addTaskRecord(user, task, status = "in_progress") {
  if (!user || !task) return null;
  const existed = user.tasks.find((record) => record.taskId === task.id);
  if (existed) return existed;

  const now = Date.now();
  const record = {
    id: `tr_${now}_${Math.floor(Math.random() * 1000)}`,
    taskId: task.id,
    reward: task.reward,
    status,
    startedAt: now,
    submittedAt: null,
    completedAt: null,
    rejectedAt: null,
    rewarded: false,
    updatedAt: now
  };

  user.tasks.unshift(record);
  return record;
}

export function getTaskRecord(user, taskId) {
  if (!user) return null;
  return user.tasks.find((record) => record.taskId === taskId) || null;
}

export function submitTask(user, task) {
  if (!user || !task) return { ok: false };
  const record = getTaskRecord(user, task.id) || addTaskRecord(user, task, "in_progress");

  if (record.status === "approved") {
    return { ok: false, code: "alreadyApproved", record };
  }

  if (record.status === "pending") {
    return { ok: false, code: "alreadyPending", record };
  }

  const now = Date.now();
  record.status = "pending";
  record.submittedAt = now;
  record.updatedAt = now;

  return { ok: true, record };
}

export function approveTask(user, record, task) {
  if (!user || !record || !task) return false;
  if (record.status !== "pending") return false;

  const now = Date.now();
  record.status = "approved";
  record.completedAt = now;
  record.updatedAt = now;

  if (!record.rewarded) {
    record.rewarded = true;
    user.balance += task.reward;
    user.totalEarned += task.reward;

    addLedger(user, {
      type: "income",
      amount: task.reward,
      description: `Task reward: ${task.name || task.id}`,
      createdAt: now
    });
  }

  return true;
}
