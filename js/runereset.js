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
      const targetFields = runereset.name.toLowerCase();
      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#runeresetTable tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">找不到符合條件的文片</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {  
      const tr = document.createElement('tr');

      const fields = [
        'item', 'material1', 'material2', 'material3', 'material4', 'material5'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const rawValue = hero[field] ? String(hero[field]) : '';  // 修改這一行
        const htmlValue = rawValue.replace(/\n/g, '<br>');

        // === 搜尋字串高亮 ===
        if (keyword && rawValue.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
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
