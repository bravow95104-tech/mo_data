let allCardData = [];
let sortConfig = { key: null, direction: 'asc' }; // 統一管理排序狀態

document.addEventListener("DOMContentLoaded", () => {
  // === DOM 元素快取 ===
  const tableBody = document.querySelector('#card-equip-table tbody');
  const searchInput = document.getElementById('searchInput');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('#modalBox .close-btn');

  // 1. 載入資料
  fetch("/mo_data/data/card.json")
    .then(res => res.json())
    .then(data => {
      allCardData = data.filter(card => card.type === "裝備卡");
      initializeSortIcons();
      applyFiltersAndSort(); // 初始渲染
      updateSortIcons();
    })
    .catch(err => {
      console.error("❌ Failed to load card data:", err)
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="6">無法載入資料</td></tr>';
    });

  // 2. 核心邏輯：套用篩選與排序
  function applyFiltersAndSort() {
    const keyword = searchInput.value.trim().toLowerCase();

    // A. 取得篩選條件
    const activeCardProperties = Array.from(document.querySelectorAll('.filter-btn[data-type="card_property"].active')).map(btn => btn.dataset.value);
    const activeNemultipliers = Array.from(document.querySelectorAll('.filter-btn[data-type="nemultiplier"].active')).map(btn => btn.dataset.value);
    const activeNewOlds = Array.from(document.querySelectorAll('.filter-btn[data-type="new_old"].active')).map(btn => btn.dataset.value);

    // B. 過濾資料
    let filteredData = allCardData.filter(card => {
      const matchKeyword = (
        (card.card_id && card.card_id.toLowerCase().includes(keyword)) ||
        (card.hero_name && card.hero_name.toLowerCase().includes(keyword))
      );
      const matchCardProperty = activeCardProperties.length === 0 || (card.card_property && activeCardProperties.includes(card.card_property));
      const matchNemultiplier = activeNemultipliers.length === 0 || (card.nemultiplier && activeNemultipliers.includes(card.nemultiplier));
      const matchNewOld = activeNewOlds.length === 0 || (card.new_old && activeNewOlds.includes(card.new_old));
      return matchKeyword && matchCardProperty && matchNemultiplier && matchNewOld;
    });

    // C. 排序資料
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // 嘗試轉為數字比較
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
    
    renderTable(filteredData);
  }

  // 3. 渲染表格
  function renderTable(data) {
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
        td.textContent = card[field] || '-';
        row.appendChild(td);
      });
      
      row.addEventListener('click', () => showDetailModal(card));
      fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
  }

  // 4. 事件監聽
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
      if (!column) return;

      if (sortConfig.key === column) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = column;
        sortConfig.direction = 'desc'; // 首次點擊預設為降序
      }
      
      updateSortIcons();
      applyFiltersAndSort();
    });
  });

  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    sortConfig = { key: null, direction: 'asc' };
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    updateSortIcons(); // 清除排序圖示
    applyFiltersAndSort();
  });

  // 5. Accordion Toggle
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });

  // 6. Modal Event Listeners
  if (modalOverlay && modalBox && closeModalBtn) {
    modalOverlay.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modalBox.style.display === 'block') {
        closeModal();
      }
    });
  }
});

// Helper function to set up the initial sort icons (Revised Version)
function initializeSortIcons() {
  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
    if (th.querySelector('.header-content')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'header-content';
    const textSpan = document.createElement('span');
    while (th.firstChild) {
      textSpan.appendChild(th.firstChild);
    }
    const iconContainer = document.createElement('span');
    iconContainer.className = 'sort-icon-container';
    iconContainer.innerHTML = `
      <span class="sort-arrow arrow-up">▲</span>
      <span class="sort-arrow arrow-down">▼</span>
    `;
    wrapper.appendChild(textSpan);
    wrapper.appendChild(iconContainer);
    th.appendChild(wrapper);
  });
}

// Helper function to update sort icons in table headers
function updateSortIcons() {
  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === sortConfig.key) {
      th.classList.add(`sorted-${sortConfig.direction}`);
    }
  });
}

// Modal Functions
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
  img.style.objectFit = 'contain';

  const encodeFileName = (name) => encodeURIComponent(String(name || ''));

  const imageCandidates = [
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}_${encodeFileName(item.card_property)}.png`,
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}.png`,
    `/mo_data-data/pic/card-equip/${encodeFileName(item.card_id)}_${encodeFileName(item.card_property)}.jpg`,
    `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}.jpg`,
  ];

  let index = 0;
  const tryLoadImage = () => {
    if (index >= imageCandidates.length) {
      console.warn('❌ 所有圖片載入失敗');
      return;
    }
    const path = imageCandidates[index];
    const testImg = new Image();
    testImg.onload = () => { img.src = path; };
    testImg.onerror = () => {
      index++;
      tryLoadImage();
    };
    testImg.src = path;
  };
  tryLoadImage();

  const html = `
    <h2 class="hero-name">${item.card_id}</h2>
    <div class="hero-details-container" style="display:flex; gap: 20px;">
      <div class="hero-column left" style="flex:1;"></div>
      <div class="hero-column right" style="flex:1;">
        <p><strong>專卡名稱：</strong>${item.card_id}</p>
        <p class="section-gap"><strong>等級：</strong>${item.card_lv}</p>
        <p><strong>屬性：</strong>${item.card_property} <strong>+</strong> ${item.card_data}</p>
        <p><strong>倍率：</strong>${item.nemultiplier || item.multiplier || '-'}</p>
        <p class="section-gap"><strong>專屬英雄：</strong>${item.hero_name}</p>
        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
        <p class="section-gap"><strong>掉落地圖：</strong>${item.drop || '未知'}</p>
      </div>
    </div>
  `;

  contentDiv.innerHTML = html;
  contentDiv.querySelector('.hero-column.left').appendChild(img);

  overlay.style.display = 'block';
  modalBox.style.display = 'block';
}

function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  if (modalOverlay && modalBox) {
    modalOverlay.style.display = 'none';
    modalBox.style.display = 'none';
  }
}