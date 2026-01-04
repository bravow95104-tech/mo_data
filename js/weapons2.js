document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let activeFilter = null; 
  let searchTimer = null;  

  // 1. 定義隱藏規則清單
  const hideIllustrateSorts = [
    "刀類", "劍類", "拂塵", "招幡", "藥鋤", "弩弓", "弩箭", "符紙",
    "大刀", "長戟", "長鞭", "軟劍", "長棍", "禪杖", "竹簡", "葫蘆",
    "火箭筒", "大型十字弩", "大型弩箭", "火炮彈藥"
  ];
  const hideMaterialSorts = ["極限裝備", "新城寨裝備"];

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
    .then(response => response.json())
    .then(data => {
      // 預先篩出武器類別
      heroesData = data.filter(item => item.class === "武器");
      
      // 動態更新按鈕顯示狀態
      updateFilterButtons(heroesData);
      
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入武器資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入武器資料</td></tr>';
    });

  // === 動態隱藏按鈕邏輯 ===
  function updateFilterButtons(data) {
    const existingSorts = [...new Set(data.map(item => String(item.sort || "").trim()))];
    const existingJobs = [...new Set(data.map(item => String(item.job || "").trim()))];

    document.querySelectorAll('.filter-btn').forEach(btn => {
      const type = btn.dataset.type;
      const val = btn.dataset.value;
      let shouldShow = true;

      if (type === "promotion" || type === "personality") {
        shouldShow = existingSorts.includes(val);
      } else if (type === "job") {
        shouldShow = existingJobs.includes(val);
      }
      btn.style.display = shouldShow ? 'inline-block' : 'none';
    });
  }

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖動） ===
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        applyFilters();
      }, 200);
    });
  }

  // === 篩選按鈕點擊 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        activeFilter = null;
      } else {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = { type: btn.dataset.type, value: btn.dataset.value };
      }
      applyFilters();
    });
  });

  // === 清除篩選 ===
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      activeFilter = null;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      renderTable(heroesData);
    });
  }

  // === 套用篩選邏輯 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // 按鈕篩選
      if (activeFilter) {
        const { type, value } = activeFilter;
        if (type === "promotion" || type === "personality") {
          if (hero.sort !== value) return false;
        } else if (type === "job") {
          if (hero.job !== value) return false;
        }
      }
      // 關鍵字搜尋
      if (keyword) {
        const targetFields = [hero.item, hero.sort, hero.lv, hero.job].join(' ').toLowerCase();
        if (!targetFields.includes(keyword)) return false;
      }
      return true;
    });
    renderTable(filtered);
  }

  // === 產生表格核心 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;">找不到符合條件的武器</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');
      const currentSort = String(hero.sort || "").trim();

      // 1. 圖片欄
      const imgTd = document.createElement('td');
      imgTd.className = "td-img-center"; // 建議將樣式移至 CSS
      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/weapons/${hero.item}`;
        const exts = ['.png', '.bmp', '.jpg'];
        let attempt = 0;
        img.src = basePath + exts[attempt];
        img.className = "weapon-icon"; 
        img.onerror = () => {
          attempt++;
          if (attempt < exts.length) img.src = basePath + exts[attempt];
          else imgTd.textContent = '—';
        };
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // 2. 資料欄位渲染
      const fields = [
        'item', 'lv', 'Property1', 'Property2', 'Durability',
        'material1', 'material2', 'material3', 'material4', 'material5', 'illustrate'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        let shouldHide = false;

        // 規則判斷
        if (field === 'illustrate' && hideIllustrateSorts.includes(currentSort)) {
          shouldHide = true;
        }
        if (field.startsWith('material') && hideMaterialSorts.includes(currentSort)) {
          shouldHide = true;
        }

        if (shouldHide) {
          td.innerHTML = ""; 
        } else {
          const value = hero[field] !== undefined ? String(hero[field]) : '';
          const htmlValue = value.replace(/\n/g, '<br>');

          if (keyword && value.toLowerCase().includes(keyword)) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
          } else {
            td.innerHTML = htmlValue;
          }
        }
        tr.appendChild(td);
      });

      tr.addEventListener('click', () => {
        if (typeof showDetailModal === 'function') showDetailModal(hero);
      });
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === Accordion ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});