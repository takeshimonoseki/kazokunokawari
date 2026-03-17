// 料金シミュレーター（100点版）
// 料金は「対応範囲（項目数）＋移動距離＋緊急＋待機＋立ち寄り＋オプション」で決まります。
// ※作業時間で引き延ばして稼ぐ設計にはしません。

const PRICING = {
  BASE: { S: 11000, M: 14500, L: 22000 },
  KM_RATE: 60, // 1kmあたり（税込）
  URGENCY: { normal: 0, nextday: 3000, today: 4000 },
  NIGHT_FEE: 5000, // 夜間・早朝（20:00〜8:00）
  WAIT_10MIN_RATE: 700, // 10分あたり
  STOP_FEE: 2000, // 立ち寄り1回あたり（手配コスト）
  KEY_FEE: 3500,
  REPORT_PLUS_FEE: 3500
};

document.addEventListener("DOMContentLoaded", () => {
  // Simulator elements
  const scopeRadios = document.querySelectorAll('input[name="sim-scope"]');
  const itemCheckboxes = document.querySelectorAll('input[name="sim-item"]');
  const otherItemInput = document.getElementById("sim-other-item");

  const totalKmInput = document.getElementById("sim-total-km");
  const urgencyRadios = document.querySelectorAll('input[name="sim-urgency"]');
  const nightCheckbox = document.getElementById("sim-night");

  const waitRange = document.getElementById("sim-wait-minutes");
  const waitDisplay = document.getElementById("sim-wait-display");

  const stopSelect = document.getElementById("sim-stops");
  const keyCheckbox = document.getElementById("sim-key");
  const reportPlusCheckbox = document.getElementById("sim-reportplus");

  const limitEl = document.getElementById("sim-item-limit");
  const countEl = document.getElementById("sim-item-count");
  const itemsDisplay = document.getElementById("sim-items-display");

  const totalEl = document.getElementById("sim-total");
  const kmRateEl = document.getElementById("sim-km-rate");

  const bd = {
    base: document.getElementById("bd-base"),
    km: document.getElementById("bd-km"),
    urgency: document.getElementById("bd-urgency"),
    night: document.getElementById("bd-night"),
    wait: document.getElementById("bd-wait"),
    stops: document.getElementById("bd-stops"),
    key: document.getElementById("bd-key"),
    reportplus: document.getElementById("bd-reportplus")
  };

  const toFormBtn = document.getElementById("sim-to-form");

  // Request form sync targets
  const requestForm = document.getElementById("form-request");
  const hiddenPlan = document.getElementById("hidden-plan");
  const hiddenSelectedItems = document.getElementById("hidden-selectedItems");
  const hiddenTotalKm = document.getElementById("hidden-totalKm");
  const hiddenUrgency = document.getElementById("hidden-urgency");
  const hiddenBreakdown = document.getElementById("hidden-breakdownJSON");
  const hiddenEstimatedTotal = document.getElementById("hidden-estimatedTotal");

  const formPlan = document.getElementById("form-sim-plan");
  const formItems = document.getElementById("form-sim-items");
  const formKm = document.getElementById("form-sim-km");
  const formTotal = document.getElementById("form-sim-total");

  if (kmRateEl) kmRateEl.textContent = String(PRICING.KM_RATE);

  const scopeToLimit = { S: 1, M: 2, L: 3 };

  function getSelectedScope() {
    let scope = "S";
    scopeRadios.forEach(r => { if (r.checked) scope = r.value; });
    return scope;
  }

  function getSelectedUrgency() {
    let u = "normal";
    urgencyRadios.forEach(r => { if (r.checked) u = r.value; });
    return u;
  }

  function getItemLimit() {
    const scope = getSelectedScope();
    return scopeToLimit[scope] || 1;
  }

  function getCheckedItems() {
    const items = [];
    itemCheckboxes.forEach(cb => { if (cb.checked) items.push(cb.value); });
    const other = (otherItemInput?.value || "").trim();
    if (other) items.push(`その他：${other}`);
    return items;
  }

  function enforceItemLimit(changedCheckbox) {
    const limit = getItemLimit();
    const checked = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
    if (checked > limit && changedCheckbox) {
      changedCheckbox.checked = false;
      alert(`「対応範囲」で選べる“やること”は最大${limit}件です。`);
    }
  }

  function updateLimitUI() {
    const limit = getItemLimit();
    if (limitEl) limitEl.textContent = String(limit);
    const checked = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
    const other = (otherItemInput?.value || "").trim() ? 1 : 0;
    const count = checked + other;
    if (countEl) countEl.textContent = `${count}/${limit}`;
  }

  function calculate() {
    if (!totalEl) return;

    const scope = getSelectedScope();
    const baseFee = PRICING.BASE[scope] ?? PRICING.BASE.S;

    const totalKm = Math.max(0, parseInt(totalKmInput?.value || "0", 10) || 0);
    const kmFee = totalKm * PRICING.KM_RATE;

    const urgency = getSelectedUrgency();
    const urgencyFee = PRICING.URGENCY[urgency] ?? 0;

    const nightFee = nightCheckbox?.checked ? PRICING.NIGHT_FEE : 0;

    const waitMinutes = Math.max(0, parseInt(waitRange?.value || "0", 10) || 0);
    const waitFee = Math.round((waitMinutes / 10) * PRICING.WAIT_10MIN_RATE);

    const stops = Math.max(0, parseInt(stopSelect?.value || "0", 10) || 0);
    const stopsFee = stops * PRICING.STOP_FEE;

    const keyFee = keyCheckbox?.checked ? PRICING.KEY_FEE : 0;
    const reportPlusFee = reportPlusCheckbox?.checked ? PRICING.REPORT_PLUS_FEE : 0;

    const selectedItems = getCheckedItems();
    if (itemsDisplay) itemsDisplay.textContent = selectedItems.length ? selectedItems.join(" / ") : "（未選択）";

    const total = baseFee + kmFee + urgencyFee + nightFee + waitFee + stopsFee + keyFee + reportPlusFee;

    // Update UI (total + breakdown)
    totalEl.style.opacity = "0";
    setTimeout(() => {
      totalEl.textContent = total.toLocaleString();
      totalEl.style.opacity = "1";
    }, 120);

    if (bd.base) bd.base.textContent = baseFee.toLocaleString();
    if (bd.km) bd.km.textContent = kmFee.toLocaleString();
    if (bd.urgency) bd.urgency.textContent = urgencyFee.toLocaleString();
    if (bd.night) bd.night.textContent = nightFee.toLocaleString();
    if (bd.wait) bd.wait.textContent = waitFee.toLocaleString();
    if (bd.stops) bd.stops.textContent = stopsFee.toLocaleString();
    if (bd.key) bd.key.textContent = keyFee.toLocaleString();
    if (bd.reportplus) bd.reportplus.textContent = reportPlusFee.toLocaleString();

    if (waitDisplay) waitDisplay.textContent = String(waitMinutes);

    // Update hidden fields (so form submit works even if user scrolls past)
    const breakdown = {
      scope,
      baseFee,
      totalKm,
      kmRate: PRICING.KM_RATE,
      kmFee,
      urgency,
      urgencyFee,
      night: !!nightCheckbox?.checked,
      nightFee,
      waitMinutes,
      wait10minRate: PRICING.WAIT_10MIN_RATE,
      waitFee,
      stops,
      stopFee: PRICING.STOP_FEE,
      stopsFee,
      key: !!keyCheckbox?.checked,
      keyFee,
      reportPlus: !!reportPlusCheckbox?.checked,
      reportPlusFee,
      selectedItems,
      total
    };

    if (hiddenPlan) hiddenPlan.value = scope;
    if (hiddenSelectedItems) hiddenSelectedItems.value = selectedItems.join(" / ");
    if (hiddenTotalKm) hiddenTotalKm.value = String(totalKm);
    if (hiddenUrgency) hiddenUrgency.value = nightCheckbox?.checked ? `${urgency}+night` : urgency;
    if (hiddenBreakdown) hiddenBreakdown.value = JSON.stringify(breakdown);
    if (hiddenEstimatedTotal) hiddenEstimatedTotal.value = String(total);

    if (formPlan) formPlan.textContent = scope === "S" ? "S（1項目）" : scope === "M" ? "M（2項目）" : "L（3項目）";
    if (formItems) formItems.textContent = selectedItems.length ? selectedItems.join(" / ") : "（未選択）";
    if (formKm) formKm.textContent = `${totalKm}km`;
    if (formTotal) formTotal.textContent = total.toLocaleString();
  }

  function syncAndScrollToForm() {
    calculate();
    const formSection = document.getElementById("request-form");
    if (formSection) {
      const header = document.querySelector("header");
      const headerHeight = header ? header.offsetHeight : 0;
      const y = formSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  // Bind events
  scopeRadios.forEach(r => r.addEventListener("change", () => {
    // If scope reduced, uncheck extra items
    const limit = getItemLimit();
    const checked = Array.from(itemCheckboxes).filter(cb => cb.checked);
    if (checked.length > limit) {
      checked.slice(limit).forEach(cb => cb.checked = false);
    }
    updateLimitUI();
    calculate();
  }));

  itemCheckboxes.forEach(cb => cb.addEventListener("change", (e) => {
    enforceItemLimit(e.target);
    updateLimitUI();
    calculate();
  }));

  if (otherItemInput) otherItemInput.addEventListener("input", () => {
    updateLimitUI();
    calculate();
  });

  if (totalKmInput) totalKmInput.addEventListener("input", calculate);
  urgencyRadios.forEach(r => r.addEventListener("change", calculate));
  if (nightCheckbox) nightCheckbox.addEventListener("change", calculate);

  if (waitRange) waitRange.addEventListener("input", calculate);
  if (stopSelect) stopSelect.addEventListener("change", calculate);
  if (keyCheckbox) keyCheckbox.addEventListener("change", calculate);
  if (reportPlusCheckbox) reportPlusCheckbox.addEventListener("change", calculate);

  if (toFormBtn) toFormBtn.addEventListener("click", syncAndScrollToForm);

  // Initial
  updateLimitUI();
  calculate();
});
