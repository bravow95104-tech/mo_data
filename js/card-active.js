import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  let allCardData = [];
  let mapData = [];
  let lastFilteredData = [];
  let sortConfig = { key: null, direction: 'asc' };

  const isBelow768 = () => window.innerWidth <= 768;
  let resizeFlag = isBelow768();
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentFlag = isBelow768();
      if (currentFlag !== resizeFlag) {
        resizeFlag = currentFlag;
        applyLayout();
      }
    }, 150);
  });
  
  const tableContainer = document.getElementById('card-equip-table-container');
  const cardContainer = document.getElementById('card-equip-container');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('#modalBox .close-btn');
  const searchInput = document.getElementById("searchInput");

  // --- 🚀 新增：地圖連結格式化 ---
  const formatMapLinks = (text) => {
    if (!text || text === "-") return "-";
    // 支援、或逗號分隔
    return text.split(/[、,]\s*/).map(mapName => {
      const trimmed = mapName.trim();
      if (!trimmed) return "";
      // 串接到地圖頁面，並帶上 map 參數
      return `<a href="../map/detailed_map.html?map=${encodeURIComponent(trimmed)}" class="hero-link">${trimmed}</a>`;
    }).join('、');
  };

  // 1. 載入資料
  try {
    const [cardRes, mapsRes] = await Promise.all([
      supabase.from('card_active').select('*').order('sort_id', { ascending: true }),
      supabase.from('detailed_map').select('mapid, drop_skillcard')
    ]);

    if (cardRes.error) throw cardRes.error;
    allCardData = cardRes.data || [];
    mapData = mapsRes.data || [];

    initializeSortIcons();

    // === 🚀 處理跨頁面跳轉 ===
    const urlParams = new URLSearchParams(window.location.search);
    const cardParam = urlParams.get('card');
    if (cardParam) {
      const exists = allCardData.some(c => c.card_id === cardParam);
      if (exists) {
        if (searchInput) searchInput.value = cardParam;
        applyFiltersAndSort();
        // 自動開啟彈窗
        const matched = lastFilteredData.find(c => c.card_id === cardParam);
        if (matched) showDetailModal(matched);
      } else {
        // 找不到則跳轉
        window.location.href = `card-passive.html?card=${encodeURIComponent(cardParam)}`;
        return;
      }
    } else {
      applyFiltersAndSort();
      updateSortIcons();
    }

  } catch (err) {
    console.error("❌ 資料載入失敗：", err);
    if (cardContainer) cardContainer.innerHTML = `<p style='text-align:center; padding:20px; color:red;'>無法載入資料 (${err.message})</p>`;
  }

  // 2. 核心邏輯
  function applyFiltersAndSort() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const activeCardClasses = Array.from(document.querySelectorAll('.filter-btn.active[data-type="card_class"]')).map(btn => btn.dataset.value);

    let filteredData = allCardData.filter(item => {
      const matchSearch = !keyword || [
        item.card_id,
        item.card_class,
        item.directions,
        item.card_property
      ].some(val => String(val || "").toLowerCase().includes(keyword));
      const matchCardClass = activeCardClasses.length === 0 || activeCardClasses.includes(item.card_class);
      return matchSearch && matchCardClass;
    });

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) { valA = numA; valB = numB; }
        else { valA = String(valA || "").toLowerCase(); valB = String(valB || "").toLowerCase(); }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    lastFilteredData = filteredData;
    applyLayout();
  }

  function applyLayout() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    // 強制更新 resizeFlag 確保狀態正確
    resizeFlag = isBelow768();

    if (resizeFlag) {
      renderCards(lastFilteredData, keyword);
      if (tableContainer) tableContainer.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData, keyword);
      if (tableContainer) tableContainer.style.display = 'block';
      if (cardContainer) cardContainer.style.display = 'none';
      const table = document.getElementById("card-equip-table");
      if (table) table.style.display = 'table';
    }
  }
  function renderTable(data, keyword) {
    const tbody = document.querySelector("#card-equip-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:20px; color:#999;'>找不到符合條件的技能卡</td></tr>";
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(item => {
      const tr = document.createElement("tr");
      const foundMaps = mapData.filter(map => (map.drop_skillcard || "").split('、').includes(item.card_id));
      let displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (item.drop || "-");

      const fields = ['card_id', 'card_lv', 'card_property', 'card_class', 'card_mp', 'directions'];
      fields.forEach(field => {
        const td = document.createElement("td");
        if (field === 'card_id') td.classList.add('table-title-cell');
        const str = String(item[field] || "");
        
        if (keyword && str.toLowerCase().includes(keyword)) {
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escaped})`, "gi");
          td.innerHTML = str.replace(regex, "<span class='highlight2'>$1</span>");
        } else {
          td.textContent = str;
        }
        tr.appendChild(td);
      });

      const dropTd = document.createElement("td");
      dropTd.innerHTML = formatMapLinks(displayDrop);
      dropTd.addEventListener("click", (e) => {
        if (e.target.tagName === 'A') e.stopPropagation();
      });
      tr.appendChild(dropTd);

      tr.addEventListener("click", (e) => {
        if (e.target.tagName === 'A') return;
        showDetailModal(item);
      });
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  function renderCards(data, keyword) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">沒有找到符合條件的技能卡</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    data.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card-item';

      const highlight = (text) => {
        if (!keyword) return text;
        const escaped = String(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, "gi");
        return String(text).replace(regex, "<span class='highlight2'>$1</span>");
      };

      const foundMaps = mapData.filter(map => (map.drop_skillcard || "").split('、').includes(card.card_id));
      let displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (card.drop || "-");

      cardDiv.innerHTML = `
        <h3>${highlight(card.card_id)}</h3>
        <p><strong>等級：</strong>${card.card_lv || '-'}</p>
        <p><strong>屬性：</strong>${highlight(card.card_property || '-')}</p>
        <p><strong>拜官：</strong>${highlight(card.card_class || '-')}</p>
        <p><strong>消耗MP：</strong>${card.card_mp || '-'}</p>
        <p><strong>說明：</strong>${highlight(card.directions || '-')}</p>
        <p><strong>掉落地圖：</strong>${formatMapLinks(displayDrop)}</p>
      `;
      cardDiv.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') return;
        showDetailModal(card);
      });
      fragment.appendChild(cardDiv);
    });
    cardContainer.appendChild(fragment);
  }

  // 3. 事件綁定
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFiltersAndSort();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      applyFiltersAndSort();
    });
  });

  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      if (sortConfig.key === column) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = column;
        sortConfig.direction = 'desc';
      }
      updateSortIcons();
      applyFiltersAndSort();
    });
  });

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      sortConfig = { key: null, direction: 'asc' };
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove("active"));
      if (searchInput) searchInput.value = "";
      updateSortIcons();
      applyFiltersAndSort();
    });
  }

  // 🚀 新增：摺疊面板監聽
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => header.parentElement.classList.toggle('collapsed'));
  });

  // 4. 工具函數
  function initializeSortIcons() {
    document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
      if (th.querySelector('.header-content')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'header-content';
      const textSpan = document.createElement('span');
      while (th.firstChild) textSpan.appendChild(th.firstChild);
      const iconContainer = document.createElement('span');
      iconContainer.className = 'sort-icon-container';
      iconContainer.innerHTML = '<span class="sort-arrow arrow-up">▲</span><span class="sort-arrow arrow-down">▼</span>';
      wrapper.appendChild(textSpan);
      wrapper.appendChild(iconContainer);
      th.appendChild(wrapper);
    });
  }

  function updateSortIcons() {
    document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === sortConfig.key) th.classList.add(`sorted-${sortConfig.direction}`);
    });
  }

  function showDetailModal(item) {
    if (!modalOverlay || !modalBox || !modalContent) return;
    const encodeName = (n) => String(n || "").replace(/[^\w\u4e00-\u9fa5()]/g, "");
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id;
    img.src = `/mo_data/pic/card-active/${encodeName(item.card_id)}.png`;
    img.onerror = () => { img.style.display = 'none'; };

    const foundMaps = mapData.filter(map => (map.drop_skillcard || "").split('、').includes(item.card_id));
    let displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (item.drop || "未知");

    // 根據是否為手機版決定顯示內容
    const isMobile = isBelow768();

    modalContent.innerHTML = `
      <h2 class="hero-name">${item.card_id}</h2>
      <div id="modal-img-col" style="text-align: center; margin-bottom: 15px;"></div>
      ${isMobile ? `
      <div class="hero-column right">
        <p><strong>掉落地圖：</strong><br>${displayDrop}</p>
      </div>
      ` : ''}
    `;
    const imgCol = modalContent.querySelector('#modal-img-col');
    if (imgCol) imgCol.appendChild(img);

    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    modalBox.scrollTop = 0;
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = "none";
    if (modalBox) modalBox.style.display = "none";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});
