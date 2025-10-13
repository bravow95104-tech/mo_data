document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let activeFilter = null; // ✅ 記錄目前篩選條件

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
    .then(response => response.json())
    .then(data => {
      // ✅ 預先篩出 class = "武器"
      heroesData = data.filter(item => item.class === "武器");
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入武器資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入武器資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框 ===
  searchInput.addEventListener('input', () => {
    applyFilters();
  });

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 切換 active 樣式
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

    let filtered = heroesData.filter(hero => {
      // ✅ 篩選按鈕條件
      if (activeFilter) {
        if (activeFilter.type === "promotion" || activeFilter.type === "personality" || activeFilter.type === "job") {
          if (hero.sort !== activeFilter.value) return false;
        }
      }

      // ✅ 搜尋框條件
      if (keyword) {
        const targetFields = [
          hero.item,
          hero.sort,
          hero.lv
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
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的武器</td></tr>';
      return;
    }

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片 ===
      const imgTd = document.createElement('td');
      if (hero.item) {
        const img = document.createElement('img');
        img.src = `/mo_data/pic/weapons/${hero.item}.jpg`;
        img.alt = hero.item;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.onerror = () => (imgTd.textContent = '—');
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // === 其他欄位 ===
      const fields = [
        'item', 'lv', 'Property1', 'Property2', 'Durability',
        'material1', 'material2', 'material3', 'material4', 'material5', 'illustrate'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = value.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        tr.appendChild(td);
      });

      tr.addEventListener('click', () => showDetailModal(hero));
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

  // === Accordion 展開／收合 ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
