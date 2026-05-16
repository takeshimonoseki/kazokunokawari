// GAS WebApp URL (デプロイ後にここを書き換える)
const GAS_WEBAPP_URL = ""; // 現在、フォーム連携は設計段階のためURLは空です。

document.addEventListener("DOMContentLoaded", () => {
  const loadedAt = Date.now();
  const requestForm = document.getElementById("form-request");
  const partnerForm = document.getElementById("form-partner");

  const handleFormSubmit = async (e, formElement) => {
    e.preventDefault();

    const submitBtn = formElement.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector("span") || submitBtn;
    const originalText = btnText.textContent;

    // フォーム連携が準備できていない場合は送信しない
    if (!GAS_WEBAPP_URL) {
      alert("現在、フォーム送信は準備中です。今しばらくお待ちください。");
      // Reset button if it was disabled
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
      btnText.textContent = originalText;
      return;
    }

    // 1. スパム対策: 3秒未満の送信は拒否
    if (Date.now() - loadedAt < 3000) {
      alert("送信が早すぎます。内容を再度確認してください。");
      return;
    }

    // 2. スパム対策: ハニーポット
    const honeypot = formElement.querySelector('input[name="website"]');
    if (honeypot && honeypot.value !== "") {
      console.log("Bot detected");
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-75", "cursor-not-allowed");
    btnText.textContent = "送信中...";

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    // チェックボックス（複数選択）の処理
    if (formElement.id === "form-request") {
      const options = formData.getAll("options");
      data.options = options.join(", ");
    }

    data.timestamp = new Date().toISOString();
    data.formType = formElement.id === "form-request" ? "request" : "partner";
    data.source_site = "kazokunokawari";

    // 3. スパム対策: ペイロードサイズ上限
    if (JSON.stringify(data).length > 5000) {
      alert("入力文字数が多すぎます。");
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
      btnText.textContent = originalText;
      return;
    }

    try {
      // GASへ送信（no-corsで送信。Content-Typeはtext/plain扱い）
      await fetch(GAS_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(data),
      });

      // 送信成功としてサンクスページへ遷移
      window.location.href = "/thanks.html?type=" + data.formType;
    } catch (error) {
      console.error("Error:", error);
      alert("送信に失敗しました。通信環境をご確認の上、再度お試しください。");

      // Reset button
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
      btnText.textContent = originalText;
    }
  };

  if (requestForm) {
    requestForm.addEventListener("submit", (e) =>
      handleFormSubmit(e, requestForm),
    );
  }

  if (partnerForm) {
    partnerForm.addEventListener("submit", (e) =>
      handleFormSubmit(e, partnerForm),
    );
  }
});
