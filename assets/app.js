async function loadEntries() {
  const res = await fetch("./data/entries.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load entries.json");
  return await res.json();
}

function uniq(arr){ return Array.from(new Set(arr)); }

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: (p.get("q") || "").trim(),
    tag: (p.get("tag") || "").trim(),
  };
}

function setParam(key, value) {
  const url = new URL(window.location.href);
  if (!value) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}

function normalize(s){ return (s || "").toString().toLowerCase(); }

function matches(entry, q) {
  if (!q) return true;
  const hay = [
    entry.title, entry.excerpt, entry.place, entry.date,
    ...(entry.tags || []),
  ].map(normalize).join(" ");
  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  return tokens.every(t => hay.includes(t));
}

function renderTags(allTags, activeTag) {
  const wrap = document.getElementById("tagChips");
  wrap.innerHTML = "";
  const makeChip = (label, value) => {
    const btn = document.createElement("button");
    btn.className = "tag" + ((activeTag || "") === value ? " active" : "");
    btn.type = "button";
    btn.textContent = label;
    btn.onclick = () => {
      const newTag = (activeTag === value) ? "" : value;
      setParam("tag", newTag);
      window.dispatchEvent(new Event("filtersChanged"));
    };
    return btn;
  };
  wrap.appendChild(makeChip("All", ""));
  allTags.forEach(t => wrap.appendChild(makeChip(t, t)));
}

function renderList(entries) {
  const wrap = document.getElementById("entryList");
  const count = document.getElementById("resultCount");
  wrap.innerHTML = "";
  count.textContent = `${entries.length} result${entries.length === 1 ? "" : "s"}`;

  entries.forEach(e => {
    const card = document.createElement("div");
    card.className = "card entry-card";

    const h3 = document.createElement("h3");
    const link = document.createElement("a");
    link.href = e.href;
    link.textContent = e.title;
    h3.appendChild(link);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span>📅 ${e.date || "—"}</span>
      <span>📍 ${e.place || "—"}</span>
    `;

    const p = document.createElement("p");
    p.textContent = e.excerpt || "";

    const tags = document.createElement("div");
    tags.className = "tags";
    (e.tags || []).forEach(t => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag";
      chip.textContent = t;
      chip.onclick = () => {
        setParam("tag", t);
        window.dispatchEvent(new Event("filtersChanged"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      tags.appendChild(chip);
    });

    card.appendChild(h3);
    card.appendChild(meta);
    card.appendChild(p);
    card.appendChild(tags);
    wrap.appendChild(card);
  });
}

async function initBrowse() {
  const entries = await loadEntries();
  const allTags = uniq(entries.flatMap(e => e.tags || [])).sort((a,b)=>a.localeCompare(b));
  const qInput = document.getElementById("q");
  const { q, tag } = getParams();
  qInput.value = q;

  renderTags(allTags, tag);

  function apply() {
    const { q, tag } = getParams();
    const filtered = entries
      .filter(e => matches(e, q))
      .filter(e => !tag || (e.tags || []).includes(tag));
    renderList(filtered);
    renderTags(allTags, tag);
  }

  qInput.addEventListener("input", () => {
    setParam("q", qInput.value.trim());
    apply();
  });

  window.addEventListener("filtersChanged", apply);
  apply();
}

function initHomeSearch() {
  const form = document.getElementById("homeSearchForm");
  if (!form) return;
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const q = document.getElementById("homeQ").value.trim();
    const url = new URL("./browse.html", window.location.href);
    if (q) url.searchParams.set("q", q);
    window.location.href = url.toString();
  });
}

window.TemplateApp = { initBrowse, initHomeSearch };
