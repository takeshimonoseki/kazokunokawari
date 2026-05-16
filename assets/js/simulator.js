// 料金シミュレーター
// 概算はフォームへ自動反映せず、「この内容で相談する」経由のときだけ渡します。

document.addEventListener("DOMContentLoaded", () => {
  const serviceRadios = document.querySelectorAll('input[name="sim-service"]');
  const optionCheckboxes = document.querySelectorAll('input[name="sim-option"]');
  const visitAreaSelect = document.getElementById("sim-visit-area");
  const visitPlaceInput = document.getElementById("sim-visit-place");
  const totalTextEls = document.querySelectorAll("[data-sim-total-text]");
  const selectedSummary = document.querySelector("[data-sim-selected-summary]");
  const serviceNameEl = document.querySelector("[data-sim-service-name]");
  const servicePriceEl = document.querySelector("[data-sim-service-price]");
  const areaPriceEl = document.querySelector("[data-sim-area-price]");
  const visitAreaEls = document.querySelectorAll("[data-sim-visit-area]");
  const visitAreaDescriptionEl = document.querySelector("[data-sim-visit-area-description]");
  const visitPlaceEls = document.querySelectorAll("[data-sim-visit-place]");
  const visitAdjustmentEls = document.querySelectorAll("[data-sim-visit-adjustment]");
  const mobileVisitAdjustmentEls = document.querySelectorAll("[data-sim-mobile-visit-adjustment]");
  const optionPriceEl = document.querySelector("[data-sim-option-price]");
  const actualCostsEl = document.querySelector("[data-sim-actual-costs]");
  const consultBtns = document.querySelectorAll("#sim-to-request-form, #sim-to-request-form-side, #sim-to-request-form-mobile");
  const fillTestBtn = document.getElementById("fill-test-request");

  const hiddenPlan = document.getElementById("hidden-plan");
  const hiddenSelectedItems = document.getElementById("hidden-selectedItems");
  const hiddenTotalKm = document.getElementById("hidden-totalKm");
  const hiddenBreakdownJSON = document.getElementById("hidden-breakdownJSON");
  const hiddenEstimatedTotal = document.getElementById("hidden-estimatedTotal");
  const formBox = document.getElementById("form-sim-box");
  const formTitle = document.getElementById("form-sim-title");
  const formEmpty = document.getElementById("form-sim-empty");
  const formDetails = document.querySelectorAll("[data-form-sim-detail]");
  const formService = document.getElementById("form-sim-plan");
  const formVisitArea = document.getElementById("form-sim-area");
  const formArea = document.getElementById("form-sim-km");
  const formOptions = document.getElementById("form-sim-items");
  const formTotal = document.getElementById("form-sim-total");
  const formVisitAdjustment = document.getElementById("form-sim-visit-adjustment");
  const formNote = document.getElementById("form-sim-note");

  const baseActualCosts = ["購入品そのものの代金", "高速道路代", "駐車場代", "特殊な消耗品", "自治体処理券", "家電リサイクル料金", "許可業者費用"];
  let latestEstimate = null;

  function yen(amount, suffix = "円〜") {
    return `${amount.toLocaleString()}${suffix}`;
  }

  function selectedRadio(radios) {
    return Array.from(radios).find((radio) => radio.checked);
  }

  function calculate() {
    const service = selectedRadio(serviceRadios);
    const servicePrice = Number(service?.dataset.price || 0);
    const serviceIndividual = service?.dataset.individual === "true";
    const selectedVisitArea = visitAreaSelect?.selectedOptions?.[0];
    const visitArea = selectedVisitArea?.value || "下関市内・近隣エリア";
    const visitAreaPrice = Number(selectedVisitArea?.dataset.price || 0);
    const visitAreaIndividual = selectedVisitArea?.dataset.individual === "true";
    const visitAreaDescription = selectedVisitArea?.dataset.description || "";
    const visitPlace = visitPlaceInput?.value.trim() || "未入力";
    const visitAdjustmentText = selectedVisitArea?.dataset.display || "基本料金内";

    let optionTotal = 0;
    const selectedOptions = [];
    const actualCosts = new Set(baseActualCosts);

    optionCheckboxes.forEach((checkbox) => {
      if (!checkbox.checked) return;
      selectedOptions.push(checkbox.value);
      if (checkbox.dataset.type !== "actual_cost") {
        optionTotal += Number(checkbox.dataset.price || 0);
      }
      if (checkbox.dataset.actual) {
        checkbox.dataset.actual.split("/").map((item) => item.trim()).filter(Boolean).forEach((item) => actualCosts.add(item));
      }
    });

    const individual = serviceIndividual || visitAreaIndividual;
    const baseTotal = servicePrice + optionTotal;
    const total = baseTotal + (visitAreaIndividual ? 0 : visitAreaPrice);
    const totalText = serviceIndividual
      ? (service?.dataset.display || "個別見積もり")
      : (visitAreaIndividual ? `サービス・オプション目安 ${yen(baseTotal)}` : yen(total));
    const serviceText = service?.value || "未選択";
    const servicePriceText = serviceIndividual ? (service?.dataset.display || "個別見積もり") : yen(servicePrice);
    const areaPriceText = visitAdjustmentText;
    const optionPriceText = optionTotal === 0 ? "0円" : `${optionTotal > 0 ? "+" : ""}${optionTotal.toLocaleString()}円`;
    const visitAdjustmentStatusText = `訪問場所調整：${visitAdjustmentText}`;
    const mobileVisitAdjustmentStatusText = `訪問場所調整 ${visitAdjustmentText}`;

    latestEstimate = {
      individual,
      total,
      totalText,
      service: serviceText,
      servicePriceText,
      area: visitArea,
      areaPriceText,
      visitArea,
      visitPlace,
      visitAdjustmentText,
      options: selectedOptions,
      optionPriceText,
      actualCosts: Array.from(actualCosts),
    };

    totalTextEls.forEach((el) => {
      el.textContent = totalText;
    });
    if (selectedSummary) selectedSummary.textContent = `${serviceText} / ${visitArea}`;
    if (serviceNameEl) serviceNameEl.textContent = serviceText;
    if (servicePriceEl) servicePriceEl.textContent = servicePriceText;
    if (areaPriceEl) areaPriceEl.textContent = areaPriceText;
    visitAreaEls.forEach((el) => {
      el.textContent = visitArea;
    });
    if (visitAreaDescriptionEl) visitAreaDescriptionEl.textContent = visitAreaDescription;
    visitPlaceEls.forEach((el) => {
      el.textContent = visitPlace;
    });
    visitAdjustmentEls.forEach((el) => {
      el.textContent = visitAdjustmentStatusText;
    });
    mobileVisitAdjustmentEls.forEach((el) => {
      el.textContent = mobileVisitAdjustmentStatusText;
    });
    if (optionPriceEl) optionPriceEl.textContent = optionPriceText;
    if (actualCostsEl) actualCostsEl.textContent = Array.from(actualCosts).join(" / ");
  }

  function applyEstimateToForm() {
    if (!latestEstimate) calculate();
    const estimate = latestEstimate;
    if (!estimate) return;

    if (formBox) formBox.classList.add("border-orange-300");
    if (formTitle) formTitle.textContent = "シミュレーター概算";
    if (formEmpty) formEmpty.classList.add("hidden");
    formDetails.forEach((el) => el.classList.remove("hidden"));
    if (formNote) formNote.classList.remove("hidden");
    if (formService) formService.textContent = estimate.service;
    if (formVisitArea) formVisitArea.textContent = estimate.visitArea;
    if (formArea) formArea.textContent = estimate.visitPlace;
    if (formOptions) formOptions.textContent = estimate.options.join(" / ") || "なし";
    if (formTotal) formTotal.textContent = estimate.totalText;
    if (formVisitAdjustment) formVisitAdjustment.textContent = estimate.visitAdjustmentText;

    if (hiddenPlan) hiddenPlan.value = estimate.service;
    if (hiddenSelectedItems) hiddenSelectedItems.value = estimate.options.join(", ");
    if (hiddenTotalKm) hiddenTotalKm.value = estimate.visitPlace;
    if (hiddenEstimatedTotal) hiddenEstimatedTotal.value = estimate.totalText;
    if (hiddenBreakdownJSON) hiddenBreakdownJSON.value = JSON.stringify(estimate);
  }

  function fillTestValues() {
    const form = document.getElementById("form-request");
    if (!form) return;
    const values = {
      name: "山田 太郎",
      phone: "09012345678",
      email: "test@example.com",
      areaPref: "山口県",
      areaCity: "下関市",
      specificAddress: "下関市長府",
      notes: "公開前確認用のテスト入力です。送信はしません。",
    };
    Object.entries(values).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) field.value = value;
    });
    const contact = form.querySelector('input[name="preferredContactMethod"][value="電話"]');
    if (contact) contact.checked = true;
  }

  serviceRadios.forEach((radio) => radio.addEventListener("change", calculate));
  optionCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", calculate));
  if (visitAreaSelect) visitAreaSelect.addEventListener("change", calculate);
  if (visitPlaceInput) visitPlaceInput.addEventListener("input", calculate);
  consultBtns.forEach((btn) => btn.addEventListener("click", applyEstimateToForm));
  if (fillTestBtn) fillTestBtn.addEventListener("click", fillTestValues);

  calculate();
});
