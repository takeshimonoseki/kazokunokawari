(() => {
  const LINE_ADD_URL = "https://lin.ee/9wP0eOt";
  const SHARE_TEXT = "下関の実家・空き家・お墓まわりの代行サービス「家族の代わり」です。";

  function getShareUrl() {
    return window.location.href.split("#")[0];
  }

  function setTemporaryLabel(button, text) {
    const original = button.textContent;
    button.textContent = text;
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  }

  async function copyUrl(button) {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setTemporaryLabel(button, "コピー済み");
    } catch (error) {
      window.prompt("URLをコピーしてください", url);
    }
  }

  async function sharePage(copyButton) {
    const shareData = {
      title: document.title || "家族の代わり",
      text: SHARE_TEXT,
      url: getShareUrl(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }

    await copyUrl(copyButton);
  }

  function createShareActions() {
    if (document.getElementById("share-actions")) return;

    const style = document.createElement("style");
    style.textContent = `
      #share-actions {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: calc(100vw - 32px);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #share-actions a,
      #share-actions button {
        border: none;
        border-radius: 999px;
        padding: 11px 16px;
        font-size: 14px;
        font-weight: 700;
        line-height: 1;
        text-decoration: none;
        box-shadow: 0 8px 22px rgba(0,0,0,.16);
        cursor: pointer;
        white-space: nowrap;
      }
      #share-actions .line {
        background: #06c755;
        color: #fff;
      }
      #share-actions .share,
      #share-actions .copy {
        background: #fff7ed;
        color: #9a3412;
        border: 1px solid #fed7aa;
      }
      @media (max-width: 640px) {
        #share-actions {
          left: 12px;
          right: 12px;
          bottom: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
        }
        #share-actions a,
        #share-actions button {
          padding: 10px 8px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);

    const wrapper = document.createElement("div");
    wrapper.id = "share-actions";
    wrapper.setAttribute("aria-label", "ページ共有と公式LINE");

    const line = document.createElement("a");
    line.className = "line";
    line.href = LINE_ADD_URL;
    line.target = "_blank";
    line.rel = "noopener noreferrer";
    line.textContent = "公式LINE";

    const share = document.createElement("button");
    share.className = "share";
    share.type = "button";
    share.textContent = "共有";

    const copy = document.createElement("button");
    copy.className = "copy";
    copy.type = "button";
    copy.textContent = "URLコピー";

    share.addEventListener("click", () => sharePage(copy));
    copy.addEventListener("click", () => copyUrl(copy));

    wrapper.append(line, share, copy);
    document.body.appendChild(wrapper);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createShareActions);
  } else {
    createShareActions();
  }
})();
