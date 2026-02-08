const BADGE_WEIGHT = {
  hot: 3,
  recommend: 2,
  new: 1
};

let activePullCleanup = null;

const DIFFICULTY_SCORE = {
  easy: 1,
  medium: 2,
  hard: 3
};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function difficultyLabel(ctx, difficulty) {
  if (difficulty === "easy") return ctx.t("difficultyEasy");
  if (difficulty === "medium") return ctx.t("difficultyMedium");
  return ctx.t("difficultyHard");
}

function badgeLabel(ctx, badge) {
  if (badge === "hot") return ctx.t("badgeHot");
  if (badge === "recommend") return ctx.t("badgeRecommend");
  return ctx.t("badgeNew");
}

function typeLabel(ctx, type) {
  const map = {
    all: "typeAll",
    register: "typeRegister",
    download: "typeDownload",
    survey: "typeSurvey",
    purchase: "typePurchase",
    trial: "typeTrial"
  };
  return ctx.t(map[type] || "typeAll");
}

function deviceLabel(ctx, device) {
  const map = {
    all: "deviceAll",
    ios: "deviceIOS",
    android: "deviceAndroid"
  };
  return ctx.t(map[device] || "deviceAll");
}

function geoLabel(ctx, geo) {
  const map = {
    all: "geoGlobal",
    global: "geoGlobal",
    us: "geoUS",
    japan: "geoJapan",
    sea: "geoSEA",
    europe: "geoEurope"
  };
  return ctx.t(map[geo] || "geoGlobal");
}

function statusText(ctx, status) {
  const map = {
    in_progress: "statusInProgress",
    pending: "statusPending",
    approved: "statusApproved",
    rejected: "statusRejected"
  };
  return ctx.t(map[status] || "statusInProgress");
}

function statusClass(status) {
  const map = {
    in_progress: "status-progress",
    pending: "status-pending",
    approved: "status-approved",
    rejected: "status-rejected"
  };
  return map[status] || "status-progress";
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function sortTasks(tasks, rewardSort) {
  const arr = [...tasks];

  const rewardComparator = (a, b) => {
    if (rewardSort === "high") return b.reward - a.reward;
    if (rewardSort === "easy") {
      const aBarrier = DIFFICULTY_SCORE[a.difficulty] * 100 + a.etaMinutes;
      const bBarrier = DIFFICULTY_SCORE[b.difficulty] * 100 + b.etaMinutes;
      return aBarrier - bBarrier;
    }
    return b.reward - a.reward;
  };

  arr.sort((a, b) => {
    const badgeGap = (BADGE_WEIGHT[b.badge] || 0) - (BADGE_WEIGHT[a.badge] || 0);
    if (badgeGap !== 0) return badgeGap;
    return rewardComparator(a, b);
  });

  return arr;
}

function getFilteredTasks(ctx) {
  const state = ctx.ui;
  const keyword = normalizeSearch(state.taskSearch);

  const list = ctx.tasks.filter((task) => {
    const matchesType = state.type === "all" || task.type === state.type;
    const matchesDevice = state.device === "all" || task.device === state.device || task.device === "all";
    const matchesGeo = state.geo === "all" || task.geo === state.geo || task.geo === "global";

    const nameZh = normalizeSearch(task.name?.zh);
    const nameEn = normalizeSearch(task.name?.en);
    const matchesSearch = !keyword || nameZh.includes(keyword) || nameEn.includes(keyword);

    return matchesType && matchesDevice && matchesGeo && matchesSearch;
  });

  return sortTasks(list, state.rewardSort);
}

function renderFilterChips(ctx, title, group, options, selectedValue) {
  const chips = options
    .map((item) => {
      const active = selectedValue === item.value ? "active" : "";
      return `<button type="button" class="chip ${active}" data-filter-group="${group}" data-filter-value="${item.value}">${escapeHtml(item.label)}</button>`;
    })
    .join("");

  return `
    <div class="filter-line">
      <p class="filter-title">${escapeHtml(title)}</p>
      <div class="chip-scroll">
        ${chips}
      </div>
    </div>
  `;
}

function renderTaskCard(ctx, task) {
  const language = ctx.language;
  const record = ctx.getTaskRecord(task.id);
  const title = ctx.pickText(task.name, language);
  const description = ctx.pickText(task.description, language);
  const badge = badgeLabel(ctx, task.badge);

  return `
    <article class="task-card" data-task-card="${task.id}">
      <div class="task-card-head">
        <div class="task-icon">${task.icon}</div>
        <span class="task-badge badge-${task.badge}">${escapeHtml(badge)}</span>
      </div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description)}</p>
      <div class="task-meta-grid">
        <span class="task-reward">+${ctx.formatCoins(task.reward)} ${ctx.t("coins")}</span>
        <span class="task-chip">${escapeHtml(difficultyLabel(ctx, task.difficulty))}</span>
        <span class="task-chip">${escapeHtml(ctx.pickText(task.eta, language))}</span>
        <span class="task-chip">${escapeHtml(typeLabel(ctx, task.type))}</span>
      </div>
      <div class="task-card-foot">
        ${
          record
            ? `<span class="status-chip ${statusClass(record.status)}">${escapeHtml(statusText(ctx, record.status))}</span>`
            : "<span></span>"
        }
        <button type="button" class="btn tiny primary" data-go-task="${task.id}">${ctx.t("goNow")}</button>
      </div>
    </article>
  `;
}

export function renderTasksPage(ctx) {
  if (activePullCleanup) {
    activePullCleanup();
    activePullCleanup = null;
  }

  const tasks = getFilteredTasks(ctx);
  const language = ctx.language;

  const typeOptions = [
    { value: "all", label: typeLabel(ctx, "all") },
    { value: "register", label: typeLabel(ctx, "register") },
    { value: "download", label: typeLabel(ctx, "download") },
    { value: "survey", label: typeLabel(ctx, "survey") },
    { value: "purchase", label: typeLabel(ctx, "purchase") },
    { value: "trial", label: typeLabel(ctx, "trial") }
  ];

  const rewardOptions = [
    { value: "default", label: ctx.t("rewardDefault") },
    { value: "high", label: ctx.t("rewardHigh") },
    { value: "easy", label: ctx.t("rewardEasy") }
  ];

  const deviceOptions = [
    { value: "all", label: deviceLabel(ctx, "all") },
    { value: "ios", label: deviceLabel(ctx, "ios") },
    { value: "android", label: deviceLabel(ctx, "android") }
  ];

  const geoOptions = [
    { value: "all", label: geoLabel(ctx, "all") },
    { value: "us", label: geoLabel(ctx, "us") },
    { value: "japan", label: geoLabel(ctx, "japan") },
    { value: "sea", label: geoLabel(ctx, "sea") },
    { value: "europe", label: geoLabel(ctx, "europe") }
  ];

  ctx.app.innerHTML = `
    <div class="view route-enter">
      <section class="user-bar">
        <div class="user-profile">
          <span class="avatar">${ctx.user.avatar}</span>
          <div>
            <p class="user-name">${escapeHtml(ctx.user.nickname || ctx.t("defaultUser"))}</p>
            <p class="user-coins"><span data-balance>${ctx.formatCoins(ctx.user.balance)}</span> ${ctx.t("coins")}</p>
          </div>
        </div>
        <button type="button" class="icon-btn" data-notice>🔔</button>
      </section>

      <section class="search-panel card">
        <input id="task-search" type="search" value="${escapeHtml(ctx.ui.taskSearch || "")}" placeholder="${escapeHtml(
    ctx.t("searchTask")
  )}" />
      </section>

      <section class="card filters-panel">
        ${renderFilterChips(ctx, ctx.t("filterType"), "type", typeOptions, ctx.ui.type)}
        ${renderFilterChips(ctx, ctx.t("filterReward"), "rewardSort", rewardOptions, ctx.ui.rewardSort)}
        ${renderFilterChips(ctx, ctx.t("filterDevice"), "device", deviceOptions, ctx.ui.device)}
        ${renderFilterChips(ctx, ctx.t("filterGeo"), "geo", geoOptions, ctx.ui.geo)}
      </section>

      <section class="section-title-row">
        <h2>${ctx.t("featuredTasks")}</h2>
        <p>${tasks.length}</p>
      </section>

      <section class="task-grid">
        ${
          tasks.length > 0
            ? tasks.map((task) => renderTaskCard(ctx, task)).join("")
            : `<div class="empty-box">${escapeHtml(ctx.t("noTasks"))}</div>`
        }
      </section>
    </div>
  `;

  const balanceEl = ctx.app.querySelector("[data-balance]");
  ctx.animateNumber(balanceEl, ctx.user.balance, (value) => ctx.formatCoins(Math.floor(value)));

  const searchInput = ctx.app.querySelector("#task-search");
  searchInput?.addEventListener("input", (event) => {
    ctx.patchUI({ taskSearch: event.target.value });
    renderTasksPage(ctx);
  });

  ctx.app.querySelectorAll("[data-filter-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.getAttribute("data-filter-group");
      const value = button.getAttribute("data-filter-value");
      ctx.patchUI({ [group]: value });
      renderTasksPage(ctx);
    });
  });

  ctx.app.querySelector("[data-notice]")?.addEventListener("click", () => {
    ctx.showToast(ctx.t("verificationNotice"), "info");
  });

  ctx.app.querySelectorAll("[data-go-task]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = button.getAttribute("data-go-task");
      ctx.navigate(`#/task/${id}`);
    });
  });

  ctx.app.querySelectorAll("[data-task-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-task-card");
      ctx.navigate(`#/task/${id}`);
    });
  });

  activePullCleanup = ctx.bindPullToRefresh(ctx.app, {
    getPullText: () => ctx.t("pullHint"),
    getReleaseText: () => ctx.t("pullRelease"),
    getDoneText: () => ctx.t("refreshed"),
    onRefresh: () => {
      ctx.showToast(ctx.t("refreshed"), "success");
      renderTasksPage(ctx);
    }
  });

  ctx.addCleanup(() => {
    if (activePullCleanup) {
      activePullCleanup();
      activePullCleanup = null;
    }
  });

  if (language === "en") {
    document.documentElement.lang = "en";
  } else {
    document.documentElement.lang = "zh-CN";
  }
}

function renderStatusNotice(ctx, record) {
  if (!record) return "";

  if (record.status === "pending") {
    return `<p class="status-note status-pending">${escapeHtml(ctx.t("submittedPending"))}</p>`;
  }
  if (record.status === "approved") {
    return `<p class="status-note status-approved">${escapeHtml(ctx.t("alreadyApproved"))}</p>`;
  }
  if (record.status === "rejected") {
    return `<p class="status-note status-rejected">${escapeHtml(ctx.t("statusRejected"))}</p>`;
  }
  return `<p class="status-note status-progress">${escapeHtml(ctx.t("statusInProgress"))}</p>`;
}

function renderSimilarTasks(ctx, task) {
  const language = ctx.language;
  const list = ctx.tasks
    .filter((item) => item.id !== task.id && (item.type === task.type || item.genre?.zh === task.genre?.zh))
    .slice(0, 3);

  if (list.length === 0) return "";

  return `
    <section class="detail-similar card">
      <h3>${ctx.t("similarTasks")}</h3>
      <div class="similar-grid">
        ${list
          .map(
            (item) => `
              <button type="button" class="similar-card" data-similar-id="${item.id}">
                <span>${item.icon}</span>
                <strong>${escapeHtml(ctx.pickText(item.name, language))}</strong>
                <em>+${ctx.formatCoins(item.reward)} ${ctx.t("coins")}</em>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

export function renderTaskDetailPage(ctx, taskId) {
  const task = ctx.tasks.find((item) => item.id === taskId);
  if (!task) {
    ctx.navigate("#/tasks");
    return;
  }

  const language = ctx.language;
  const record = ctx.getTaskRecord(task.id);
  const title = ctx.pickText(task.name, language);
  const details = ctx.pickText(task.details, language);

  ctx.app.innerHTML = `
    <div class="view route-enter">
      <button type="button" class="btn ghost" data-back>&larr; ${ctx.t("navTasks")}</button>

      <section class="task-banner" style="background:${task.banner}">
        <div class="banner-icon">${task.icon}</div>
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(ctx.pickText(task.genre, language))} · ${escapeHtml(deviceLabel(ctx, task.device))} · ${escapeHtml(
    geoLabel(ctx, task.geo)
  )}</p>
        </div>
      </section>

      <section class="card detail-main">
        <p class="reward-big">+${ctx.formatCoins(task.reward)} ${ctx.t("coins")}</p>
        <p class="detail-text">${escapeHtml(details)}</p>
        ${renderStatusNotice(ctx, record)}

        <h3>${ctx.t("taskSteps")}</h3>
        <ol class="step-list">
          ${task.steps
            .map(
              (step, index) =>
                `<li><span class="step-index">${index + 1}</span><span>${escapeHtml(ctx.pickText(step, language))}</span></li>`
            )
            .join("")}
        </ol>

        <h3>${ctx.t("requirements")}</h3>
        <ul class="req-list">
          ${task.requirements.map((item) => `<li>${escapeHtml(ctx.pickText(item, language))}</li>`).join("")}
        </ul>

        <div class="detail-actions">
          <button type="button" class="btn secondary" data-visit>${ctx.t("visitNow")}</button>
          <button type="button" class="btn primary" data-submit>${ctx.t("confirmComplete")}</button>
        </div>
      </section>

      ${renderSimilarTasks(ctx, task)}
    </div>
  `;

  const backBtn = ctx.app.querySelector("[data-back]");
  backBtn?.addEventListener("click", () => ctx.navigate("#/tasks"));

  const visitBtn = ctx.app.querySelector("[data-visit]");
  visitBtn?.addEventListener("click", () => {
    const created = ctx.startTask(task);
    if (created) {
      ctx.showToast(ctx.t("taskCreated"), "success");
    }
    ctx.showToast(ctx.t("jumpPartner"), "info");
    renderTaskDetailPage(ctx, task.id);
  });

  const submitBtn = ctx.app.querySelector("[data-submit]");
  submitBtn?.addEventListener("click", () => {
    const result = ctx.submitTask(task);
    if (result.ok) {
      ctx.showToast(ctx.t("submittedPending"), "warning");
      renderTaskDetailPage(ctx, task.id);
      return;
    }

    if (result.code === "alreadyPending") {
      ctx.showToast(ctx.t("alreadyPending"), "warning");
      return;
    }

    if (result.code === "alreadyApproved") {
      ctx.showToast(ctx.t("alreadyApproved"), "success");
      return;
    }

    ctx.showToast(ctx.t("statusRejected"), "error");
  });

  ctx.app.querySelectorAll("[data-similar-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-similar-id");
      ctx.navigate(`#/task/${id}`);
    });
  });
}

function renderTaskRecord(ctx, record, task) {
  const language = ctx.language;
  const timeValue = record.status === "approved" ? record.completedAt : record.submittedAt || record.startedAt;
  const timeLabel = record.status === "approved" ? ctx.t("doneTime") : ctx.t("openTime");

  return `
    <article class="record-item card">
      <div class="record-head">
        <strong>${escapeHtml(task ? ctx.pickText(task.name, language) : record.taskId)}</strong>
        <span class="status-chip ${statusClass(record.status)}">${escapeHtml(statusText(ctx, record.status))}</span>
      </div>
      <p class="record-reward">+${ctx.formatCoins(record.reward)} ${ctx.t("coins")}</p>
      <p class="record-time">${timeLabel}: ${escapeHtml(ctx.formatDate(timeValue))}</p>
      <div class="record-actions">
        <button type="button" class="btn tiny ghost" data-record-open="${record.taskId}">${ctx.t("goNow")}</button>
      </div>
    </article>
  `;
}

export function renderMyTasksPage(ctx) {
  const currentTab = ctx.ui.myTaskTab || "in_progress";
  const allRecords = [...ctx.user.tasks].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const tabs = [
    { value: "in_progress", label: ctx.t("tabInProgress") },
    { value: "pending", label: ctx.t("tabPending") },
    { value: "approved", label: ctx.t("tabApproved") },
    { value: "rejected", label: ctx.t("tabRejected") }
  ];

  const records = allRecords.filter((item) => item.status === currentTab);

  ctx.app.innerHTML = `
    <div class="view route-enter">
      <section class="section-title-row large-gap">
        <h1>${ctx.t("myTaskTitle")}</h1>
      </section>

      <section class="tab-row card">
        ${tabs
          .map((tab) => {
            const active = tab.value === currentTab ? "active" : "";
            const count = allRecords.filter((item) => item.status === tab.value).length;
            return `<button type="button" class="tab-btn ${active}" data-task-tab="${tab.value}">${escapeHtml(
              tab.label
            )} (${count})</button>`;
          })
          .join("")}
      </section>

      <p class="pending-tip">${ctx.t("verificationNotice")}</p>

      <section class="record-list">
        ${
          records.length > 0
            ? records
                .map((record) => {
                  const task = ctx.tasks.find((item) => item.id === record.taskId);
                  return renderTaskRecord(ctx, record, task);
                })
                .join("")
            : `<div class="empty-box">${escapeHtml(ctx.t("noTaskRecord"))}</div>`
        }
      </section>
    </div>
  `;

  ctx.app.querySelectorAll("[data-task-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.getAttribute("data-task-tab");
      ctx.patchUI({ myTaskTab: value });
      renderMyTasksPage(ctx);
    });
  });

  ctx.app.querySelectorAll("[data-record-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const taskId = button.getAttribute("data-record-open");
      ctx.navigate(`#/task/${taskId}`);
    });
  });
}
