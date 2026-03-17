async function loadEntries() {
  const res = await fetch("./data/entries.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load entries.json");
  return await res.json();
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function normalize(s) {
  return (s || "").toString().toLowerCase();
}

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: (p.get("q") || "").trim(),
    tag: (p.get("tag") || "").trim(),
  };
}

function setParam(key, value) {
  const url = new URL(window.location.href);
  if (!value) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }
  window.history.replaceState({}, "", url);
}

function matches(entry, q) {
  if (!q) return true;

  const haystack = [
    entry.title,
    entry.excerpt,
    entry.place,
    entry.date,
    ...(entry.tags || []),
  ]
    .map(normalize)
    .join(" ");

  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  return tokens.every(token => haystack.includes(token));
}

function renderTags(allTags, activeTag) {
  const wrap = document.getElementById("tagChips");
  if (!wrap) return;

  wrap.innerHTML = "";

  function makeChip(label, value) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag" + ((activeTag || "") === value ? " active" : "");
    btn.textContent = label;

    btn.onclick = () => {
      const newTag = activeTag === value ? "" : value;
      setParam("tag", newTag);
      window.dispatchEvent(new Event("filtersChanged"));
    };

    return btn;
  }

  wrap.appendChild(makeChip("All", ""));

  allTags.forEach(tag => {
    wrap.appendChild(makeChip(tag, tag));
  });
}

function renderList(entries) {
  const wrap = document.getElementById("entryList");
  const count = document.getElementById("resultCount");

  if (!wrap) return;

  wrap.innerHTML = "";

  if (count) {
    count.textContent = `${entries.length} result${entries.length === 1 ? "" : "s"}`;
  }

  entries.forEach(entry => {
    const card = document.createElement("a");
    card.className = "entry-card";
    card.href = entry.href;

    const imgSrc = entry.image || "./assets/placeholder.jpg";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${entry.title}">
      <div class="entry-info">
        <h3>${entry.title}</h3>
        <div class="meta">
          <span>${entry.date || ""}</span>
          <span>${entry.place || ""}</span>
        </div>
        <p>${entry.excerpt || ""}</p>
      </div>
    `;

    wrap.appendChild(card);
  });
}

async function initBrowse() {
  const entries = await loadEntries();

  const allTags = uniq(
    entries.flatMap(entry => entry.tags || [])
  ).sort((a, b) => a.localeCompare(b));

  const qInput = document.getElementById("q");
  const { q, tag } = getParams();

  if (qInput) {
    qInput.value = q;

    qInput.addEventListener("input", () => {
      setParam("q", qInput.value.trim());
      applyFilters();
    });
  }

  function applyFilters() {
    const { q, tag } = getParams();

    const filtered = entries
      .filter(entry => matches(entry, q))
      .filter(entry => !tag || (entry.tags || []).includes(tag));

    renderTags(allTags, tag);
    renderList(filtered);
  }

  window.addEventListener("filtersChanged", applyFilters);

  renderTags(allTags, tag);
  renderList(
    entries
      .filter(entry => matches(entry, q))
      .filter(entry => !tag || (entry.tags || []).includes(tag))
  );
}

function initHomeSearch() {
  const form = document.getElementById("homeSearchForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const input = document.getElementById("homeQ");
    const q = input ? input.value.trim() : "";

    const url = new URL("./browse.html", window.location.href);
    if (q) {
      url.searchParams.set("q", q);
    }

    window.location.href = url.toString();
  });
}

window.TemplateApp = {
  initBrowse,
  initHomeSearch,
};
