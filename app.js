import { TASKS, LEADERBOARD_SEED, FAQ_ITEMS } from "./data.js";
import {
  t,
  pickText,
  formatDate,
  formatCoins,
  animateNumber,
  showToast,
  confirmModal,
  spawnCelebration,
  bindPullToRefresh
} from "./ui.js";
import {
  loadStore,
  saveStore,
  getCurrentUser,
  logout,
  enforceGuestMode,
  addLedger,
  addTaskRecord,
  getTaskRecord,
  submitTask,
  approveTask
} from "./auth.js";
import { renderTasksPage, renderTaskDetailPage, renderMyTasksPage } from "./tasks.js";
import { renderWalletPage } from "./wallet.js";

const app = document.getElementById("app");
const nav = document.getElementById("bottom-nav");

let store = loadStore();
enforceGuestMode(store);
saveStore(store);
const ui = {
  taskSearch: "",
  type: "all",
  rewardSort: "default",
  device: "all",
  geo: "all",
  myTaskTab: "in_progress",
  faqOpenId: null
};

let cleanups = [];

const NAV_ITEMS = [
  { route: "#/tasks", routeName: "tasks", icon: "🎮", label: "navTasks" },
  { route: "#/my-tasks", routeName: "my-tasks", icon: "📌", label: "navMyTasks" },
  { route: "#/leaderboard", routeName: "leaderboard", icon: "🏆", label: "navLeaderboard" },
  { route: "#/wallet", routeName: "wallet", icon: "💰", label: "navWallet" },
  { route: "#/profile", routeName: "profile", icon: "👤", label: "navProfile" }
];

function currentUser() {
  return getCurrentUser(store);
}

function currentLanguage() {
  return "en";
}

function ensureUser() {
  const user = enforceGuestMode(store);
  persist();
  return user;
}

function tr(key, params) {
  return t(currentLanguage(), key, params);
}

function persist() {
  saveStore(store);
}

function patchUI(patch) {
  Object.assign(ui, patch);
}

function addCleanup(handler) {
  if (typeof handler === "function") cleanups.push(handler);
}

function clearCleanups() {
  cleanups.forEach((handler) => {
    try {
      handler();
    } catch (error) {
      // no-op
    }
  });
  cleanups = [];
}

function parseRoute() {
  const hash = location.hash || "#/tasks";
  if (hash.startsWith("#/task/")) {
    return { name: "task-detail", taskId: hash.slice("#/task/".length) };
  }

  const map = {
    "#/tasks": "tasks",
    "#/my-tasks": "my-tasks",
    "#/wallet": "wallet",
    "#/leaderboard": "leaderboard",
    "#/profile": "profile"
  };

  return { name: map[hash] || "tasks" };
}

function navigate(route) {
  if (location.hash === route) {
    renderRoute();
    return;
  }
  location.hash = route;
}

function renderBottomNav(routeName) {
  const user = currentUser();
  if (!user) {
    nav.classList.add("hidden");
    nav.innerHTML = "";
    return;
  }

  nav.classList.remove("hidden");
  nav.innerHTML = NAV_ITEMS.map((item) => {
    const active = item.routeName === routeName ? "active" : "";
    return `
      <a href="${item.route}" class="nav-item ${active}">
        <span>${item.icon}</span>
        <em>${t("en", item.label)}</em>
      </a>
    `;
  }).join("");
}

function startTask(task) {
  const user = currentUser();
  if (!user) return false;

  const exists = getTaskRecord(user, task.id);
  if (exists) return false;

  addTaskRecord(user, task, "in_progress");
  persist();
  return true;
}

function submitTaskAction(task) {
  const user = currentUser();
  if (!user) return { ok: false };

  const result = submitTask(user, task);
  if (result.ok) persist();
  return result;
}

function redeem(option) {
  const user = currentUser();
  if (!user) return { ok: false };

  if (user.balance < option.minimumPoints) {
    return { ok: false, code: "insufficient" };
  }

  const now = Date.now();
  user.balance -= option.minimumPoints;
  user.totalRedeemed += option.minimumPoints;
  user.redemptions.unshift({
    id: `rd_${now}_${Math.floor(Math.random() * 1000)}`,
    type: option.id,
    label: option.label,
    points: option.minimumPoints,
    createdAt: now,
    status: "done"
  });

  addLedger(user, {
    type: "expense",
    amount: option.minimumPoints,
    description: `Redeem: ${option.label}`,
    createdAt: now
  });

  persist();
  return { ok: true };
}

function processPendingTasks(notify = false) {
  const now = Date.now();
  let changed = false;
  let rewardDelta = 0;
  const activeUser = currentUser();

  store.users.forEach((user) => {
    user.tasks.forEach((record) => {
      if (record.status !== "pending") return;
      if (!record.submittedAt || now - record.submittedAt < 5000) return;

      const task = TASKS.find((item) => item.id === record.taskId);
      if (!task) return;

      const approved = approveTask(user, record, task);
      if (approved) {
        changed = true;
        if (activeUser && user.id === activeUser.id) {
          rewardDelta += task.reward;
        }
      }
    });
  });

  if (changed) {
    persist();
    if (notify && rewardDelta > 0) {
      showToast(tr("rewardArrived", { amount: formatCoins(rewardDelta) }), "success");
      spawnCelebration();
    }
  }

  return changed;
}

function createContext() {
  const user = currentUser();
  const language = currentLanguage();

  return {
    app,
    user,
    language,
    ui,
    tasks: TASKS,
    t: (key, params) => t(language, key, params),
    pickText,
    formatDate: (value) => formatDate(value, language),
    formatCoins,
    animateNumber,
    showToast,
    confirmModal,
    bindPullToRefresh,
    navigate,
    patchUI,
    addCleanup,
    getTaskRecord: (taskId) => getTaskRecord(user, taskId),
    startTask,
    submitTask: submitTaskAction,
    redeem
  };
}

function buildLeaderboardData(user) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const list = LEADERBOARD_SEED.map((item) => ({ ...item, isCurrent: false }));

  if (user) {
    const weekly = user.ledger
      .filter((item) => item.type === "income" && item.createdAt >= weekAgo)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    list.push({
      id: user.id,
      avatar: user.avatar,
      nickname: user.nickname,
      weeklyPoints: weekly,
      isCurrent: true
    });
  }

  list.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

  return list.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

function medalClass(rank) {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  return "";
}

function renderLeaderboardPage() {
  const user = currentUser();
  const language = currentLanguage();
  const board = buildLeaderboardData(user);
  const top20 = board.slice(0, 20);
  const current = user ? board.find((item) => item.id === user.id) : null;

  app.innerHTML = `
    <div class="view route-enter">
      <section class="card">
        <h1>${t(language, "leaderboardTitle")}</h1>
        <div class="leaderboard-table">
          <div class="leaderboard-head">
            <span>${t(language, "rank")}</span>
            <span>${t(language, "player")}</span>
            <span>${t(language, "weeklyPoints")}</span>
          </div>
          ${top20
            .map((item) => {
              return `
                <div class="leaderboard-row ${item.isCurrent ? "me" : ""} ${medalClass(item.rank)}">
                  <span>#${item.rank}</span>
                  <span class="player-cell">${item.avatar} ${item.nickname}</span>
                  <span>${formatCoins(item.weeklyPoints)}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      </section>

      ${
        current && current.rank > 20
          ? `
            <section class="card my-rank-card">
              <h3>${t(language, "yourRank")}</h3>
              <p>#${current.rank} · ${current.avatar} ${current.nickname} · ${formatCoins(current.weeklyPoints)}</p>
            </section>
          `
          : ""
      }
    </div>
  `;
}

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) {
    // fallback below
  }

  const temp = document.createElement("textarea");
  temp.value = value;
  document.body.appendChild(temp);
  temp.select();
  const ok = document.execCommand("copy");
  temp.remove();
  return ok;
}

function renderProfilePage() {
  const user = currentUser();
  if (!user) {
    navigate("#/tasks");
    return;
  }

  const language = currentLanguage();
  const inviteLink = `https://yourusername.github.io/game-offer-wall/#/invite/${user.invitationCode}`;

  app.innerHTML = `
    <div class="view route-enter">
      <section class="card profile-header">
        <div class="profile-main">
          <span class="avatar large">${user.avatar}</span>
          <div>
            <h1>${user.nickname}</h1>
            <p>${t(language, "joinedAt")}: ${formatDate(user.createdAt, language)}</p>
          </div>
        </div>

        <div class="profile-stats">
          <div>
            <p>${t(language, "totalEarned")}</p>
            <strong>${formatCoins(user.totalEarned)} ${t(language, "coins")}</strong>
          </div>
          <div>
            <p>${t(language, "totalRedeemed")}</p>
            <strong>${formatCoins(user.totalRedeemed)} ${t(language, "coins")}</strong>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>${t(language, "inviteFriends")}</h2>
        <div class="invite-row">
          <div>
            <p>${t(language, "inviteCode")}</p>
            <strong>${user.invitationCode}</strong>
          </div>
          <button type="button" class="btn tiny secondary" data-copy-code>${t(language, "copy")}</button>
        </div>
        <div class="invite-row">
          <div>
            <p>${t(language, "inviteLink")}</p>
            <strong class="invite-link">${inviteLink}</strong>
          </div>
          <button type="button" class="btn tiny secondary" data-copy-link>${t(language, "copy")}</button>
        </div>
        <p class="invite-tip">${t(language, "inviteRule")}</p>
      </section>

      <section class="card">
        <h2>${t(language, "settings")}</h2>
        <label class="setting-row">
          <span>${t(language, "notifyToggle")}</span>
          <input type="checkbox" data-notify-toggle ${user.settings.notifications ? "checked" : ""} />
        </label>
        <button type="button" class="btn danger block" data-logout>${t(language, "logout")}</button>
      </section>

      <section class="card faq-list">
        <h2>${t(language, "faq")}</h2>
        ${FAQ_ITEMS.map((item) => {
          const opened = ui.faqOpenId === item.id ? "open" : "";
          return `
            <article class="faq-item ${opened}">
              <button type="button" class="faq-question" data-faq-id="${item.id}">${pickText(item.question, language)}</button>
              <p class="faq-answer">${pickText(item.answer, language)}</p>
            </article>
          `;
        }).join("")}
      </section>
    </div>
  `;

  app.querySelector("[data-copy-code]")?.addEventListener("click", async () => {
    const ok = await copyText(user.invitationCode);
    if (ok) showToast(t(language, "copied"), "success");
  });

  app.querySelector("[data-copy-link]")?.addEventListener("click", async () => {
    const ok = await copyText(inviteLink);
    if (ok) showToast(t(language, "copied"), "success");
  });

  app.querySelector("[data-notify-toggle]")?.addEventListener("change", (event) => {
    user.settings.notifications = Boolean(event.target.checked);
    persist();
  });

  app.querySelector("[data-logout]")?.addEventListener("click", async () => {
    const ok = await confirmModal({
      title: t(language, "logoutConfirmTitle"),
      message: t(language, "logoutConfirmBody"),
      confirmText: t(language, "confirm"),
      cancelText: t(language, "cancel")
    });

    if (!ok) return;

    logout(store);
    enforceGuestMode(store);
    persist();
    showToast(t("en", "logoutDone"), "success");
    navigate("#/tasks");
  });

  app.querySelectorAll("[data-faq-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-faq-id");
      ui.faqOpenId = ui.faqOpenId === id ? null : id;
      renderProfilePage();
    });
  });
}

function renderRoute() {
  processPendingTasks(true);
  clearCleanups();

  const route = parseRoute();
  document.documentElement.lang = "en";
  ensureUser();

  renderBottomNav(route.name);

  const ctx = createContext();

  if (route.name === "tasks") {
    renderTasksPage(ctx);
    return;
  }

  if (route.name === "task-detail") {
    renderTaskDetailPage(ctx, route.taskId);
    return;
  }

  if (route.name === "my-tasks") {
    renderMyTasksPage(ctx);
    return;
  }

  if (route.name === "wallet") {
    renderWalletPage(ctx);
    return;
  }

  if (route.name === "leaderboard") {
    renderLeaderboardPage();
    return;
  }

  if (route.name === "profile") {
    renderProfilePage();
    return;
  }

  navigate("#/tasks");
}

window.addEventListener("hashchange", renderRoute);

window.addEventListener("load", () => {
  if (!location.hash || location.hash === "#/login") {
    location.hash = "#/tasks";
  }
  renderRoute();
});

setInterval(() => {
  if (processPendingTasks(true)) {
    renderRoute();
  }
}, 1000);
