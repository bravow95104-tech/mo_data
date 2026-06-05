import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

document.addEventListener("DOMContentLoaded", async () => {
  let garbageData = [];
  let mapData = [];
  let lastFilteredData = [];
  let searchTimer = null;

  const garbageTable = document.getElementById('hero-table-container');
  const cardContainer = document.getElementById('hero-card-container');
  const searchInput = document.getElementById('searchInput');

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

  // === 載入資料 ===
  try {
    const [garbageRes, mapsRes] = await Promise.all([
      supabase.from('garbage').select('*').order('sort_id', { ascending: true }),
      fetch('../data/detailed_map.json').then(res => {
        if (!res.ok) throw new Error('無法讀取 detailed_map.json');
        return res.json();
      })
    ]);

    if (garbageRes.error) throw garbageRes.error;

    garbageData = garbageRes.data || [];
    mapData = mapsRes || [];
    applyFilters();
  } catch (error) {
    console.error('載入資料錯誤:', error);
    const tbody = document.querySelector('#garbageTable tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6">載入失敗: ${error.message}</td></tr>`;
    if (cardContainer) cardContainer.innerHTML = `<p style="text-align:center; color:red;">載入失敗: ${error.message}</p>`;
  }

  // === 搜尋框（防抖）===
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  // === 綜合篩選 ===
  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = garbageData.filter(garbage => {
      const name = String(garbage.name || "").toLowerCase();
      return name.includes(keyword);
    });

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      renderCards(lastFilteredData);
      if (garbageTable) garbageTable.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData);
      if (garbageTable) garbageTable.style.display = 'table';
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  // === 產生表格 (電腦版) ===
  function renderTable(data) {
    const tbody = document.querySelector('#garbageTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">找不到符合條件的道具</td></tr>';
      return;
    }

    // 🚀 設定表格欄位寬度
    const table = document.getElementById('garbageTable');
    if (table && !table.querySelector('colgroup')) {
      const colgroup = document.createElement('colgroup');
      colgroup.innerHTML = `
        <col style="width: 50px;">
        <col style="width: 50px;">
        <col style="width: 150px;">
        <col style="width: 180px;">
        <col style="width: 180px;">
        <col style="width: 180px;">
      `;
      table.insertBefore(colgroup, table.firstChild);
    }

    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.title = '點擊查看掉落地圖';
      tr.onclick = () => showDropMaps(item.name);

      // === 圖示欄位 ===
      const iconTd = document.createElement('td');
      iconTd.style.textAlign = 'center';
      const img = document.createElement('img');
      img.src = `../pic/garbage/${item.name}.bmp`;
      img.alt = item.name;
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'contain';
      img.onerror = () => { img.style.display = 'none'; };
      iconTd.appendChild(img);
      tr.appendChild(iconTd);

      const fields = ['class', 'name', 'family', 'renown', 'contribute'];

      fields.forEach(field => {
        const td = document.createElement('td');
        const rawValue = item[field] !== undefined ? String(item[field]) : '';
        const htmlValue = rawValue.replace(/\n/g, '<br>');

        if (keyword && rawValue.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }
        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  }

  // === 產生卡片 (手機版) ===
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';

    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的道具</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      const itemName = String(item.name || "").trim();
      const card = document.createElement('div');
      card.className = 'card-item';
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        e.stopPropagation();
        showDropMaps(itemName);
      };

      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      // 卡片標題區域 (含圖示)
      const cardHeader = document.createElement('div');
      cardHeader.style.display = 'flex';
      cardHeader.style.alignItems = 'center';
      cardHeader.style.gap = '8px';
      cardHeader.style.marginBottom = '12px';
      cardHeader.style.paddingBottom = '5px';
      cardHeader.style.borderBottom = '1px solid var(--border-separator)';

      const img = document.createElement('img');
      img.src = `../pic/garbage/${encodeURIComponent(itemName)}.bmp`;
      img.alt = itemName;
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'contain';
      img.onerror = () => { img.style.display = 'none'; };

      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.fontSize = '1.1rem';
      title.style.color = 'var(--primary-blue)';
      title.style.borderBottom = 'none';
      title.style.textAlign = 'left';
      title.innerHTML = highlight(itemName);

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      // 卡片內容
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      cardBody.innerHTML = `
        <p><strong>類別：</strong>${item.class}</p>
        <p><strong>家族威望：</strong>${item.family}</p>
        <p><strong>個人名聲：</strong>${item.renown}</p>
        <p><strong>貢獻度：</strong>${item.contribute}</p>
        <p style="text-align:right; color:var(--primary-blue); font-size:12px; margin-top:10px;">點擊查看掉落地圖 ▾</p>
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);
      fragment.appendChild(card);
    });

    cardContainer.appendChild(fragment);
  }

  // 🚀 核心功能：尋找並顯示掉落地圖
  function showDropMaps(garbageName) {
    if (!mapData || mapData.length === 0) return;

    const foundMaps = mapData.filter(map => {
      const dropStr = map.drop_rubbish || "";
      const dropList = dropStr.split('、');
      return dropList.includes(garbageName);
    });

    const mapNames = foundMaps.map(m => m.mapid);
    const resultText = mapNames.length > 0 
      ? mapNames.join('、') 
      : "目前無地圖掉落資料";

    const modalContent = document.getElementById('modalContent');
    if (modalContent) {
      modalContent.innerHTML = `
        <h2 class="hero-name">${garbageName}</h2>
        <div class="hero-column-details" style="padding: 20px;">
          <p style="font-size: 18px; margin-bottom: 10px; color: var(--primary-blue);"><strong>掉落地圖：</strong></p>
          <p style="font-size: 16px; line-height: 1.6; color: var(--text-main);">${resultText}</p>
        </div>
      `;
      openModal();
    }
  }

  // === Modal 控制 ===
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const closeBtn = document.querySelector('.close-btn');

  function openModal() {
    if (modalOverlay) modalOverlay.style.display = 'block';
    if (modalBox) modalBox.style.display = 'block';
    if (modalBox) modalBox.scrollTop = 0;
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (modalBox) modalBox.style.display = 'none';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // === 清除搜尋 ===
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }
});
