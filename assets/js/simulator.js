// 料金シミュレーター
// 概算はフォームへ自動反映せず、「この内容で相談する」経由のときだけ渡します。

document.addEventListener("DOMContentLoaded", () => {
  const serviceRadios = document.querySelectorAll('input[name="sim-service"]');
  const optionCheckboxes = document.querySelectorAll('input[name="sim-option"]');
  const distanceInput = document.getElementById("sim-distance-km");
  const totalTextEls = document.querySelectorAll("[data-sim-total-text]");
  const selectedSummary = document.querySelector("[data-sim-selected-summary]");
  const serviceNameEl = document.querySelector("[data-sim-service-name]");
  const servicePriceEl = document.querySelector("[data-sim-service-price]");
  const areaPriceEl = document.querySelector("[data-sim-area-price]");
  const distanceFeeEl = document.querySelector("[data-sim-distance-fee]");
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
  const formArea = document.getElementById("form-sim-km");
  const formOptions = document.getElementById("form-sim-items");
  const formTotal = document.getElementById("form-sim-total");
  const formNote = document.getElementById("form-sim-note");

  const baseActualCosts = ["購入品そのものの代金", "高速道路代", "駐車場代", "特殊な消耗品"];
  let latestEstimate = null;

  function yen(amount, suffix = "円〜") {
    return `${amount.toLocaleString()}${suffix}`;
  }

  function selectedRadio(radios) {
    return Array.from(radios).find((radio) => radio.checked);
  }

  function travelFee(rawValue) {
    if (rawValue === "") {
      return {
        label: "出張費は正式見積もり時に確認",
        distanceFee: 0,
        total: 0,
        display: "正式見積もり時に確認",
        distanceDisplay: "未入力",
        unknown: true,
        individual: false,
      };
    }
    const km = Number(rawValue);
    if (!Number.isFinite(km) || km < 0) {
      return null;
    }
    if (km > 90) {
      return {
        label: "片道90km超",
        distanceFee: 0,
        total: 0,
        display: "個別見積もり",
        distanceDisplay: "個別見積もり",
        unknown: false,
        individual: true,
      };
    }
    const distanceFee = km <= 30 ? 0 : Math.ceil(km - 30) * 110;
    return {
      label: `片道${km}km`,
      distanceFee,
      total: distanceFee,
      display: `${distanceFee.toLocaleString()}円`,
      distanceDisplay: `${distanceFee.toLocaleString()}円`,
      unknown: false,
      individual: false,
    };
  }

  function calculate() {
    const service = selectedRadio(serviceRadios);
    const servicePrice = Number(service?.dataset.price || 0);
    const serviceIndividual = service?.dataset.individual === "true";
    const trip = travelFee(distanceInput?.value || "");
    let areaLabel = trip?.label || "出張費は正式見積もり時に確認";
    let areaPrice = trip?.total || 0;
    let areaIndividual = trip?.individual || false;
    let travelUnknown = trip?.unknown || false;

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

    const individual = serviceIndividual || areaIndividual || travelUnknown;
    const total = servicePrice + areaPrice + optionTotal;
    const totalText = travelUnknown ? "正式見積もり時に確認" : (individual ? "個別見積もり" : yen(total));
    const serviceText = service?.value || "未選択";
    const servicePriceText = serviceIndividual ? (service?.dataset.display || "個別見積もり") : yen(servicePrice);
    const areaPriceText = trip?.display || "正式見積もり時に確認";
    const optionPriceText = optionTotal === 0 ? "0円" : `${optionTotal > 0 ? "+" : ""}${optionTotal.toLocaleString()}円`;

    latestEstimate = {
      individual,
      total,
      totalText,
      service: serviceText,
      servicePriceText,
      area: areaLabel,
      areaPriceText,
      options: selectedOptions,
      optionPriceText,
      actualCosts: Array.from(actualCosts),
    };

    totalTextEls.forEach((el) => {
      el.textContent = totalText;
    });
    if (selectedSummary) selectedSummary.textContent = `${serviceText} / ${areaLabel}`;
    if (serviceNameEl) serviceNameEl.textContent = serviceText;
    if (servicePriceEl) servicePriceEl.textContent = servicePriceText;
    if (areaPriceEl) areaPriceEl.textContent = areaPriceText;
    if (distanceFeeEl) distanceFeeEl.textContent = trip?.distanceDisplay || "未入力";
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
    if (formArea) formArea.textContent = estimate.area;
    if (formOptions) formOptions.textContent = estimate.options.join(" / ") || "なし";
    if (formTotal) formTotal.textContent = estimate.totalText;

    if (hiddenPlan) hiddenPlan.value = estimate.service;
    if (hiddenSelectedItems) hiddenSelectedItems.value = estimate.options.join(", ");
    if (hiddenTotalKm) hiddenTotalKm.value = estimate.area;
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
      specificAddress: "山口県下関市中心部周辺",
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
  if (distanceInput) distanceInput.addEventListener("input", calculate);
  consultBtns.forEach((btn) => btn.addEventListener("click", applyEstimateToForm));
  if (fillTestBtn) fillTestBtn.addEventListener("click", fillTestValues);

  calculate();
});
