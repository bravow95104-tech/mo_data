let allCardData = [];
let mapData = [];
let lastFilteredData = []; // 存儲最後過濾出的資料
let sortConfig = { key: null, direction: 'asc' };

document.addEventListener("DOMContentLoaded", () => {
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

  // === DOM 元素快取 ===
  const tableBody = document.querySelector('#card-equip-table tbody');
  const cardContainer = document.getElementById('card-equip-container');
  const searchInput = document.getElementById('searchInput');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('#modalBox .close-btn');

  // 1. 載入資料
  Promise.all([
    fetch("/mo_data/data/card.json").then(res => res.json()),
    fetch("/mo_data/data/detailed_map.json").then(res => res.json())
  ])
  .then(([cards, maps]) => {
    const data = Array.isArray(cards) ? cards : (cards.data || []);
    allCardData = data.filter(d => d.type === "裝備卡");
    mapData = Array.isArray(maps) ? maps : (maps.data || []);
    initializeSortIcons();
    applyFiltersAndSort(); 
    updateSortIcons();
  })
  .catch(err => {
    console.error("❌ Failed to load data:", err)
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="6">無法載入資料</td></tr>';
  });

  // 2. 核心邏輯：套用篩選與排序
  function applyFiltersAndSort() {
    const keyword = searchInput.value.trim().toLowerCase();
    const activeCardProperties = Array.from(document.querySelectorAll('.filter-btn[data-type="card_property"].active')).map(btn => btn.dataset.value);
    const activeNemultipliers = Array.from(document.querySelectorAll('.filter-btn[data-type="nemultiplier"].active')).map(btn => btn.dataset.value);
    const activeNewOlds = Array.from(document.querySelectorAll('.filter-btn[data-type="new_old"].active')).map(btn => btn.dataset.value);

    let filteredData = allCardData.filter(card => {
      const matchKeyword = !keyword || [
        card.card_id,
        card.hero_name,
        card.card_property,
        card.card_lv,
        card.card_data,
        card.nemultiplier
      ].some(val => String(val || "").toLowerCase().includes(keyword));
      
      const matchCardProperty = activeCardProperties.length === 0 || (card.card_property && activeCardProperties.includes(card.card_property));
      const matchNemultiplier = activeNemultipliers.length === 0 || (card.nemultiplier && activeNemultipliers.includes(card.nemultiplier));
      const matchNewOld = activeNewOlds.length === 0 || (card.new_old && activeNewOlds.includes(card.new_old));
      return matchKeyword && matchCardProperty && matchNemultiplier && matchNewOld;
    });

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
            valA = numA;
            valB = numB;
        } else {
            valA = String(valA || "").toLowerCase();
            valB = String(valB || "").toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    lastFilteredData = filteredData;
    applyLayout();
  }

  // 3. 佈局切換
  function applyLayout() {
    const keyword = searchInput.value.trim().toLowerCase();
    if (resizeFlag) {
      renderCards(lastFilteredData, keyword);
    } else {
      renderTable(lastFilteredData, keyword);
    }
  }

  // 4. 渲染表格 (電腦版)
  function renderTable(data, keyword) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">沒有找到符合條件的裝備卡</td></tr>';
      return;
    }
    const fragment = document.createDocumentFragment();
    data.forEach(card => {
      const row = document.createElement('tr');
      const fields = ['card_id', 'card_lv', 'card_property', 'card_data', 'nemultiplier', 'hero_name'];
      fields.forEach(field => {
        const td = document.createElement('td');
        const value = card[field] || '-';
        const str = String(value);
        if (keyword && str.toLowerCase().includes(keyword)) {
          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedKeyword})`, "gi");
          td.innerHTML = str.replace(regex, "<span class='highlight2'>$1</span>");
        } else {
          td.textContent = str;
        }
        row.appendChild(td);
      });
      row.addEventListener('click', () => showDetailModal(card));
      fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
  }

  // 5. 渲染卡片 (手機版)
  function renderCards(data, keyword) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">沒有找到符合條件的裝備卡</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    data.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card-item';
      
      const highlight = (text) => {
        if (!keyword) return text;
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedKeyword})`, "gi");
        return String(text).replace(regex, "<span class='highlight2'>$1</span>");
      };

      cardDiv.innerHTML = `
        <h3>${highlight(card.card_id)}</h3>
        <p><strong>等級：</strong>${card.card_lv || '-'}</p>
        <p><strong>屬性：</strong>${highlight(card.card_property)} + ${card.card_data}</p>
        <p><strong>倍率：</strong>${highlight(card.nemultiplier || '-')}</p>
        <p><strong>專屬英雄：</strong>${highlight(card.hero_name || '-')}</p>
      `;
      cardDiv.addEventListener('click', () => showDetailModal(card));
      fragment.appendChild(cardDiv);
    });
    cardContainer.appendChild(fragment);
  }

  // 6. 事件監聽 (篩選、排序、清除)
  searchInput.addEventListener('input', applyFiltersAndSort);
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
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    sortConfig = { key: null, direction: 'asc' };
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    updateSortIcons();
    applyFiltersAndSort();
  });
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => header.parentElement.classList.toggle('collapsed'));
  });

  // 7. Modal 事件
  if (modalOverlay && modalBox && closeModalBtn) {
    modalOverlay.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
  }
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

function showDetailModal(item) {
  const overlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const contentDiv = document.getElementById('modalContent');
  if (!overlay || !modalBox || !contentDiv) return;

  const img = document.createElement('img');
  img.alt = item.card_id;
  img.className = 'hero-image';
  img.style.width = '100%';
  img.style.height = 'auto';
  img.style.maxHeight = '300px';
  img.style.objectFit = 'contain';

  const encodeFileName = (name) => encodeURIComponent(String(name || ''));
  const imageCandidates = [
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}_${encodeFileName(item.card_property)}.png`,
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}.png`,
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}_${encodeFileName(item.card_property)}.jpg`,
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}.jpg`,
  ];

  let index = 0;
  const tryLoadImage = () => {
    if (index >= imageCandidates.length) return;
    const path = imageCandidates[index];
    const testImg = new Image();
    testImg.onload = () => { img.src = path; };
    testImg.onerror = () => { index++; tryLoadImage(); };
    testImg.src = path;
  };
  tryLoadImage();

  let displayDrop = item.drop || '';
  if (!displayDrop || displayDrop === '未知') {
    const foundMaps = mapData.filter(map => (map.drop_equidcard || "").split('、').includes(item.card_id));
    displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : '未知';
  }

  contentDiv.innerHTML = `
    <h2 class="hero-name">${item.card_id}</h2>
    <div class="hero-details-container">
      <div class="hero-column left" id="modal-img-col"></div>
      <div class="hero-column right">
        <p><strong>專卡名稱：</strong>${item.card_id}</p>
        <p><strong>等級：</strong>${item.card_lv}</p>
        <p><strong>屬性：</strong>${item.card_property} + ${item.card_data}</p>
        <p><strong>倍率：</strong>${item.nemultiplier || item.multiplier || '-'}</p>
        <p><strong>專屬英雄：</strong>${item.hero_name}</p>
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">
        <p><strong>掉落地圖：</strong>${displayDrop}</p>
      </div>
    </div>
  `;
  contentDiv.querySelector('#modal-img-col').appendChild(img);

  overlay.style.display = 'block';
  modalBox.style.display = 'block';
  modalBox.scrollTop = 0;
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('modalBox').style.display = 'none';
}