import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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

  // 1. 載入資料
  try {
    const [cardRes, mapsRes] = await Promise.all([
      supabase.from('card_spirit').select('*').order('sort_id', { ascending: true }),
      supabase.from('detailed_map').select('mapid, drop_equidcard')
    ]);

    if (cardRes.error) throw cardRes.error;
    allCardData = cardRes.data || [];
    mapData = mapsRes.data || [];
    
    populateDatalists(allCardData);
    initializeSortIcons();

    // === 🚀 跨頁面深度連結處理 (僅執行一次) ===
    const urlParams = new URLSearchParams(window.location.search);
    const cardParam = urlParams.get('card');
    const searchName = document.getElementById("searchInput1");
    if (cardParam && searchName) {
      searchName.value = cardParam;
    }

    applyFiltersAndSort();
    updateSortIcons();

  } catch (err) {
    console.error("❌ 資料載入失敗：", err);
    const tbody = document.querySelector("#card-equip-table tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding:20px;">資料載入失敗 (${err.message})</td></tr>`;
  }

  function populateDatalists(data) {
    const uniqueFirst = new Set();
    const uniqueSecond = new Set();
    const uniqueThird = new Set();
    data.forEach(item => {
      if (item.property_first) uniqueFirst.add(item.property_first);
      if (item.property_second) item.property_second.split("、").forEach(val => { const v = val.trim(); if (v) uniqueSecond.add(v); });
      if (item.property_third) item.property_third.split("、").forEach(val => { const v = val.trim(); if (v) uniqueThird.add(v); });
    });
    const fillDatalist = (id, items) => {
      const datalist = document.getElementById(id);
      if (!datalist) return;
      datalist.innerHTML = "";
      Array.from(items).sort().forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        datalist.appendChild(option);
      });
    };
    fillDatalist("propertyFirstList", uniqueFirst);
    fillDatalist("propertySecondList", uniqueSecond);
    fillDatalist("propertyThirdList", uniqueThird);
  }

  function applyFiltersAndSort() {
    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");
    const searchNameInput = document.getElementById("searchInput1");

    const keywordFirst = searchFirst ? searchFirst.value.trim().toLowerCase() : "";
    const keywordSecond = searchSecond ? searchSecond.value.trim().toLowerCase() : "";
    const keywordThird = searchThird ? searchThird.value.trim().toLowerCase() : "";
    const keywordName = searchNameInput ? searchNameInput.value.trim().toLowerCase() : "";

    let filtered = allCardData.filter(item => {
      const matchFirst = !keywordFirst || (item.property_first || "").toLowerCase().includes(keywordFirst);
      const matchSecond = !keywordSecond || (item.property_second || "").toLowerCase().includes(keywordSecond) || (item.property_second || "").toLowerCase().includes("隨機");
      const matchThird = !keywordThird || (item.property_third || "").toLowerCase().includes(keywordThird) || (item.property_third || "").toLowerCase().includes("隨機");
      const matchName = !keywordName || (item.card_id || "").toLowerCase().includes(keywordName);
      return matchFirst && matchSecond && matchThird && matchName;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
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

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      renderCards(lastFilteredData);
      if (tableContainer) tableContainer.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData);
      if (tableContainer) tableContainer.style.display = 'block';
      if (cardContainer) cardContainer.style.display = 'none';
      const table = document.getElementById("card-equip-table");
      if (table) table.style.display = 'table';
    }
  }

  function renderTable(data) {
    const tbody = document.querySelector("#card-equip-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");
    const searchName = document.getElementById("searchInput1");

    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px; color:#999;'>找不到符合條件的靈具卡</td></tr>";
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(item => {
      const tr = document.createElement("tr");
      const foundMaps = mapData.filter(map => (map.drop_equidcard || "").split("、").includes(item.card_id));
      let displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join("、 ") : (item.drop || "-");

      const fields = ['card_id', 'card_lv', 'property_first', 'property_second', 'property_third'];
      fields.forEach((field, index) => {
        const td = document.createElement("td");
        let text = String(item[field] || "");
        let kw = "";
        if (index === 0) kw = searchName ? searchName.value.trim() : "";
        else if (index === 2) kw = searchFirst ? searchFirst.value.trim() : "";
        else if (index === 3) kw = searchSecond ? searchSecond.value.trim() : "";
        else if (index === 4) kw = searchThird ? searchThird.value.trim() : "";

        if (kw) {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escaped})`, "gi");
          td.innerHTML = text.replace(regex, "<span class='highlight'>$1</span>");
        } else {
          td.textContent = text;
        }
        tr.appendChild(td);
      });

      const dropTd = document.createElement("td");
      dropTd.textContent = displayDrop;
      tr.appendChild(dropTd);

      tr.addEventListener("click", () => showDetailModal(item));
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">沒有找到符合條件的靈具卡</p>';
      return;
    }
    
    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");
    const searchName = document.getElementById("searchInput1");

    const fragment = document.createDocumentFragment();
    data.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card-item';
      
      const highlight = (text, kw) => {
        if (!kw) return text;
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, "gi");
        return String(text).replace(regex, "<span class='highlight'>$1</span>");
      };

      cardDiv.innerHTML = `
        <h3>${highlight(card.card_id, searchName ? searchName.value.trim() : "")}</h3>
        <p><strong>等級：</strong>${card.card_lv || '-'}</p>
        <p><strong>第一屬性：</strong>${highlight(card.property_first, searchFirst ? searchFirst.value.trim() : "")}</p>
        <p><strong>第二屬性：</strong>${highlight(card.property_second, searchSecond ? searchSecond.value.trim() : "")}</p>
        <p><strong>第三屬性：</strong>${highlight(card.property_third, searchThird ? searchThird.value.trim() : "")}</p>
      `;
      cardDiv.addEventListener('click', () => showDetailModal(card));
      fragment.appendChild(cardDiv);
    });
    cardContainer.appendChild(fragment);
  }

  const searchFirst = document.getElementById("searchFirst");
  const searchSecond = document.getElementById("searchSecond");
  const searchThird = document.getElementById("searchThird");
  const searchNameInput = document.getElementById("searchInput1");
  const clearFiltersBtn = document.getElementById("clearFilters");

  if (searchFirst) searchFirst.addEventListener("input", applyFiltersAndSort);
  if (searchSecond) searchSecond.addEventListener("input", applyFiltersAndSort);
  if (searchThird) searchThird.addEventListener("input", applyFiltersAndSort);
  if (searchNameInput) searchNameInput.addEventListener("input", applyFiltersAndSort);

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

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      sortConfig = { key: null, direction: 'asc' };
      if (searchFirst) searchFirst.value = "";
      if (searchSecond) searchSecond.value = "";
      if (searchThird) searchThird.value = "";
      if (searchNameInput) searchNameInput.value = "";
      updateSortIcons();
      applyFiltersAndSort();
    });
  }

  // 🚀 新增：摺疊面板監聽
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => header.parentElement.classList.toggle('collapsed'));
  });

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

  function encodeFileName(name) {
    return String(name || "").replace(/[^\w\u4e00-\u9fa5()]/g, '');
  }

  function showDetailModal(item) {
    if (!modalOverlay || !modalBox || !modalContent) return;

    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id;
    img.src = `/mo_data/pic/card-spirit/${encodeFileName(item.card_id)}.png`;
    img.onerror = () => { img.style.display = 'none'; };

    const foundMaps = mapData.filter(map => (map.drop_equidcard || "").split("、").includes(item.card_id));
    let displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join("、 ") : (item.drop || "未知");

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

    modalOverlay.style.display = 'block';
    modalBox.style.display = 'block';
    modalBox.scrollTop = 0;
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (modalBox) modalBox.style.display = 'none';
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
});
