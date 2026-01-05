let allCardData = [];
let currentSortColumn = '';
let sortDirection = {}; // Store sort direction for each column

document.addEventListener("DOMContentLoaded", () => {
  // 1. Load Data
  fetch("/mo_data/data/card.json")
    .then(res => res.json())
    .then(data => {
      // Filter for "裝備卡" type only
      allCardData = data.filter(card => card.type === "裝備卡");
      renderTable(allCardData); // Initial render
      initializeSortIcons(); // Create stacked arrows
      updateSortIcons(); // Initialize sort icons
    })
    .catch(err => console.error("❌ Failed to load card data:", err));

  // 2. Search Input Listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // 3. Filter Button Listeners
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      applyFilters();
    });
  });

  // 4. Clear Filters Button
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Reset sorting state
      currentSortColumn = '';
      sortDirection = {};
      
      applyFilters(); // Re-render with reset filters and sorting
      updateSortIcons(); // Remove sort icons from headers
    });
  }

  // 5. Accordion Toggle
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });

  // 6. Table Header Listeners for Sorting
  document.querySelectorAll('#card-equip-table th').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort; // Assuming data-sort attribute on th
      if (column) {
        sortData(column);
      }
    });
  });

  // 7. Back to Top Button
  const backToTopButton = document.getElementById('backToTop');
  if (backToTopButton) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        backToTopButton.style.display = 'block';
      } else {
        backToTopButton.style.display = 'none';
      }
    });

    backToTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 8. Modal Event Listeners
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const closeBtn = document.querySelector('#modalBox .close-btn');

  if (modalOverlay && modalBox && closeBtn) {
    modalOverlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modalBox.style.display === 'block') {
        closeModal();
      }
    });
  }
});

// Apply Filters and Search
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const activeCardProperties = Array.from(document.querySelectorAll('.filter-btn[data-type="card_property"].active'))
                                .map(btn => btn.dataset.value);
  const activeNemultipliers = Array.from(document.querySelectorAll('.filter-btn[data-type="nemultiplier"].active'))
                               .map(btn => btn.dataset.value);
  const activeNewOlds = Array.from(document.querySelectorAll('.filter-btn[data-type="new_old"].active'))
                             .map(btn => btn.dataset.value);

  let filteredData = allCardData.filter(card => {
    const matchKeyword = (
      (card.card_id && card.card_id.toLowerCase().includes(keyword)) ||
      (card.hero_name && card.hero_name.toLowerCase().includes(keyword))
    );

    const matchCardProperty = activeCardProperties.length === 0 || 
                              (card.card_property && activeCardProperties.includes(card.card_property));
    const matchNemultiplier = activeNemultipliers.length === 0 || 
                              (card.nemultiplier && activeNemultipliers.includes(card.nemultiplier));
    const matchNewOld = activeNewOlds.length === 0 || 
                        (card.new_old && activeNewOlds.includes(card.new_old));

    return matchKeyword && matchCardProperty && matchNemultiplier && matchNewOld;
  });

  // Re-sort if a column was previously sorted
  if (currentSortColumn) {
    filteredData = sortArray(filteredData, currentSortColumn, sortDirection[currentSortColumn]);
  }

  renderTable(filteredData);
}

// Render Table
function renderTable(data) {
  const tbody = document.querySelector('#card-equip-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">沒有找到符合條件的裝備卡</td></tr>';
    return;
  }

  data.forEach(card => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${card.card_id || '-'}</td>
      <td>${card.card_lv || '-'}</td>
      <td>${card.card_property || '-'}</td>
      <td>${card.card_data || '-'}</td>
      <td>${card.nemultiplier || '-'}</td>
      <td>${card.hero_name || '-'}</td>
    `;
    row.addEventListener('click', () => showDetailModal(card));
    tbody.appendChild(row);
  });
}

// Sort Data
function sortData(column) {
  // Initialize sortDirection for the column if not set
  if (!sortDirection[column]) {
    sortDirection[column] = 'desc'; // Default to descending on first click
  } else if (sortDirection[column] === 'desc') {
    sortDirection[column] = 'asc';
  } else {
    sortDirection[column] = 'desc'; // Cycle back to 'desc'
  }

  currentSortColumn = column; // Keep track of the last sorted column

  // Apply sorting to the currently filtered data
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const activeCardProperties = Array.from(document.querySelectorAll('.filter-btn[data-type="card_property"].active'))
                                .map(btn => btn.dataset.value);
  const activeNemultipliers = Array.from(document.querySelectorAll('.filter-btn[data-type="nemultiplier"].active'))
                               .map(btn => btn.dataset.value);
  const activeNewOlds = Array.from(document.querySelectorAll('.filter-btn[data-type="new_old"].active'))
                             .map(btn => btn.dataset.value);

  let dataToSort = allCardData.filter(card => {
    const matchKeyword = (
      (card.card_id && card.card_id.toLowerCase().includes(keyword)) ||
      (card.hero_name && card.hero_name.toLowerCase().includes(keyword))
    );

    const matchCardProperty = activeCardProperties.length === 0 || 
                              (card.card_property && activeCardProperties.includes(card.card_property));
    const matchNemultiplier = activeNemultipliers.length === 0 || 
                              (card.nemultiplier && activeNemultipliers.includes(card.nemultiplier));
    const matchNewOld = activeNewOlds.length === 0 || 
                        (card.new_old && activeNewOlds.includes(card.new_old));

    return matchKeyword && matchCardProperty && matchNemultiplier && matchNewOld;
  });

  dataToSort = sortArray(dataToSort, column, sortDirection[column]);
  renderTable(dataToSort);
  updateSortIcons();
}

// Helper function to sort an array of objects
function sortArray(array, column, direction) {
  return array.sort((a, b) => {
    const valA = a[column];
    const valB = b[column];

    // Handle numbers if applicable
    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }
    // Handle string comparison (case-insensitive)
    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    // Fallback for other types or mixed types (treat as strings)
    const strA = String(valA);
    const strB = String(valB);
    return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
}

// Helper function to set up the initial sort icons
function initializeSortIcons() {
  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
    const container = document.createElement('span');
    container.className = 'sort-icon-container';
    container.innerHTML = `
      <span class="sort-arrow arrow-up">▲</span>
      <span class="sort-arrow arrow-down">▼</span>
    `;
    th.appendChild(container);
  });
}

// Helper function to update sort icons in table headers
function updateSortIcons() {
  document.querySelectorAll('#card-equip-table th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    const column = th.dataset.sort;
    if (column === currentSortColumn) {
      th.classList.add(`sorted-${sortDirection[column]}`);
    }
  });
}

// Modal Functions
// === Modal 顯示 ===
  function showDetailModal(item) {
    const overlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const contentDiv = document.getElementById('modalContent');

    // 建立 img 元素
    const img = document.createElement('img');
    img.alt = item.card_id;
    img.className = 'hero-image';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';

    // ✅ 補回：編碼檔名 helper (建議使用 encodeURIComponent 處理特殊字元)
    const encodeFileName = (name) => encodeURIComponent(name);

    // 候選圖片路徑
    const imageCandidates = [
      `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}_${encodeFileName(item.card_property)}.png`,
      `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}.png`,
      `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}_${encodeFileName(item.card_property)}.jpg`,
      `/mo_data/pic/card-equip/${encodeFileName(item.card_id)}.jpg`,
    ];

    let index = 0;

    const tryLoadImage = () => {
      if (index >= imageCandidates.length) {
        console.warn('❌ 所有圖片載入失敗，顯示預設圖');
        return;
      }

      const path = imageCandidates[index];
      const testImg = new Image();
      testImg.onload = () => {
        img.src = path;
      };
      testImg.onerror = () => {
        index++;
        tryLoadImage();
      };
      testImg.src = path;
    };

    tryLoadImage();

    // 組裝 Modal 內容
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
