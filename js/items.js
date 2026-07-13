import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 宣告全域對照表
let LINK_MAP = {};

document.addEventListener("DOMContentLoaded", async () => {
  let heroesData = [];
  let lastFilteredData = [];
  let searchTimer = null;
  
  // 🔹 提前初始化 DOM 元素，防止 ReferenceError
  const searchInput = document.getElementById('searchInput');
  const heroesTable = document.getElementById('heroes-table');
  const cardContainer = document.getElementById('hero-card-container');

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
        applyLayout();
      }
    }, 150);
  });

  // === 🛠️ 新增：解析自訂超連結與高亮的工具函式 ===
  function parseCustomLinks(text, keyword = "") {
    if (text === null || text === undefined || String(text).trim() === "") {
      return "-";
    }
    let html = String(text).replace(/\n/g, '<br>');

    // 1. 識別 ^&內容&^ 並轉換為 <a> 超連結
    html = html.replace(/\^\&([\s\S]*?)\&\^/g, (match, p1) => {
      const trimmedText = p1.trim();
      const targetUrl = LINK_MAP[trimmedText] || '#'; 
      return `<a href="${targetUrl}" class="custom-inline-link" style="color: #3399ff; text-decoration: underline; font-weight: bold;">${trimmedText}</a>`;
    });

    // 2. 如果有搜尋關鍵字，為「非 HTML 標籤」的部分進行高亮處理
    if (keyword) {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      // 使用 Token 概念安全替換，避免破壞 <a> 標籤內部的屬性
      const tokens = [];
      // 將 HTML 標籤先抽離出來
      html = html.replace(/(<[^>]+>)/g, (match) => {
        tokens.push(match);
        return `___TOKEN_${tokens.length - 1}___`;
      });
      // 針對純文字進行高亮
      html = html.replace(regex, '<span class="highlight">$1</span>');
      // 將 HTML 標籤還原回去
      html = html.replace(/___TOKEN_(\d+)___/g, (match, index) => tokens[index]);
    }

    return html;
  }

  // === 載入資料 ===
  try {
    // 💡 A. 從 game_systems 撈取啟用的資料來組成 LINK_MAP
    const { data: systemsData, error: sysError } = await supabase
      .from('game_systems')
      .select('title, file_name')
      .eq('is_active', true);

    if (!sysError && systemsData) {
      systemsData.forEach(sys => {
        LINK_MAP[sys.title] = `/mo_data/sys/systems.html?sys=${sys.file_name}`;
        LINK_MAP[`系統>${sys.title}`] = `/mo_data/sys/systems.html?sys=${sys.file_name}`;
      });
    }

    // 💡 B. 撈取 items 道具資料
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('sort_id', { ascending: true });

    if (error) throw error;

    heroesData = data || [];
    applyFilters();
  } catch (error) {
    console.error('載入資料錯誤:', error);
    const tbody = document.querySelector('#heroes-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3">無法載入雲端資料</td></tr>';
    if (cardContainer) cardContainer.innerHTML = '<p style="text-align:center; color:red; padding:20px;">無法載入雲端資料</p>';
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      const name = String(hero.items || "").toLowerCase();
      const desc = String(hero.illustrate || "").toLowerCase();
      return name.includes(keyword) || desc.includes(keyword);
    });

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      renderCards(lastFilteredData);
      if (heroesTable) heroesTable.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData);
      if (heroesTable) heroesTable.style.display = 'table';
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">找不到符合條件的道具</td></tr>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // 圖片欄位
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.textAlign = 'center';
      if (hero.items) {
        const img = document.createElement('img');
        const itemName = String(hero.items).trim();
        const extensions = ['.png'];
        let attempt = 0;
        
        const tryLoad = () => {
          img.src = `../pic/items/${encodeURIComponent(itemName)}${extensions[attempt]}`;
          img.onerror = () => {
            attempt++;
            if (attempt < extensions.length) tryLoad();
            else imgTd.textContent = '—';
          };
        };
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        tryLoad();
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // 名稱與說明欄位
      const fields = ['items', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        let rawValue = hero[field];
        
        // 🛠️ 修正：如果是說明欄位(illustrate)，使用全新的自訂解析超連結功能
        if (field === 'illustrate') {
          td.innerHTML = parseCustomLinks(rawValue, keyword);
        } else {
          // 原本的名稱(items)欄位邏輯維持不變
          if (rawValue === null || rawValue === undefined || String(rawValue).trim() === "") {
              rawValue = "-";
          }
          const value = String(rawValue);
          const htmlValue = value.replace(/\n/g, '<br>');

          if (keyword && value !== "-" && value.toLowerCase().includes(keyword)) {
            const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            td.innerHTML = htmlValue.replace(regex, '<span class="highlight">$1</span>');
          } else {
            td.innerHTML = htmlValue;
          }
        }
        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';

    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的道具</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const itemName = String(hero.items || "").trim();
      const card = document.createElement('div');
      card.className = 'card-item';

      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      const cardHeader = document.createElement('div');
      cardHeader.style.display = 'flex';
      cardHeader.style.alignItems = 'center';
      cardHeader.style.gap = '10px';
      cardHeader.style.marginBottom = '10px';
      cardHeader.style.paddingBottom = '8px';
      cardHeader.style.borderBottom = '1px solid #eee';

      const img = document.createElement('img');
      const extensions = ['.png'];
      let attempt = 0;
      const tryLoadImg = () => {
        img.src = `../pic/items/${encodeURIComponent(itemName)}${extensions[attempt]}`;
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) tryLoadImg();
          else img.style.display = 'none';
        };
      };
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'contain';
      if (itemName) tryLoadImg();

      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.fontSize = '1.1rem';
      title.style.color = '#3399ff';
      title.style.borderBottom = 'none';
      title.style.textAlign = 'left';
      title.innerHTML = highlight(itemName);

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      // 🛠️ 修正：手機版卡片說明欄位也同步改用 parseCustomLinks 處理
      const cardBody = document.createElement('div');
      cardBody.style.fontSize = '14px';
      cardBody.style.lineHeight = '1.6';
      
      const parsedDesc = parseCustomLinks(hero.illustrate, keyword);
      cardBody.innerHTML = `<p><strong>說明：</strong>${parsedDesc}</p>`;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);
      fragment.appendChild(card);
    });
    cardContainer.appendChild(fragment);
  }

  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }
});