(() => {
  function yen(amount, suffix = "円〜") {
    return `${Number(amount || 0).toLocaleString()}${suffix}`;
  }

  function selectedRadio(radios) {
    return Array.from(radios).find((radio) => radio.checked);
  }

  function updateSimulatorDisplay() {
    const serviceRadios = document.querySelectorAll('input[name="sim-service"]');
    const optionCheckboxes = document.querySelectorAll('input[name="sim-option"]');
    const visitAreaSelect = document.getElementById("sim-visit-area");
    const visitPlaceInput = document.getElementById("sim-visit-place");

    const service = selectedRadio(serviceRadios);
    if (!service) return;

    const servicePrice = Number(service.dataset.price || 0);
    const serviceIndividual = service.dataset.individual === "true";

    const selectedVisitArea = visitAreaSelect?.selectedOptions?.[0];
    const visitArea = selectedVisitArea?.value || "下関市内・近隣エリア";
    const visitAreaPrice = Number(selectedVisitArea?.dataset.price || 0);
    const visitAreaIndividual = selectedVisitArea?.dataset.individual === "true";
    const visitAreaDescription = selectedVisitArea?.dataset.description || "";
    const visitPlace = visitPlaceInput?.value.trim() || "未入力";
    const visitAdjustmentText = selectedVisitArea?.dataset.display || "基本料金内";

    let optionTotal = 0;
    const selectedOptions = [];

    optionCheckboxes.forEach((checkbox) => {
      if (!checkbox.checked) return;
      selectedOptions.push(checkbox.value);
      if (checkbox.dataset.type !== "actual_cost") {
        optionTotal += Number(checkbox.dataset.price || 0);
      }
    });

    const baseTotal = servicePrice + optionTotal;
    const total = baseTotal + (visitAreaIndividual ? 0 : visitAreaPrice);

    const totalText = serviceIndividual
      ? (service.dataset.display || "個別見積もり")
      : (visitAreaIndividual ? `サービス・オプション目安 ${yen(baseTotal)}` : yen(total));

    const serviceText = service.value || "未選択";
    const servicePriceText = serviceIndividual ? (service.dataset.display || "個別見積もり") : yen(servicePrice);
    const optionPriceText = optionTotal === 0 ? "0円" : `${optionTotal > 0 ? "+" : ""}${optionTotal.toLocaleString()}円`;
    const visitAdjustmentStatusText = `訪問場所調整：${visitAdjustmentText}`;
    const mobileVisitAdjustmentStatusText = `訪問場所調整 ${visitAdjustmentText}`;

    document.querySelectorAll("[data-sim-total-text]").forEach((el) => {
      el.textContent = totalText;
    });

    const selectedSummary = document.querySelector("[data-sim-selected-summary]");
    if (selectedSummary) selectedSummary.textContent = `${serviceText} / ${visitArea}`;

    const serviceNameEl = document.querySelector("[data-sim-service-name]");
    if (serviceNameEl) serviceNameEl.textContent = serviceText;

    const servicePriceEl = document.querySelector("[data-sim-service-price]");
    if (servicePriceEl) servicePriceEl.textContent = servicePriceText;

    const areaPriceEl = document.querySelector("[data-sim-area-price]");
    if (areaPriceEl) areaPriceEl.textContent = visitAdjustmentText;

    const optionPriceEl = document.querySelector("[data-sim-option-price]");
    if (optionPriceEl) optionPriceEl.textContent = optionPriceText;

    const visitAreaDescriptionEl = document.querySelector("[data-sim-visit-area-description]");
    if (visitAreaDescriptionEl) visitAreaDescriptionEl.textContent = visitAreaDescription;

    document.querySelectorAll("[data-sim-visit-area]").forEach((el) => {
      el.textContent = visitArea;
    });

    document.querySelectorAll("[data-sim-visit-place]").forEach((el) => {
      el.textContent = visitPlace;
    });

    document.querySelectorAll("[data-sim-visit-adjustment]").forEach((el) => {
      el.textContent = visitAdjustmentStatusText;
    });

    document.querySelectorAll("[data-sim-mobile-visit-adjustment]").forEach((el) => {
      el.textContent = mobileVisitAdjustmentStatusText;
    });
  }

  function isSimulatorInView() {
    const section = document.getElementById("simulator");
    if (!section) return false;

    const rect = section.getBoundingClientRect();

    // スマホで料金を見ながら選択変更できるよう、シミュレーター内では広めに表示する
    return rect.top < window.innerHeight - 60 && rect.bottom > 140;
  }

  function updateMobileBarVisibility() {
    const mobileBar = document.querySelector(".sim-mobile-bar");
    if (!mobileBar) return;

    mobileBar.classList.toggle("is-visible", isSimulatorInView());
  }

  function refresh() {
    updateSimulatorDisplay();
    updateMobileBarVisibility();
  }

  function bind() {
    const inputs = document.querySelectorAll(
      'input[name="sim-service"], input[name="sim-option"], #sim-visit-area, #sim-visit-place'
    );

    inputs.forEach((input) => {
      input.addEventListener("change", refresh);
      input.addEventListener("input", refresh);
      input.addEventListener("click", refresh);
    });

    window.addEventListener("scroll", updateMobileBarVisibility, { passive: true });
    window.addEventListener("resize", updateMobileBarVisibility);

    const simulator = document.getElementById("simulator");
    if (simulator) {
      simulator.addEventListener("click", refresh);
      simulator.addEventListener("focusin", refresh);
    }

    refresh();
    setTimeout(refresh, 100);
    setTimeout(refresh, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
