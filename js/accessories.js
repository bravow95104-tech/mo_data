document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null;
  let activeFilter = null; // ✅ 紀錄目前篩選條件（單一模式）

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
    .then(response => response.json())
    .then(data => {
      // ✅ 預先篩出 class = "飾品"
      heroesData = data.filter(item => item.class === "飾品");
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入飾品資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入飾品資料</td></tr>';
    });

  // === 搜尋框（防抖動 + 同時篩選）===
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      applyFilters(); // ✅ 同步篩選
    }, 200);
  });

  // === 篩選按鈕（單一選擇模式） ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 清除其他 active 樣式
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 記錄目前篩選條件
      activeFilter = { type: btn.dataset.type, value: btn.dataset.value };

      applyFilters(); // ✅ 同步搜尋 + 篩選
    });
  });

  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    activeFilter = null;
    searchInput.value = '';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    renderTable(heroesData);

    // 移除搜尋高亮
    document.querySelectorAll('.highlight, .highlight2').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  });

  // === 統一篩選函式（搜尋 + 篩選） ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // ✅ 搜尋條件
      const targetFields = [hero.item, hero.sort, hero.lv].join(' ').toLowerCase();
      const matchKeyword = keyword ? targetFields.includes(keyword) : true;

      // ✅ 篩選條件
      let matchFilter = true;
      if (activeFilter) {
        const { type, value } = activeFilter;
        if (type === "promotion") {
          matchFilter = hero.sort === value;
        }
      }

      return matchKeyword && matchFilter;
    });

    renderTable(filtered);
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的飾品</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片欄位 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/accessories/${hero.item}`;
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;

        img.src = basePath + extensions[attempt];
        img.alt = hero.item;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.style.backgroundColor = '#f9f9f9';
        img.style.borderRadius = '4px';

        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            img.src = basePath + extensions[attempt];
          } else {
            imgTd.textContent = '—';
          }
        };

        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }

      tr.appendChild(imgTd);

      // === 其他欄位 ===
      const fields = ['item', 'lv', 'Property1', 'Property2', 'Durability', 'illustrate'];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        // ✅ 搜尋結果加亮
        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        tr.appendChild(td);
      });

      // === 點擊列顯示詳細資料 ===
      tr.addEventListener('click', () => {
        showDetailModal(hero);
      });

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  }



  // === Accordion 展開／收合 ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
