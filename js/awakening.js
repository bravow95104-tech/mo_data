import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];

  // 🔹 輔助函式：處理 NULL 值
  const getVal = (v) => (v === null || v === undefined || String(v).trim() === "" || String(v) === "null") ? "" : String(v);

  // === 響應式判斷 ===
  const isBelow768 = () => window.innerWidth <= 768;
  let resizeFlag = isBelow768();
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentFlag = isBelow768();
      if (currentFlag !== resizeFlag) {
        resizeFlag = currentFlag;
        requestAnimationFrame(applyLayout);
      }
    }, 150);
  });

  const tableContainer = document.getElementById('hero-table-container');
  const cardContainer = document.getElementById('awakening-container');
  const searchInput = document.getElementById('searchInput');

  // 載入資料 (改為從 Supabase 讀取)
  async function loadAwakeningFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('awakening')
        .select('*')
        .order('sort_id', { ascending: true });

      if (error) throw error;

      // 預先處理搜尋用字串
      heroesData = (data || []).map(hero => ({
        ...hero,
        _searchStr: [hero.skill_name, hero.heros].map(v => getVal(v).toLowerCase()).join(' ')
      }));
      
      lastFilteredData = heroesData;
      
      // 🚀 關鍵：在載入資料後再次確認響應式狀態，並延遲執行以確保行動裝置 Viewport 穩定
      resizeFlag = isBelow768();
      applyLayout();
      
      // 針對部分手機瀏覽器延遲修正
      setTimeout(() => {
        const currentFlag = isBelow768();
        if (currentFlag !== resizeFlag) {
          resizeFlag = currentFlag;
          applyLayout();
        }
      }, 300);

    } catch (error) {
      console.error('載入覺醒資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="3">無法載入雲端覺醒資料</td></tr>';
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
    const keyword = searchInput.value.trim().toLowerCase();

    lastFilteredData = heroesData.filter(hero => {
      if (keyword && !hero._searchStr.includes(keyword)) return false;
      return true;
    });

    applyLayout();
  }

  function applyLayout() {
    requestAnimationFrame(() => {
      if (resizeFlag) {
        renderCards(lastFilteredData);
        if (tableContainer) tableContainer.style.display = 'none';
        if (cardContainer) cardContainer.style.display = 'flex';
      } else {
        renderTable(lastFilteredData);
        if (tableContainer) tableContainer.style.display = 'block';
        if (cardContainer) cardContainer.style.display = 'none';
        const table = document.getElementById("heroes-table");
        if (table) table.style.display = "table";
      }
    });
  }

  // 產生表格函式 (電腦版)
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

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

    const keyword = searchInput.value.trim().toLowerCase();

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
      lastFilteredData = heroesData;
      applyLayout();
    });
  }
});
