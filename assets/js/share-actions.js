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
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        z-index: 9999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #share-actions .share-toggle {
        width: 58px;
        height: 58px;
        border: none;
        border-radius: 999px;
        background: #fb923c;
        color: #fff;
        font-size: 14px;
        font-weight: 900;
        box-shadow: 0 10px 28px rgba(0,0,0,.22);
        cursor: pointer;
      }

      #share-actions .share-menu {
        position: absolute;
        right: 0;
        bottom: 68px;
        display: none;
        min-width: 168px;
        padding: 8px;
        border-radius: 18px;
        background: rgba(255, 255, 255, .96);
        border: 1px solid #fed7aa;
        box-shadow: 0 12px 32px rgba(0,0,0,.18);
      }

      #share-actions.is-open .share-menu {
        display: grid;
        gap: 8px;
      }

      #share-actions a,
      #share-actions button {
        -webkit-tap-highlight-color: transparent;
      }

      #share-actions .share-menu a,
      #share-actions .share-menu button {
        display: block;
        width: 100%;
        border: none;
        border-radius: 999px;
        padding: 12px 14px;
        font-size: 14px;
        font-weight: 800;
        line-height: 1;
        text-align: center;
        text-decoration: none;
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
          right: 12px;
          bottom: calc(88px + env(safe-area-inset-bottom, 0px));
        }

        #share-actions .share-toggle {
          width: 54px;
          height: 54px;
          font-size: 13px;
        }

        #share-actions .share-menu {
          right: 0;
          bottom: 62px;
          min-width: 154px;
        }

        body {
          padding-bottom: 0;
        }
      }
    `;
    document.head.appendChild(style);

    const wrapper = document.createElement("div");
    wrapper.id = "share-actions";
    wrapper.setAttribute("aria-label", "ページ共有と公式LINE");

    const toggle = document.createElement("button");
    toggle.className = "share-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "共有";

    const menu = document.createElement("div");
    menu.className = "share-menu";

    const line = document.createElement("a");
    line.className = "line";
    line.href = LINE_ADD_URL;
    line.target = "_blank";
    line.rel = "noopener noreferrer";
    line.textContent = "公式LINE";

    const share = document.createElement("button");
    share.className = "share";
    share.type = "button";
    share.textContent = "共有する";

    const copy = document.createElement("button");
    copy.className = "copy";
    copy.type = "button";
    copy.textContent = "URLコピー";

    toggle.addEventListener("click", () => {
      const isOpen = wrapper.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    share.addEventListener("click", async () => {
      await sharePage(copy);
      wrapper.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });

    copy.addEventListener("click", async () => {
      await copyUrl(copy);
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        wrapper.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    menu.append(line, share, copy);
    wrapper.append(toggle, menu);
    document.body.appendChild(wrapper);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createShareActions);
  } else {
    createShareActions();
  }
})();
