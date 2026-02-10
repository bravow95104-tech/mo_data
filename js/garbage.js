document.addEventListener("DOMContentLoaded", () => {
  let garbageData = [];
  let searchTimer = null;

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/garbage.json')
    .then(response => response.json())
    .then(data => {
      garbageData = data;
      renderTable(garbageData);
    })
    .catch(error => {
      console.error('載入道具資料錯誤:', error);
      const tbody = document.querySelector('#garbageTable tbody');
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

    const filtered = garbageData.filter(garbage => {
      const targetFields = garbage.name.toLowerCase();
      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#garbageTable tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">找不到符合條件的道具</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {  // 這裡應該是 'hero'，而不是 'garbage'
      const tr = document.createElement('tr');

      const fields = [
        'class', 'name', 'family', 'renown', 'contribute'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const rawValue = hero[field] ? String(hero[field]) : '';  // 修改這一行
        const htmlValue = rawValue.replace(/\n/g, '<br>');

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
    renderTable(garbageData);
  });
});
