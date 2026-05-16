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

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#runeresetTable tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">找不到符合條件的文片</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(item => {  
      const tr = document.createElement('tr');

      const fields = [
        { key: 'item', label: '文片重鑄後' },
        { key: 'material1', label: '合成材料1' },
        { key: 'material2', label: '合成材料2' },
        { key: 'material3', label: '合成材料3' },
        { key: 'material4', label: '合成材料4' },
        { key: 'material5', label: '合成材料5' }
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const rawValue = item[field.key] ? String(item[field.key]) : '—';
        const htmlValue = rawValue.replace(/\n/g, '<br>');

        td.setAttribute('data-label', field.label);

        // === 搜尋字串高亮 ===
        if (keyword && rawValue.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
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

  // === 清除搜尋 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    renderTable(runeresetData);
  });
});
