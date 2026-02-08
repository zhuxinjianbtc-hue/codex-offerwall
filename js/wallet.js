import { REDEEM_OPTIONS } from "./data.js";

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCash(points) {
  return (Number(points || 0) / 100).toFixed(2);
}

function renderOption(ctx, option) {
  return `
    <button type="button" class="redeem-option" data-redeem-id="${option.id}">
      <div class="redeem-icon">${option.icon}</div>
      <div class="redeem-meta">
        <strong>${escapeHtml(ctx.pickText(option.label, ctx.language))}</strong>
        <span>${escapeHtml(ctx.t("minRedeem", { points: ctx.formatCoins(option.minimumPoints) }))}</span>
      </div>
    </button>
  `;
}

function renderLedger(ctx) {
  if (!ctx.user.ledger.length) {
    return `<div class="empty-box">${escapeHtml(ctx.t("noLedger"))}</div>`;
  }

  return `
    <ul class="timeline-list">
      ${ctx.user.ledger
        .slice(0, 18)
        .map((item) => {
          const isIncome = item.type === "income";
          const sign = isIncome ? "+" : "-";
          const amount = Math.abs(Number(item.amount || 0));
          return `
            <li class="timeline-item ${isIncome ? "income" : "expense"}">
              <div>
                <strong>${escapeHtml(ctx.pickText(item.description, ctx.language))}</strong>
                <p>${escapeHtml(ctx.formatDate(item.createdAt))}</p>
              </div>
              <span>${sign}${ctx.formatCoins(amount)} ${ctx.t("coins")}</span>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function renderRedeemHistory(ctx) {
  if (!ctx.user.redemptions.length) {
    return `<div class="empty-box">${escapeHtml(ctx.t("noRedeem"))}</div>`;
  }

  return `
    <div class="redeem-history-list">
      ${ctx.user.redemptions
        .slice(0, 12)
        .map((record) => {
          return `
            <article class="redeem-record card">
              <div class="record-head">
                <strong>${escapeHtml(ctx.pickText(record.label, ctx.language))}</strong>
                <span>- ${ctx.formatCoins(record.points)} ${ctx.t("coins")}</span>
              </div>
              <p>$${formatCash(record.points)} · ${escapeHtml(ctx.formatDate(record.createdAt))}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderWalletPage(ctx) {
  ctx.app.innerHTML = `
    <div class="view route-enter">
      <section class="wallet-balance card">
        <p>${ctx.t("currentBalance")}</p>
        <h1><span data-balance>${ctx.formatCoins(ctx.user.balance)}</span> ${ctx.t("coins")}</h1>
        <p>${ctx.t("cashApprox")} $${formatCash(ctx.user.balance)}</p>
      </section>

      <section class="card">
        <h2>${ctx.t("redeemCenter")}</h2>
        <div class="redeem-grid">
          ${REDEEM_OPTIONS.map((item) => renderOption(ctx, item)).join("")}
        </div>
      </section>

      <section class="card">
        <h2>${ctx.t("incomeExpense")}</h2>
        ${renderLedger(ctx)}
      </section>

      <section class="card">
        <h2>${ctx.t("redeemHistory")}</h2>
        ${renderRedeemHistory(ctx)}
      </section>
    </div>
  `;

  const balanceEl = ctx.app.querySelector("[data-balance]");
  ctx.animateNumber(balanceEl, ctx.user.balance, (value) => ctx.formatCoins(Math.floor(value)));

  ctx.app.querySelectorAll("[data-redeem-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const optionId = button.getAttribute("data-redeem-id");
      const option = REDEEM_OPTIONS.find((item) => item.id === optionId);
      if (!option) return;

      const ok = await ctx.confirmModal({
        title: ctx.t("redeemConfirmTitle"),
        message: ctx.t("redeemConfirmBody", {
          points: ctx.formatCoins(option.minimumPoints),
          name: ctx.pickText(option.label, ctx.language)
        }),
        confirmText: ctx.t("confirm"),
        cancelText: ctx.t("cancel")
      });

      if (!ok) return;

      const result = ctx.redeem(option);
      if (!result.ok) {
        ctx.showToast(ctx.t("insufficient"), "error");
        return;
      }

      ctx.showToast(ctx.t("redeemSuccess"), "success");
      renderWalletPage(ctx);
    });
  });
}
