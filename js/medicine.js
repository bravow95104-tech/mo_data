document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let activeFilter = null; // 🔹記錄目前的篩選條件
  let searchTimer = null;  // ✅ 防抖用變數

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/medicine.json')
    .then(response => response.json())
    .then(data => {
      // ✅ 預先篩出 class = "藥品"
      heroesData = data.filter(item => item.class === "藥品");
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入藥品資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入藥品資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖動版）===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 200); // ✅ 停止輸入 0.2 秒後再篩選
  });

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.type;
      const value = btn.dataset.value;
      activeFilter = { type, value };

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

  // === 綜合篩選（搜尋 + 篩選）===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // 🔹 搜尋條件
      const targetFields = [
        hero.job,
        hero.item,
        hero.sort,
        hero.lv,
      ].join(' ').toLowerCase();
      const matchesKeyword = targetFields.includes(keyword);

      // 🔹 篩選條件
      const matchesFilter = !activeFilter || (
        activeFilter.type === "promotion" && hero.job === activeFilter.value
      );

      return matchesKeyword && matchesFilter;
    });

    renderTable(filtered);
  }

  // === 產生表格（防閃爍版）===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的藥品</td></tr>';
      return;
    }

    // ✅ 使用 DocumentFragment 減少畫面重繪
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/medicine/${hero.item}`;
        const extensions = ['.png', '.jpg', '.bmp'];
        let attempt = 0;

        img.src = basePath + extensions[attempt];
        img.alt = hero.item;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.style.borderRadius = '4px';
        img.style.backgroundColor = '#f9f9f9';

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
      const fields = [
        'item', 'lv',
        'material1', 'material2', 'material3', 'material4', 'material5', 'illustrate'
      ];

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

      // === 點擊列顯示詳細資料 ===
      tr.addEventListener('click', () => showDetailModal(hero));

      fragment.appendChild(tr);
    });

    // ✅ 一次性插入所有列
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
