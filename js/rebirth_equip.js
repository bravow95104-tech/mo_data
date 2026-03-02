document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let activeFilter = null; // ✅ 記錄目前篩選條件
  let searchTimer = null;  // ✅ 搜尋防抖用

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/rebirth_equip.json')
    .then(response => response.json())
    .then(data => {
      // ✅ 預先篩出 class = "武器"
      heroesData = data;
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入武器資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="7">無法載入裝備資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖動版） ===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      applyFilters();
    }, 200); // ✅ 等使用者停 0.2 秒再觸發搜尋
  });

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 清除所有 active 樣式
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 記錄目前條件
      activeFilter = {
        type: btn.dataset.type,
        value: btn.dataset.value
      };

      applyFilters();
    });
  });

  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    activeFilter = null;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    renderTable(heroesData);
  });

// === 同時套用搜尋 + 篩選 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // ✅ 修正後的篩選按鈕條件：自動比對 hero 物件中對應 type 的 key
      if (activeFilter) {
        const { type, value } = activeFilter;
        
        // 核心邏輯：hero["class"] 或是 hero["sort"] 或是 hero["personality"]
        // 必須等於按鈕上的 value
        if (hero[type] !== value) return false;
      }

      // ✅ 搜尋框條件 (同步擴充搜尋範圍)
      if (keyword) {
        const targetFields = [
          hero.item,
          hero.sort,
          hero.lv,
          hero.class,        // 新增類別搜尋
          hero.personality   // 新增系列搜尋
        ].join(' ').toLowerCase();
        
        if (!targetFields.includes(keyword)) return false;
      }

      return true;
    });

    renderTable(filtered);
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">找不到符合條件的裝備</td></tr>';
      return;
    }

    // ✅ 使用 DocumentFragment 減少重排，避免抖動
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片欄 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/rebirth_equip/${hero.item}`;
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;

        // 設定初始 src
        img.src = basePath + extensions[attempt];
        img.alt = hero.item;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.style.backgroundColor = '#f8f8f8';
        img.style.borderRadius = '4px';

        // 當圖片錯誤時嘗試下一個副檔名
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            img.src = basePath + extensions[attempt];
          } else {
            imgTd.textContent = '—'; // 全部失敗則顯示破圖
          }
        };

        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // === 其他欄位 ===
      const fields = [
        'item', 'lv', 'Property1', 'Property2', 'Durability',
        'illustrate'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        // ✅ 搜尋關鍵字高亮
        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        tr.appendChild(td);
      });

      tr.addEventListener('click', () => showDetailModal(hero));
      fragment.appendChild(tr);
    });

    // ✅ 一次性插入，減少畫面閃爍
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
