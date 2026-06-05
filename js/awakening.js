import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Awakening.js: DOMContentLoaded");
  let heroesData = [];
  let lastFilteredData = [];

  // 🔹 輔助函式：處理 NULL 值
  const getVal = (v) => (v === null || v === undefined || String(v).trim() === "" || String(v) === "null") ? "" : String(v);

  // === 響應式判斷 ===
  function isBreakpointBelow768() {
    return window.innerWidth <= 768;
  }
  let resizeFlag = isBreakpointBelow768();
  let resizeTimeout = null;

  console.log("Awakening.js: Initial resizeFlag:", resizeFlag, "width:", window.innerWidth);

  window.addEventListener("resize", () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const isBelowNow = isBreakpointBelow768();
      if (isBelowNow !== resizeFlag) {
        console.log("Awakening.js: Resize detected, new width:", window.innerWidth, "isBelowNow:", isBelowNow);
        resizeFlag = isBelowNow;
        applyLayout();
      }
    }, 150);
  });

  const tableContainer = document.getElementById('hero-table-container');
  const cardContainer = document.getElementById('awakening-container');
  const searchInput = document.getElementById('searchInput');

  // 載入資料 (改為從 Supabase 讀取)
  async function loadAwakeningFromSupabase() {
    try {
      console.log("Awakening.js: Fetching data...");
      const { data, error } = await supabase
        .from('awakening')
        .select('*')
        .order('sort_id', { ascending: true });

      if (error) throw error;
      console.log("Awakening.js: Data fetched, count:", data ? data.length : 0);

      // 預先處理搜尋用字串
      heroesData = (data || []).map(hero => ({
        ...hero,
        _searchStr: [hero.skill_name, hero.heros].map(v => getVal(v).toLowerCase()).join(' ')
      }));
      
      lastFilteredData = heroesData;

      // 延遲一點點執行，確保 iPhone Viewport 穩定
      setTimeout(() => {
        console.log("Awakening.js: Initial applyFiltersAndSort");
        applyFiltersAndSort();
      }, 300);

    } catch (error) {
      console.error('Awakening.js: 載入覺醒資料錯誤:', error);
      const errorMsg = '無法載入雲端覺醒資料';
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="3">${errorMsg}</td></tr>`;
      if (cardContainer) cardContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#ff4d4d;">${errorMsg}</p>`;
    }
  }

  loadAwakeningFromSupabase();

  // 搜尋框邏輯
  if (searchInput) {
    let searchDebounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(applyFiltersAndSort, 250);
    });
  }

  function applyFiltersAndSort() {
    const keyword = searchInput.value ? searchInput.value.trim().toLowerCase() : "";
    console.log("Awakening.js: applyFiltersAndSort, keyword:", keyword);

    lastFilteredData = heroesData.filter(hero => {
      if (keyword && !hero._searchStr.includes(keyword)) return false;
      return true;
    });

    applyLayout();
  }

  function applyLayout() {
    console.log("Awakening.js: applyLayout, resizeFlag:", resizeFlag);
    if (resizeFlag) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (cardContainer) {
        cardContainer.style.display = 'flex';
        renderCards(lastFilteredData);
      }
    } else {
      if (tableContainer) {
        tableContainer.style.display = 'block';
        const table = document.getElementById("heroes-table");
        if (table) table.style.display = "table";
        renderTable(lastFilteredData);
      }
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  // 產生表格函式 (電腦版)
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput.value ? searchInput.value.trim().toLowerCase() : "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">找不到符合條件的覺醒</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const fields = ['skill_name', 'probability', 'heros'];

    data.forEach(hero => {
      const tr = document.createElement('tr');
      fields.forEach(field => {
        const td = document.createElement('td');
        const value = getVal(hero[field]);

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
          td.innerHTML = value.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.textContent = value;
        }
        tr.appendChild(td);
      });
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // 產生卡片函式 (手機版)
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';

    const keyword = searchInput.value ? searchInput.value.trim().toLowerCase() : "";

    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">找不到符合條件的覺醒</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(hero => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card-item';

      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      cardDiv.innerHTML = `
        <h3>${highlight(getVal(hero.skill_name))}</h3>
        <p><strong>獲取機率：</strong>${getVal(hero.probability) || '-'}</p>
        <p><strong>對應英雄：</strong>${highlight(getVal(hero.heros) || '-')}</p>
      `;
      fragment.appendChild(cardDiv);
    });
    cardContainer.appendChild(fragment);
  }

  // 清除篩選
  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      applyFiltersAndSort();
    });
  }

  // Accordion (如果有使用的話)
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.parentElement.classList.toggle("collapsed");
    });
  });
});
