// 英文句型快速選 — 搜尋 + 分級篩選 + 檔名分組 + 檔案瀏覽模式
(function () {
  "use strict";

  const PAGE = 200;
  const state = {
    mode: "search",        // "search" | "file"
    query: "",             // 搜尋模式：句型內文關鍵字
    fileQuery: "",         // 檔案模式：檔名篩選
    levels: new Set(),
    rendered: 0,
    list: [],
    curGroup: null,
    openGroups: new Set(), // 檔案模式中已展開的群組名
  };

  const els = {
    levels: document.getElementById("levels"),
    q: document.getElementById("q"),
    clear: document.getElementById("clear"),
    expandAll: document.getElementById("expandAll"),
    count: document.getElementById("count"),
    list: document.getElementById("list"),
    more: document.getElementById("more"),
    total: document.getElementById("total"),
    toast: document.getElementById("toast"),
  };

  const levelColor = {};
  LEVELS.forEach((l) => (levelColor[l.code] = l.color));
  els.total.textContent = SENTENCES.length.toLocaleString();

  // 預建「群組 → 句型陣列」索引，檔案模式展開時直接取用
  const byGroup = {};
  SENTENCES.forEach((s) => {
    (byGroup[s.group] = byGroup[s.group] || []).push(s);
  });

  // ---- Level cards ----
  LEVELS.forEach((l) => {
    const b = document.createElement("button");
    b.className = "lvl";
    b.dataset.code = l.code;
    b.title = `${l.code} ${l.name}（${l.count} 句）`;
    b.innerHTML = `<img src="${l.img}" alt="${l.code} ${l.name}" loading="lazy" />
      <span class="check">✓</span><span class="cnt">${l.count}</span>`;
    b.addEventListener("click", () => {
      if (state.levels.has(l.code)) state.levels.delete(l.code);
      else state.levels.add(l.code);
      b.classList.toggle("active", state.levels.has(l.code));
      if (state.mode === "file") renderFile();
      else update();
    });
    els.levels.appendChild(b);
  });

  // ---- Helpers ----
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function highlight(text, q) {
    const safe = escapeHtml(text);
    if (!q) return safe;
    try {
      const re = new RegExp("(" + escapeReg(q) + ")", "ig");
      return safe.replace(re, "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  function buildItem(s, q) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML =
      `<span class="num">#${s.num}</span>` +
      `<span class="badge" style="background:${levelColor[s.level] || "#888"}">${s.level}</span>` +
      `<span class="txt">${highlight(s.text, q)}</span>` +
      `<span class="cpy">複製 ⧉</span>`;
    row.addEventListener("click", () => copy(s.text));
    return row;
  }

  // ---- 搜尋模式 ----
  function getFiltered() {
    const q = state.query.trim().toLowerCase();
    return SENTENCES.filter((s) => {
      if (state.levels.size && !state.levels.has(s.level)) return false;
      if (q && s.text.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function render(reset) {
    const data = getFiltered();
    state.list = data;
    if (reset) {
      state.rendered = 0;
      state.curGroup = null;
      els.list.innerHTML = "";
    }
    const slice = data.slice(state.rendered, state.rendered + PAGE);
    const frag = document.createDocumentFragment();
    slice.forEach((s) => {
      if (s.group !== state.curGroup) {
        state.curGroup = s.group;
        const h = document.createElement("div");
        h.className = "grp";
        h.innerHTML =
          `<span class="grp-name">${escapeHtml(s.group)}</span>` +
          `<span class="grp-lvl" style="background:${levelColor[s.level] || "#888"}">${s.level}</span>`;
        frag.appendChild(h);
      }
      frag.appendChild(buildItem(s, state.query.trim()));
    });
    els.list.appendChild(frag);
    state.rendered += slice.length;

    els.count.textContent = `共 ${data.length.toLocaleString()} 筆` +
      (data.length > state.rendered ? `（已顯示 ${state.rendered.toLocaleString()}）` : "");
    els.more.style.display = state.rendered < data.length ? "block" : "none";

    if (reset && data.length === 0) {
      els.list.innerHTML = `<div class="empty">沒有符合的句型，換個關鍵字或級別試試。</div>`;
      els.more.style.display = "none";
    }
  }

  function update() {
    render(true);
  }

  // ---- 檔案模式 ----
  function getVisibleGroups() {
    const lq = state.fileQuery.trim().toLowerCase();
    return GROUPS.filter((g) => {
      if (state.levels.size && !state.levels.has(g.level)) return false;
      if (lq && g.name.toLowerCase().indexOf(lq) === -1) return false;
      return true;
    });
  }

  function renderFile() {
    const vis = getVisibleGroups();
    els.list.innerHTML = "";
    els.more.style.display = "none";

    if (vis.length === 0) {
      els.list.innerHTML = `<div class="empty">沒有符合的檔案，換個檔名或級別試試。</div>`;
      els.count.textContent = "";
      return;
    }

    const frag = document.createDocumentFragment();
    vis.forEach((g) => {
      const open = state.openGroups.has(g.name);
      const card = document.createElement("div");
      card.className = "filecard";
      const head = document.createElement("div");
      head.className = "filehead";
      head.innerHTML =
        `<span class="chev">${open ? "▾" : "▸"}</span>` +
        `<span class="fname">${escapeHtml(g.name)}</span>` +
        `<span class="grp-lvl" style="background:${levelColor[g.level] || "#888"}">${g.level}</span>` +
        `<span class="fcount">${g.count} 句</span>`;
      head.addEventListener("click", () => {
        if (open) state.openGroups.delete(g.name);
        else state.openGroups.add(g.name);
        renderFile();
      });
      card.appendChild(head);

      if (open) {
        const body = document.createElement("div");
        body.className = "filebody";
        (byGroup[g.name] || []).forEach((s) => body.appendChild(buildItem(s, "")));
        card.appendChild(body);
      }
      frag.appendChild(card);
    });
    els.list.appendChild(frag);

    const totalSent = vis.reduce((a, g) => a + g.count, 0);
    els.count.textContent = `共 ${vis.length} 個檔案 · ${totalSent.toLocaleString()} 句`;

    const allOpen = vis.every((g) => state.openGroups.has(g.name));
    els.expandAll.textContent = allOpen ? "收合全部" : "展開全部";
  }

  function switchMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    if (mode === "file") {
      els.q.placeholder = "輸入檔名篩選，例如 A1、B2_041…";
      els.expandAll.style.display = "";
      renderFile();
    } else {
      els.q.placeholder = "搜尋英文句型，例如 not, would, condition…";
      els.expandAll.style.display = "none";
      render(true);
    }
  }

  // ---- Copy ----
  let toastTimer;
  function copy(text) {
    const done = () => showToast("已複製：" + text.slice(0, 40) + (text.length > 40 ? "…" : ""));
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1600);
  }

  // ---- Events ----
  let debounce;
  els.q.addEventListener("input", (e) => {
    clearTimeout(debounce);
    const v = e.target.value;
    debounce = setTimeout(() => {
      if (state.mode === "file") { state.fileQuery = v; renderFile(); }
      else { state.query = v; update(); }
    }, 120);
  });
  els.clear.addEventListener("click", () => {
    state.query = "";
    state.fileQuery = "";
    els.q.value = "";
    state.levels.clear();
    state.openGroups.clear();
    document.querySelectorAll(".lvl.active").forEach((n) => n.classList.remove("active"));
    if (state.mode === "file") renderFile();
    else update();
  });
  els.more.addEventListener("click", () => render(false));
  els.expandAll.addEventListener("click", () => {
    const vis = getVisibleGroups();
    const allOpen = vis.every((g) => state.openGroups.has(g.name));
    if (allOpen) vis.forEach((g) => state.openGroups.delete(g.name));
    else vis.forEach((g) => state.openGroups.add(g.name));
    renderFile();
  });
  document.querySelectorAll(".mode").forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });

  // init
  update();
})();
