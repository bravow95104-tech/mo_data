document.addEventListener("DOMContentLoaded", () => {
  let runeresetData = [];
  let searchTimer = null;

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/runereset.json')
    .then(response => response.json())
    .then(data => {
      runeresetData = data;
      renderTable(runeresetData);
    })
    .catch(error => {
      console.error('載入道具資料錯誤:', error);
      const tbody = document.querySelector('#runeresetTable tbody');
      tbody.innerHTML = '<tr><td colspan="5">無法載入道具資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖）===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 200);
  });

// === 綜合篩選 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = runeresetData.filter(runereset => {
      // 🚀 安全檢查：先確認 runereset.item 存在，再執行 toLowerCase()
      const itemName = runereset.item ? String(runereset.item).toLowerCase() : "";
      
      return itemName.includes(keyword);
    });

    renderTable(filtered);
  }

  // === 產生列表 (卡片形式) ===
  function renderTable(data) {
    const listContainer = document.getElementById('runeresetList');
    listContainer.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#777; width:100%;">找不到符合條件的文片</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(item => {  
      const card = document.createElement('div');
      card.className = 'runereset-card';

      const fields = [
        { key: 'item', label: '文片重鑄後' },
        { key: 'material1', label: '合成材料1' },
        { key: 'material2', label: '合成材料2' },
        { key: 'material3', label: '合成材料3' },
        { key: 'material4', label: '合成材料4' },
        { key: 'material5', label: '合成材料5' }
      ];

      // 高亮處理後的資料
      const highlightData = {};
      fields.forEach(f => {
        const rawValue = item[f.key] ? String(item[f.key]) : '—';
        const htmlValue = rawValue.replace(/\n/g, '<br>');

        if (keyword && rawValue.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          highlightData[f.key] = htmlValue.replace(regex, '<span class="highlight">$1</span>');
        } else {
          highlightData[f.key] = htmlValue;
        }
      });

      card.innerHTML = `
        <div class="runereset-title">${highlightData.item}</div>
        <div class="runereset-details">
          <p><strong>材料1：</strong>${highlightData.material1}</p>
          <p><strong>材料2：</strong>${highlightData.material2}</p>
          <p><strong>材料3：</strong>${highlightData.material3}</p>
          <p><strong>材料4：</strong>${highlightData.material4}</p>
          <p><strong>材料5：</strong>${highlightData.material5}</p>
        </div>
      `;

      fragment.appendChild(card);
    });

    listContainer.appendChild(fragment);
  }

  // === 清除搜尋 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    renderTable(runeresetData);
  });
});
