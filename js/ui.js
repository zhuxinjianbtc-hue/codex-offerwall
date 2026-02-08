export const I18N = {
  en: {
    appName: "Game Offer Wall",
    appTagline: "Play games and earn rewards",
    loginTab: "Login",
    registerTab: "Register",
    loginTitle: "Welcome Back",
    registerTitle: "Create Account",
    loginDesc: "Sign in to start earning rewards",
    registerDesc: "Get 100 bonus coins as a new user",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password (min 6 chars)",
    nicknamePlaceholder: "Nickname",
    loginButton: "Login",
    registerButton: "Register and claim 100 coins",
    guestButton: "Quick Guest Mode",
    welcomeBack: "Welcome back, {name}",
    newbieBonusTip: "New user bonus +100 coins credited",
    navTasks: "Tasks",
    navMyTasks: "My Tasks",
    navLeaderboard: "Leaderboard",
    navWallet: "Wallet",
    navProfile: "Profile",
    coins: "coins",
    searchTask: "Search task name",
    filterType: "Type",
    filterReward: "Reward",
    filterDevice: "Device",
    filterGeo: "GEO",
    typeAll: "All",
    typeRegister: "Register",
    typeDownload: "Download",
    typeSurvey: "Survey",
    typePurchase: "Purchase",
    typeTrial: "Trial",
    rewardDefault: "Default",
    rewardHigh: "High reward first",
    rewardEasy: "Low barrier first",
    deviceAll: "All devices",
    deviceIOS: "iOS",
    deviceAndroid: "Android",
    geoGlobal: "Global",
    geoUS: "United States",
    geoJapan: "Japan",
    geoSEA: "Southeast Asia",
    geoEurope: "Europe",
    featuredTasks: "Featured Offers",
    goNow: "GO",
    difficultyEasy: "Easy",
    difficultyMedium: "Medium",
    difficultyHard: "Hard",
    badgeHot: "Hot",
    badgeRecommend: "Recommended",
    badgeNew: "New",
    noTasks: "No tasks match the current filters",
    pullHint: "Pull to refresh",
    pullRelease: "Release to refresh",
    refreshed: "Task list refreshed",
    taskSteps: "Task Steps",
    requirements: "Requirements",
    visitNow: "Visit Now",
    confirmComplete: "Confirm Completion",
    submittedPending: "Submitted for review, expected in 24h (demo: ~5s)",
    alreadyPending: "Task is pending review",
    alreadyApproved: "Task already approved",
    jumpPartner: "Redirected to partner page (simulated)",
    similarTasks: "Similar Tasks",
    myTaskTitle: "My Tasks",
    tabInProgress: "In Progress",
    tabPending: "Pending",
    tabApproved: "Approved",
    tabRejected: "Rejected",
    noTaskRecord: "No task records yet, pick one from offer wall",
    rewardArrived: "Reward credited +{amount} coins",
    walletTitle: "Wallet Center",
    currentBalance: "Current Balance",
    cashApprox: "Approx",
    incomeExpense: "Coin Timeline",
    redeemCenter: "Redeem Center",
    minRedeem: "Minimum {points} coins",
    redeemHistory: "Redemption History",
    noLedger: "No coin records yet",
    noRedeem: "No redemption records yet",
    redeemConfirmTitle: "Confirm Redeem",
    redeemConfirmBody: "Spend {points} coins for {name}, continue?",
    redeemSuccess: "Redeem successful, sent to your account",
    insufficient: "Insufficient coins for this redeem option",
    leaderboardTitle: "Weekly Leaderboard TOP 20",
    rank: "Rank",
    player: "Player",
    weeklyPoints: "Weekly Points",
    yourRank: "Your Rank",
    profileTitle: "Profile",
    joinedAt: "Joined",
    totalEarned: "Total Earned",
    totalRedeemed: "Total Redeemed",
    inviteFriends: "Invite Friends",
    inviteCode: "Invite Code",
    inviteLink: "Invite Link",
    copy: "Copy",
    copied: "Copied to clipboard",
    inviteRule: "Earn 200 coins for each invited friend who finishes first task",
    settings: "Settings",
    notifyToggle: "Notifications",
    logout: "Log Out",
    faq: "FAQ",
    logoutConfirmTitle: "Confirm Logout",
    logoutConfirmBody: "You need to sign in again after logout. Continue?",
    confirm: "Confirm",
    cancel: "Cancel",
    guestName: "Guest",
    defaultUser: "Player",
    statusInProgress: "In Progress",
    statusPending: "Pending",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    openTime: "Submitted",
    doneTime: "Completed",
    partnerLandingTitle: "Partner Landing",
    partnerLandingHint: "This is a simulated partner destination. Return to submit task.",
    verificationNotice: "System checks pending tasks every second and auto-approves in 5s (demo)",
    taskCreated: "Task added to in-progress list",
    invalidEmail: "Please enter a valid email",
    invalidPassword: "Password must be at least 6 chars",
    loginFailed: "Wrong email or password",
    emailExists: "Email already registered",
    registerSuccess: "Registration complete",
    loginSuccess: "Login successful",
    guestEnter: "Entered guest mode",
    logoutDone: "Logged out"
  }
};

export function t(language, key, params = {}) {
  const langPack = I18N[language] || I18N.en;
  let content = langPack[key] || I18N.en[key] || key;
  Object.keys(params).forEach((paramKey) => {
    content = content.replace(`{${paramKey}}`, String(params[paramKey]));
  });
  return content;
}

export function pickText(value, language) {
  if (value && typeof value === "object") {
    return value[language] || value.en || value.zh || "";
  }
  return value || "";
}

export function formatDate(timestamp, language = "en") {
  if (!timestamp) return "-";
  const locale = language === "en" ? "en-US" : "en-US";
  return new Date(timestamp).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatCoins(value) {
  return Number(value || 0).toLocaleString();
}

export function animateNumber(element, targetValue, formatter = (v) => Math.floor(v).toLocaleString(), duration = 700) {
  if (!element) return;
  const safeTarget = Number.isFinite(targetValue) ? targetValue : 0;
  const fromValue = Number(element.dataset.value || 0);
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = fromValue + (safeTarget - fromValue) * eased;
    element.textContent = formatter(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.dataset.value = String(safeTarget);
      element.textContent = formatter(safeTarget);
    }
  };

  requestAnimationFrame(step);
}

export function showToast(message, type = "info", timeout = 2200) {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, timeout);
}

export function confirmModal(options) {
  const {
    title = "",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel"
  } = options || {};

  return new Promise((resolve) => {
    const root = document.getElementById("modal-root");
    if (!root) {
      resolve(false);
      return;
    }

    root.innerHTML = "";

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const titleEl = document.createElement("h3");
    titleEl.className = "modal-title";
    titleEl.textContent = title;

    const messageEl = document.createElement("p");
    messageEl.className = "modal-message";
    messageEl.textContent = message;

    const action = document.createElement("div");
    action.className = "modal-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn ghost";
    cancelBtn.type = "button";
    cancelBtn.textContent = cancelText;

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn primary";
    confirmBtn.type = "button";
    confirmBtn.textContent = confirmText;

    action.append(cancelBtn, confirmBtn);
    modal.append(titleEl, messageEl, action);
    overlay.append(modal);
    root.append(overlay);

    const close = (result) => {
      overlay.classList.remove("show");
      setTimeout(() => {
        root.innerHTML = "";
        resolve(result);
      }, 180);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(false);
    });
    cancelBtn.addEventListener("click", () => close(false));
    confirmBtn.addEventListener("click", () => close(true));

    requestAnimationFrame(() => overlay.classList.add("show"));
  });
}

export function spawnCelebration() {
  const root = document.getElementById("celebration-root");
  if (!root) return;

  root.innerHTML = "";
  root.classList.add("active");

  const count = 26;
  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("span");
    star.className = "confetti-star";
    star.textContent = i % 2 === 0 ? "✦" : "★";
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 0.24}s`;
    star.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;
    star.style.setProperty("--drift", `${(Math.random() - 0.5) * 140}px`);
    root.appendChild(star);
  }

  setTimeout(() => {
    root.classList.remove("active");
    root.innerHTML = "";
  }, 1450);
}

export function bindPullToRefresh(container, options) {
  if (!container) return () => {};

  const {
    getPullText = () => "Pull to refresh",
    getReleaseText = () => "Release to refresh",
    getDoneText = () => "Done",
    onRefresh = () => {}
  } = options || {};

  const indicator = document.createElement("div");
  indicator.className = "pull-indicator";
  indicator.textContent = getPullText();
  container.prepend(indicator);

  let startY = 0;
  let distance = 0;
  let tracking = false;

  const reset = () => {
    container.style.transform = "";
    indicator.classList.remove("show", "ready");
    indicator.textContent = getPullText();
    distance = 0;
    tracking = false;
  };

  const onTouchStart = (event) => {
    if (container.scrollTop > 0) return;
    startY = event.touches[0].clientY;
    tracking = true;
  };

  const onTouchMove = (event) => {
    if (!tracking) return;
    const currentY = event.touches[0].clientY;
    const delta = currentY - startY;
    if (delta <= 0) {
      reset();
      return;
    }

    distance = Math.min(delta, 130);
    container.style.transform = `translateY(${distance * 0.35}px)`;
    indicator.classList.add("show");

    if (distance > 78) {
      indicator.classList.add("ready");
      indicator.textContent = getReleaseText();
    } else {
      indicator.classList.remove("ready");
      indicator.textContent = getPullText();
    }

    event.preventDefault();
  };

  const onTouchEnd = () => {
    if (!tracking) return;
    if (distance > 78) {
      indicator.textContent = getDoneText();
      onRefresh();
      setTimeout(() => {
        reset();
      }, 620);
    } else {
      reset();
    }
  };

  container.addEventListener("touchstart", onTouchStart, { passive: true });
  container.addEventListener("touchmove", onTouchMove, { passive: false });
  container.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    container.removeEventListener("touchstart", onTouchStart);
    container.removeEventListener("touchmove", onTouchMove);
    container.removeEventListener("touchend", onTouchEnd);
    indicator.remove();
  };
}
