// 料金シミュレーター
// 料金は「サービス料金＋出張費＋オプション料金−割引」で決まります。

document.addEventListener("DOMContentLoaded", () => {
  // Simulator elements
  const serviceRadios = document.querySelectorAll('input[name="sim-service"]');
  const areaRadios = document.querySelectorAll('input[name="sim-area"]');
  const optionCheckboxes = document.querySelectorAll('input[name="sim-option"]');

  const totalDisplayEl = document.getElementById("sim-total-display");
  const estimateTextEl = document.getElementById("sim-estimate-text");
  const toRequestFormBtn = document.getElementById("sim-to-request-form");

  // Request form sync targets (still need to sync the estimated total)
  const hiddenEstimatedTotal = document.getElementById("hidden-estimatedTotal");
  const formPlan = document.getElementById("form-sim-plan"); // Not used anymore for plan, repurpose or remove from form sync
  const formItems = document.getElementById("form-sim-items"); // Not used anymore for items, repurpose or remove from form sync
  const formKm = document.getElementById("form-sim-km"); // Not used anymore for km, repurpose or remove from form sync
  const formTotal = document.getElementById("form-sim-total"); // This should be updated

  function calculate() {
    let total = 0;
    let serviceName = "";
    let areaName = "";
    let isIndividualEstimate = false;
    const selectedOptions = [];

    // サービス料金の計算
    let selectedService = Array.from(serviceRadios).find(radio => radio.checked);
    if (selectedService) {
      serviceName = selectedService.value;
      const servicePrice = parseInt(selectedService.dataset.price || "0", 10);
      if (serviceName === "その他・個別相談") {
        isIndividualEstimate = true;
      } else {
        total += servicePrice;
      }
    }

    // 出張費の計算
    let selectedArea = Array.from(areaRadios).find(radio => radio.checked);
    if (selectedArea) {
      areaName = selectedArea.value;
      const areaPrice = parseInt(selectedArea.dataset.price || "0", 10);
      if (areaName === "それ以上の遠方") {
        isIndividualEstimate = true;
      } else {
        total += areaPrice;
      }
    }

    // オプション料金の計算
    optionCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedOptions.push(checkbox.value);
        const optionPrice = parseInt(checkbox.dataset.price || "0", 10);
        // 実費項目は料金に含めないが、選択されたことは記録する
        if (checkbox.dataset.type !== "actual_cost") {
          total += optionPrice;
        }
      }
    });

    // UIの更新
    if (isIndividualEstimate) {
      if (totalDisplayEl) totalDisplayEl.textContent = "0";
      if (estimateTextEl) estimateTextEl.classList.remove("hidden");
    } else {
      if (totalDisplayEl) totalDisplayEl.textContent = total.toLocaleString();
      if (estimateTextEl) estimateTextEl.classList.add("hidden");
    }

    // フォームへの連携 (非表示フィールド)
    if (hiddenEstimatedTotal) hiddenEstimatedTotal.value = isIndividualEstimate ? "0" : String(total);
    // These might need adjustment based on the form's actual needs
    if (formPlan) formPlan.textContent = serviceName; // Repurpose to show selected service
    if (formItems) formItems.textContent = selectedOptions.join(" / ") || "（オプションなし）"; // Repurpose to show selected options
    if (formKm) formKm.textContent = areaName; // Repurpose to show selected area
    if (formTotal) formTotal.textContent = isIndividualEstimate ? "個別見積もり" : total.toLocaleString();

    // 依頼フォームボタンの活性化/非活性化 (必要であれば)
    // 例えば、個別見積もりの場合はボタンを非活性化するなどのロジックを追加可能
  }

  // イベントリスナーの登録
  serviceRadios.forEach(radio => radio.addEventListener("change", calculate));
  areaRadios.forEach(radio => radio.addEventListener("change", calculate));
  optionCheckboxes.forEach(checkbox => checkbox.addEventListener("change", calculate));

  // 初期計算の実行
  calculate();
});
