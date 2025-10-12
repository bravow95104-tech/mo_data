document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
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

  // === 搜尋框 ===
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      const targetFields = [
        hero.job,
        hero.item,
        hero.sort,
        hero.lv,
      ].join(' ').toLowerCase();

      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  });

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的藥品</td></tr>';
      return;
    }

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 第一格：根據 item 自動載入圖片 ===
      const imgTd = document.createElement('td');
      if (hero.item) {
        const img = document.createElement('img');
        img.src = `/mo_data/pic/medicine/${hero.item}.jpg`;
        img.alt = hero.item;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.onerror = () => {
          imgTd.textContent = '—'; // 若圖片不存在顯示—
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

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = value.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.textContent = value;
        }

        tr.appendChild(td);
      });

      // === 點擊列顯示詳細資料 ===
      tr.addEventListener('click', () => {
        showDetailModal(hero);
      });

      tbody.appendChild(tr);
    });
  }

  // === 回到頂部按鈕 ===
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

// === 篩選按鈕 ===
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // 切換 active 樣式
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 取得目前點擊的條件
    const type = btn.dataset.type;
    const value = btn.dataset.value;

    // 篩選資料
    const filtered = heroesData.filter(hero => {
      if (type === "promotion") return hero.sort === value;
      return true; // 預設全顯示
    });

    // ✅ 關鍵：要呼叫 renderTable() 才會更新畫面
    renderTable(filtered);
  });
});


  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    renderTable(heroesData);
    searchInput.value = '';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

    // 移除搜尋高亮
    document.querySelectorAll('.highlight, .highlight2').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  });

  // === Accordion 展開／收合 ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
