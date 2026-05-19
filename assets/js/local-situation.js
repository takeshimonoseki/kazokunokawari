document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("local-situation");
  const list = document.getElementById("local-situation-list");

  if (!section || !list) {
    return;
  }

  const createCard = (item) => {
    const card = document.createElement("article");
    card.className = "bg-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm";

    const category = document.createElement("p");
    category.className = "text-xs font-black text-orange-600 mb-3";
    category.textContent = item.category || "相談";

    const title = document.createElement("h3");
    title.className = "text-lg font-black text-slate-800 mb-3";
    title.textContent = item.title || "";

    const summary = document.createElement("p");
    summary.className = "text-sm font-bold text-slate-600 leading-relaxed mb-5";
    summary.textContent = item.summary || "";

    const link = document.createElement("a");
    link.className = "inline-flex items-center text-sm font-black text-orange-600 hover:text-orange-700 transition";
    link.href = item.href || "#request-form";
    link.textContent = item.ctaText || "相談する";

    card.append(category, title, summary, link);
    return card;
  };

  fetch("assets/data/local-situation.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("local-situation load failed");
      }
      return response.json();
    })
    .then((items) => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        fragment.appendChild(createCard(item));
      });
      list.appendChild(fragment);
      section.classList.remove("hidden");
    })
    .catch(() => {
      section.classList.add("hidden");
    });
});
