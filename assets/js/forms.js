document.addEventListener("DOMContentLoaded", () => {
  const loadedAt = Date.now();
  const submittingForms = new WeakSet();
  const requestForm = document.getElementById("form-request");
  const partnerForm = document.getElementById("form-partner");
  const formConfig = window.KAZOKU_FORM_CONFIG || {};
  const gasWebAppUrl = formConfig.gasWebAppUrl || "";

  const getSubmitElements = (formElement) => {
    const submitBtn = formElement.querySelector('button[type="submit"]');
    const btnText = submitBtn?.querySelector("span") || submitBtn;
    return {
      submitBtn,
      btnText,
      originalText: btnText?.textContent || "",
    };
  };

  const setSubmitting = (submitBtn, btnText, isSubmitting, originalText) => {
    if (!submitBtn || !btnText) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.classList.toggle("opacity-75", isSubmitting);
    submitBtn.classList.toggle("cursor-not-allowed", isSubmitting);
    btnText.textContent = isSubmitting ? "送信中..." : originalText;
  };

  const showError = (message) => {
    alert(message);
  };

  const getFormValues = (formElement) => {
    const formData = new FormData(formElement);
    const values = Object.fromEntries(formData.entries());
    values.preferredService = formData.getAll("preferredService").join(", ");
    values.options = formData.getAll("options").join(", ");
    return values;
  };

  const buildRequestPayload = (values) => {
    const visitArea = [values.areaPref, values.areaCity].filter(Boolean).join(" ");
    const selectedService = values.preferredService || values.selectedItems || values.plan;
    const sourcePage = `${window.location.pathname}${window.location.search}`;

    return {
      受付種別: "相談",
      お名前: values.name || "",
      電話番号: values.phone || "",
      メールアドレス: values.email || "",
      希望連絡方法: values.preferredContactMethod || "",
      希望サービス: selectedService || "",
      訪問エリア: visitArea || "",
      詳しい訪問場所: values.specificAddress || "",
      訪問場所調整: values.totalKm || "",
      シミュレーター概算: values.estimatedTotal || "",
      オプション: values.options || values.selectedItems || "",
      希望内容: values.notes || "",
      購入品の有無: values.hasPurchaseItems || "",
      購入予定額・予算上限: values.purchaseBudget || "",
      備考: values.remarks || "",
      流入元ページ: sourcePage,
      sourcePage,
      formType: "request",
      source_site: "kazokunokawari",
      timestamp: new Date().toISOString(),
      areaPref: values.areaPref || "",
      areaCity: values.areaCity || "",
      plan: values.plan || "",
      selectedItems: values.selectedItems || "",
      totalKm: values.totalKm || "",
      urgency: values.urgency || "",
      breakdownJSON: values.breakdownJSON || "",
      estimatedTotal: values.estimatedTotal || "",
    };
  };

  const buildPartnerPayload = (values) => ({
    受付種別: "相談",
    お名前: values.name || "",
    電話番号: values.phone || "",
    メールアドレス: values.email || "",
    希望連絡方法: values.preferredContactMethod || "メール",
    希望サービス: "パートナー登録",
    訪問エリア: values.area || "",
    詳しい訪問場所: values.address || "",
    希望内容: values.notes || "パートナー登録",
    備考: values.remarks || "",
    流入元ページ: `${window.location.pathname}${window.location.search}`,
    sourcePage: `${window.location.pathname}${window.location.search}`,
    formType: "partner",
    source_site: "kazokunokawari",
    timestamp: new Date().toISOString(),
  });

  const buildPayload = (formElement) => {
    const values = getFormValues(formElement);
    return formElement.id === "form-request"
      ? buildRequestPayload(values)
      : buildPartnerPayload(values);
  };

  const handleFormSubmit = async (event, formElement) => {
    event.preventDefault();

    const { submitBtn, btnText, originalText } = getSubmitElements(formElement);

    if (!gasWebAppUrl) {
      showError("現在、フォーム送信は準備中です。今しばらくお待ちください。");
      return;
    }

    if (submittingForms.has(formElement)) {
      return;
    }

    if (Date.now() - loadedAt < 3000) {
      showError("送信が早すぎます。内容を再度確認してください。");
      return;
    }

    const honeypot = formElement.querySelector('input[name="website"]');
    if (honeypot && honeypot.value !== "") {
      return;
    }

    const payload = buildPayload(formElement);
    const serializedPayload = JSON.stringify(payload);

    if (serializedPayload.length > 5000) {
      showError("入力文字数が多すぎます。");
      return;
    }

    submittingForms.add(formElement);
    setSubmitting(submitBtn, btnText, true, originalText);

    try {
      await fetch(gasWebAppUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: serializedPayload,
      });

      window.location.href = `thanks.html?type=${payload.formType}`;
    } catch (error) {
      console.error("Form submit failed:", error);
      showError("送信に失敗しました。通信環境をご確認の上、再度お試しください。");
      submittingForms.delete(formElement);
      setSubmitting(submitBtn, btnText, false, originalText);
    }
  };

  if (requestForm) {
    requestForm.addEventListener("submit", (event) => {
      handleFormSubmit(event, requestForm);
    });
  }

  if (partnerForm) {
    partnerForm.addEventListener("submit", (event) => {
      handleFormSubmit(event, partnerForm);
    });
  }
});
