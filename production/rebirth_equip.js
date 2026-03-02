document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let activeFilters = {}; // ✅ 關鍵：改為物件，存儲多個類別的條件
  let searchTimer = null; // ✅ 搜尋防抖用

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/rebirth_equip.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data;
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入裝備資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7">無法載入裝備資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖動版） ===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      applyFilters();
    }, 200);
  });

  // === 篩選按鈕邏輯 (支援多群組同時篩選) ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      // 1. 如果點擊的是已經選中的按鈕，則取消它 (反選)
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        delete activeFilters[type]; // 移除該類別的條件
      } else {
        // 2. 先清除「同一個 group (type)」的其他按鈕 active 狀態
        document.querySelectorAll(`.filter-btn[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
        
        // 3. 點亮目前按鈕並記錄條件
        btn.classList.add('active');
        activeFilters[type] = value;
      }

      applyFilters();
    });
  });

  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    activeFilters = {}; // ✅ 清空所有條件
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    renderTable(heroesData);
  });

  // === 同時套用多重篩選 + 搜尋關鍵字 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // ✅ A. 多重篩選邏輯 (AND 邏輯)
      // 檢查目前已選中的每一個類型 (例如 class, sort, personality)
      for (let type in activeFilters) {
        const filterValue = activeFilters[type];
        // 只要裝備的欄位值不等於篩選值，就剔除
        if (hero[type] !== filterValue) {
          return false;
        }
      }

      // ✅ B. 搜尋框邏輯
      if (keyword) {
        const targetFields = [
          hero.item,
          hero.sort,
          hero.lv,
          hero.class,
          hero.personality,
          hero.illustrate
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
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">找不到符合條件的裝備</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // --- 圖片欄 ---
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'width:50px; height:50px; text-align:center; vertical-align:middle;';

      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/rebirth_equip/${hero.item}`;
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;

        img.src = basePath + extensions[attempt];
        img.alt = hero.item;
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f8f8f8; border-radius:4px;';

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

      // --- 資料欄位 ---
      const fields = ['item', 'lv', 'Property1', 'Property2', 'Durability', 'illustrate'];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }
        tr.appendChild(td);
      });

      // 點擊行觸發詳情彈窗
      tr.addEventListener('click', () => {
        if (typeof showDetailModal === 'function') {
          showDetailModal(hero);
        }
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