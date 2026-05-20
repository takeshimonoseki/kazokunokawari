(() => {
  function yen(amount, suffix = "円〜") {
    return `${Number(amount || 0).toLocaleString()}${suffix}`;
  }

  function selectedRadio(radios) {
    return Array.from(radios).find((radio) => radio.checked);
  }

  function calculateCurrentEstimate() {
    const serviceRadios = document.querySelectorAll('input[name="sim-service"]');
    const optionCheckboxes = document.querySelectorAll('input[name="sim-option"]');
    const visitAreaSelect = document.getElementById("sim-visit-area");
    const visitPlaceInput = document.getElementById("sim-visit-place");

    const service = selectedRadio(serviceRadios);
    if (!service) return null;

    const servicePrice = Number(service.dataset.price || 0);
    const serviceIndividual = service.dataset.individual === "true";
    const serviceText = service.value || "未選択";

    const selectedVisitArea = visitAreaSelect?.selectedOptions?.[0];
    const visitArea = selectedVisitArea?.value || "下関市内・近隣エリア";
    const visitAreaPrice = Number(selectedVisitArea?.dataset.price || 0);
    const visitAreaIndividual = selectedVisitArea?.dataset.individual === "true";
    const visitAdjustmentText = selectedVisitArea?.dataset.display || "基本料金内";
    const visitAreaDescription = selectedVisitArea?.dataset.description || "";
    const visitPlace = visitPlaceInput?.value.trim() || "未入力";

    let optionTotal = 0;
    const options = [];

    optionCheckboxes.forEach((checkbox) => {
      if (!checkbox.checked) return;
      options.push(checkbox.value);
      if (checkbox.dataset.type !== "actual_cost") {
        optionTotal += Number(checkbox.dataset.price || 0);
      }
    });

    const baseTotal = servicePrice + optionTotal;
    const total = baseTotal + (visitAreaIndividual ? 0 : visitAreaPrice);

    const totalText = serviceIndividual
      ? (service.dataset.display || "個別見積もり")
      : (visitAreaIndividual ? `サービス・オプション目安 ${yen(baseTotal)}` : yen(total));

    return {
      totalText,
      serviceText,
      servicePriceText: serviceIndividual ? (service.dataset.display || "個別見積もり") : yen(servicePrice),
      optionPriceText: optionTotal === 0 ? "0円" : `${optionTotal > 0 ? "+" : ""}${optionTotal.toLocaleString()}円`,
      visitArea,
      visitPlace,
      visitAdjustmentText,
      visitAreaDescription,
      options,
    };
  }

  function updateEstimateText() {
    const estimate = calculateCurrentEstimate();
    if (!estimate) return;

    document.querySelectorAll("[data-sim-total-text]").forEach((el) => {
      el.textContent = estimate.totalText;
    });

    const selectedSummary = document.querySelector("[data-sim-selected-summary]");
    if (selectedSummary) {
      selectedSummary.textContent = `${estimate.serviceText} / ${estimate.visitArea}`;
    }

    const serviceNameEl = document.querySelector("[data-sim-service-name]");
    if (serviceNameEl) serviceNameEl.textContent = estimate.serviceText;

    const servicePriceEl = document.querySelector("[data-sim-service-price]");
    if (servicePriceEl) servicePriceEl.textContent = estimate.servicePriceText;

    const optionPriceEl = document.querySelector("[data-sim-option-price]");
    if (optionPriceEl) optionPriceEl.textContent = estimate.optionPriceText;

    const areaPriceEl = document.querySelector("[data-sim-area-price]");
    if (areaPriceEl) areaPriceEl.textContent = estimate.visitAdjustmentText;

    const visitAreaDescriptionEl = document.querySelector("[data-sim-visit-area-description]");
    if (visitAreaDescriptionEl) visitAreaDescriptionEl.textContent = estimate.visitAreaDescription;

    document.querySelectorAll("[data-sim-visit-area]").forEach((el) => {
      el.textContent = estimate.visitArea;
    });

    document.querySelectorAll("[data-sim-visit-place]").forEach((el) => {
      el.textContent = estimate.visitPlace;
    });

    document.querySelectorAll("[data-sim-visit-adjustment]").forEach((el) => {
      el.textContent = `訪問場所調整：${estimate.visitAdjustmentText}`;
    });

    document.querySelectorAll("[data-sim-mobile-visit-adjustment]").forEach((el) => {
      el.textContent = `訪問場所調整 ${estimate.visitAdjustmentText}`;
    });
  }

  function isSimulatorOnScreen() {
    const simulator = document.getElementById("simulator");
    if (!simulator) return false;

    const rect = simulator.getBoundingClientRect();

    // 料金シミュレーターを使っている間は、画面下に合計金額を常時出す。
    return rect.top < window.innerHeight - 80 && rect.bottom > 120;
  }

  function updateStickyTotalVisibility() {
    const bar = document.querySelector(".sim-mobile-bar");
    if (!bar) return;

    if (isSimulatorOnScreen()) {
      bar.classList.add("kzk-total-active");
    } else {
      bar.classList.remove("kzk-total-active");
    }
  }

  function refresh() {
    updateEstimateText();
    updateStickyTotalVisibility();
  }

  function bind() {
    const style = document.createElement("style");
    style.textContent = `
      @media (max-width: 767px) {
        .sim-mobile-bar {
          display: none !important;
        }

        .sim-mobile-bar.kzk-total-active {
          display: flex !important;
          position: fixed;
          left: 0.75rem;
          right: 0.75rem;
          bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
          z-index: 45;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.97);
          border: 2px solid #fed7aa;
          border-radius: 1rem;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
        }

        .sim-mobile-bar.kzk-total-active .sim-mobile-total {
          color: #ea580c;
          font-size: 1.35rem;
          line-height: 1.05;
          font-weight: 950;
        }

        .sim-mobile-bar.kzk-total-active a {
          white-space: nowrap;
        }
      }

      @media (min-width: 768px) {
        .sim-mobile-bar,
        .sim-mobile-bar.kzk-total-active {
          display: none !important;
        }

        .sim-result-card {
          position: sticky;
          top: 7.5rem;
        }
      }
    `;
    document.head.appendChild(style);

    const targets = document.querySelectorAll(
      'input[name="sim-service"], input[name="sim-option"], #sim-visit-area, #sim-visit-place'
    );

    targets.forEach((target) => {
      target.addEventListener("change", refresh);
      target.addEventListener("input", refresh);
      target.addEventListener("click", refresh);
    });

    const simulator = document.getElementById("simulator");
    if (simulator) {
      simulator.addEventListener("click", refresh);
      simulator.addEventListener("focusin", refresh);
      simulator.addEventListener("touchstart", refresh, { passive: true });
    }

    window.addEventListener("scroll", updateStickyTotalVisibility, { passive: true });
    window.addEventListener("resize", refresh);

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
