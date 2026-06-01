import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === 1. 全域變數與全域函數公開 ===
let mapData = [];

// 定義所有可能的欄位
const ALL_COLUMNS = [
  { id: 'mapid', label: '地圖名稱', default: true },
  { id: 'drop_equidcard', label: '裝備卡', default: true },
  { id: 'drop_skillcard', label: '技能卡', default: true },
  { id: 'drop_rubbish', label: '垃圾', default: true },
  { id: 'drop_hero', label: '英雄卡', default: true },
  { id: 'drop_glory_high', label: '光輝(多)', default: true },
  { id: 'drop_glory_low', label: '光輝(少)', default: true },
  { id: 'maplv', label: '怪物等級', default: false },
  { id: 'def', label: '防禦', default: false },
  { id: 'dodge', label: '閃避', default: false },
  { id: 'drop_combo_old', label: '舊文片', default: false },
  { id: 'drop_combo_new', label: '新文片', default: false },
  { id: 'drop_othrt', label: '其他掉落', default: false }
];

let activeColumns = [];

// --- 公開函數到 window 物件，確保 HTML onclick 能觸發 ---
window.zoomWorldMap = function (src) {
  const modalBox = document.getElementById("modalBox");
  if (!modalBox) return;
  modalBox.classList.add("modal-large-mode");
  document.getElementById("modalContent").innerHTML = `
        <h2 class="hero-name">世界地圖全圖</h2>
        <div class="world-map-zoom-container"><img src="${src}" class="world-map-large-img"></div>
    `;
  showModal();
};

window.openMapDetail = function (mapId) {
  const item = mapData.find(m => m.mapid === mapId);
  if (!item) {
      console.warn("找不到地圖資料:", mapId);
      return;
  }

  const modalContent = document.getElementById("modalContent");
  const autoImagePath = `/mo_data/pic/map/${item.mapid}.jpg`;

  // 判斷邏輯
  const approachA = item.approach_a || "";
  const isTown = approachA.includes("城鎮");
  const showApproach = approachA.includes("要");
  const showExplain = approachA.includes("說明");
  const detailsHTML = `
    ${showApproach ? `<div class="section-gap"><p><strong>走法：</strong>${item.approach || "-"}</p></div>` : ""}
    ${showExplain ? `<div class="section-gap"><p><strong>說明：</strong>${item.illustrate || "-"}</p></div>` : ""}
`.trim();

  // 掉落與戰鬥區塊 (條件隱藏)
  let combatAndDropHTML = '';
  if (!isTown) {
    const hasDrop = !!(item.drop_rubbish || item.drop_hero || item.drop_equidcard || item.drop_skillcard || item.drop_combo_old || item.drop_combo_new || item.drop_othrt);
    combatAndDropHTML = `
            <div class="hero-defdodge section-gap">
                <p><strong>怪物等級：</strong>${item.maplv || "-"}</p>
                <p><strong>防禦：</strong>${item.def || "-"}　<strong>閃避：</strong>${item.dodge || "-"}</p>
            </div>
            ${hasDrop ? `
                <div class="hero-column-details">
                    <p><strong>掉落物品：</strong></p>
                    ${item.drop_rubbish ? `<p class="align-row"><strong>◢ 垃圾：</strong>${item.drop_rubbish}</p>` : ""}
                    ${item.drop_equidcard ? `<p class="align-row"><strong>◢ 裝備卡：</strong>${item.drop_equidcard}</p>` : ""}
                    ${item.drop_skillcard ? `<p class="align-row"><strong>◢ 技能卡：</strong>${String(item.drop_skillcard).replace(/\n/g, '<br>')}</p>` : ""}
                    ${item.drop_hero ? `<p class="align-row"><strong>◢ 英雄卡：</strong>${String(item.drop_hero).replace(/\n/g, '<br>')}</p>` : ""}
                    ${item.drop_combo_old ? `<p class="align-row"><strong>◢ 舊文片：</strong>${String(item.drop_combo_old).replace(/\n/g, '<br>')}</p>` : ""}
                    ${item.drop_combo_new ? `<p class="align-row"><strong>◢ 新文片：</strong>${String(item.drop_combo_new).replace(/\n/g, '<br>')}</p>` : ""}
                    ${item.drop_othrt ? `<p class="align-row"><strong>◢ 其他：</strong>${String(item.drop_othrt).replace(/\n/g, '<br>')}</p>` : ""}
                </div>` : ""
      }
            <div class="hero-column-details">
                <p><strong>光輝資訊：</strong></p>
                <p class="align-row"><strong>◢ 掉落較高：</strong>${item.drop_glory_high || "-"}</p>
                <p class="align-row"><strong>◢ 掉落較低：</strong>${item.drop_glory_low || "-"}</p>
                ${item.drop_glory_player ? `<p class="align-row"><strong>◢ 玩家提供：</strong>${item.drop_glory_player}</p>` : ""}
            </div>
        `;
  }

  modalContent.innerHTML = `
        <h2 class="hero-name">${item.mapid}</h2>
        <img src="${autoImagePath}" class="hero-image" onerror="this.style.display='none'" />
        ${(showApproach || showExplain) ?
      `<div class="hero-column-details">${detailsHTML}</div>` :
      ""
    }
        ${combatAndDropHTML}
    `;

  showModal();
};

// === 2. 核心初始化 ===
document.addEventListener("DOMContentLoaded", () => {
  loadColumnSettings();
  loadData();
  initMapTabs();
  initImageMapResizer();
  bindModalEvents();
});

// === 3. 資料載入與對接 ===
async function loadData() {
  const [mapRes, gloryRes] = await Promise.all([
    supabase.from('detailed_map').select('*').order('sort_id', { ascending: true }),
    supabase.from('glory_drop').select('*')
  ]);

  if (mapRes.error) {
    console.error('載入地圖資料錯誤:', mapRes.error);
    const tbody = document.querySelector('#heroes-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入地圖資料</td></tr>';
    return;
  }

  const rawMapData = mapRes.data;
  const gloryDropData = gloryRes.data || [];

  mapData = rawMapData.map(map => {
    const matchedGlory = gloryDropData.find(g => {
      if (!g.area) return false;
      const areas = g.area.split('、');
      return areas.includes(map.mapid);
    });

    if (matchedGlory) {
      return {
        ...map,
        drop_glory_high: matchedGlory.more,
        drop_glory_low: matchedGlory.low,
        glory_area: matchedGlory.area
      };
    }
    return map;
  });

  console.log("✅ 地圖與光輝資料載入完成");

  if (document.querySelector("#heroes-table tbody")) {
    initTableSearch();
    initColumnSettings();
  }
}

// === 4. 表格與搜尋邏輯 ===
function initTableSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById('clearFilters');
  if (!searchInput) return;

  renderTable(mapData, "");

  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    applyFilters(keyword);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters("");
      searchInput.focus();
    });
  }
}

function applyFilters(keyword) {
  const filtered = mapData.filter(item => {
    return (
      (item.mapid && item.mapid.toLowerCase().includes(keyword)) ||
      (item.drop_rubbish && item.drop_rubbish.includes(keyword)) ||
      (item.drop_hero && item.drop_hero.includes(keyword)) ||
      (item.drop_equidcard && item.drop_equidcard.includes(keyword)) ||
      (item.drop_skillcard && item.drop_skillcard.includes(keyword)) ||
      (item.drop_combo_old && item.drop_combo_old.includes(keyword)) ||
      (item.drop_combo_new && item.drop_combo_new.includes(keyword)) ||
      (item.drop_glory_high && item.drop_glory_high.includes(keyword)) ||
      (item.maplv && String(item.maplv).includes(keyword))
    );
  });
  renderTable(filtered, keyword);
}

function renderTable(data, keyword = "") {
  const thead = document.querySelector("#heroes-table thead tr");
  const tbody = document.querySelector("#heroes-table tbody");
  const table = document.getElementById("heroes-table");
  if (!tbody || !thead) return;

  table.classList.add("rwd-card");
  thead.innerHTML = "";
  activeColumns.forEach(colId => {
    const colInfo = ALL_COLUMNS.find(c => c.id === colId);
    const th = document.createElement("th");
    th.className = "sortable";
    th.dataset.col = colId;
    th.textContent = colInfo ? colInfo.label : colId;
    thead.appendChild(th);
  });

  tbody.innerHTML = "";
  const fragment = document.createDocumentFragment();

  if (data.length === 0) {
    const emptyTr = document.createElement("tr");
    emptyTr.innerHTML = `<td colspan="${activeColumns.length}" style="text-align:center;">找不到相符的地圖資料</td>`;
    tbody.appendChild(emptyTr);
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.onclick = () => window.openMapDetail(item.mapid);

    activeColumns.forEach((colId, index) => {
      const td = document.createElement("td");
      const colInfo = ALL_COLUMNS.find(c => c.id === colId);
      td.setAttribute("data-label", colInfo ? colInfo.label : colId);

      let val = item[colId];
      let text = (val !== null && val !== undefined) ? String(val) : "-";
      let content = text.replace(/\n/g, '<br>');

      if (keyword && content !== "-" && content.toLowerCase().includes(keyword.toLowerCase())) {
        const regex = new RegExp(`(${keyword})`, 'gi');
        content = content.replace(regex, '<span class="highlight">$1</span>');
      }

      if (colId === 'mapid') {
        td.innerHTML = `<strong>${content}</strong>`;
      } else {
        td.innerHTML = content;
      }
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);
}

// === 5. 欄位設定 ===
function initColumnSettings() {
  const btn = document.getElementById("columnSettingsBtn");
  const menu = document.getElementById("columnSettingsMenu");
  const container = document.getElementById("columnCheckboxes");
  const saveBtn = document.getElementById("saveColumnSettings");
  const closeBtn = document.getElementById("closeColumnSettings");
  const resetBtn = document.getElementById("resetDefaultColumns");

  if (!btn || !menu || !container) return;

  const generateCheckboxes = () => {
    container.innerHTML = "";
    ALL_COLUMNS.forEach(col => {
      const label = document.createElement("label");
      label.className = "checkbox-item";
      const isChecked = activeColumns.includes(col.id) || col.id === 'mapid';
      const isDisabled = col.id === 'mapid';

      label.innerHTML = `
        <input type="checkbox" value="${col.id}" 
          ${isChecked ? 'checked' : ''} 
          ${isDisabled ? 'disabled' : ''}>
        ${col.label} ${isDisabled ? '(固定)' : ''}
      `;
      container.appendChild(label);
    });
  };

  generateCheckboxes();

  btn.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  };

  closeBtn.onclick = () => menu.classList.remove("active");

  resetBtn.onclick = () => {
    activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
    generateCheckboxes();
    saveBtn.click();
  };

  saveBtn.onclick = () => {
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    activeColumns = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    if (activeColumns.length === 0) activeColumns = ['mapid'];
    localStorage.setItem("mapActiveColumns", JSON.stringify(activeColumns));
    menu.classList.remove("active");
    const searchInput = document.getElementById("searchInput");
    renderTable(mapData, searchInput ? searchInput.value : "");
  };

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.classList.remove("active");
    }
  });
}

function loadColumnSettings() {
  const saved = localStorage.getItem("mapActiveColumns");
  if (saved) {
    try {
      activeColumns = JSON.parse(saved);
    } catch (e) {
      activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
    }
  } else {
    activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
  }
}

// === 6. 地圖互動邏輯 ===
function initMapTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const scrollLeftBtn = document.getElementById("scroll-left");
  const scrollRightBtn = document.getElementById("scroll-right");
  const tabsScroll = document.getElementById("tabs-scroll");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button, .tab-content").forEach(el => el.classList.remove("active"));
      button.classList.add("active");
      const target = document.getElementById(button.dataset.tab);
      if (target) {
        target.classList.add("active");
        if (typeof imageMapResize === 'function') {
          setTimeout(() => imageMapResize('map'), 150);
        }
      }
    });
  });

  if (scrollLeftBtn && scrollRightBtn && tabsScroll) {
    scrollLeftBtn.addEventListener("click", () => tabsScroll.scrollBy({ left: -200, behavior: "smooth" }));
    scrollRightBtn.addEventListener("click", () => tabsScroll.scrollBy({ left: 200, behavior: "smooth" }));
    const updateArrows = () => {
      const scrollLeft = tabsScroll.scrollLeft;
      const maxScroll = tabsScroll.scrollWidth - tabsScroll.clientWidth;
      scrollLeftBtn.style.opacity = scrollLeft <= 0 ? "0.3" : "1";
      scrollLeftBtn.style.pointerEvents = scrollLeft <= 0 ? "none" : "auto";
      scrollRightBtn.style.opacity = scrollLeft >= maxScroll - 1 ? "0.3" : "1";
      scrollRightBtn.style.pointerEvents = scrollLeft >= maxScroll - 1 ? "none" : "auto";
    };
    tabsScroll.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }
}

function initImageMapResizer() {
  try {
    if (typeof imageMapResize === 'function' && document.querySelector('map')) {
      imageMapResize('map');
    }
  } catch (e) { console.warn("Resizer skipped"); }
}

// === 7. Modal 控制 ===
function showModal() {
  const modalBox = document.getElementById("modalBox");
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.style.display = "block";
  if (modalBox) {
    modalBox.style.display = "block";
    modalBox.scrollTop = 0;
  }
}

function closeModal() {
  const box = document.getElementById("modalBox");
  const overlay = document.getElementById("modalOverlay");
  if (box) {
      box.style.display = "none";
      box.classList.remove("modal-large-mode");
  }
  if (overlay) overlay.style.display = "none";
}

function bindModalEvents() {
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.querySelector(".close-btn");
  if (overlay) overlay.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
}
