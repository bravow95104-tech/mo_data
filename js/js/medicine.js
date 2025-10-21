document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let activeFilter = null; // 🔹記錄目前的篩選條件

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
  searchInput.addEventListener('input', applyFilters);

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 切換 active 樣式（單選）
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 更新目前篩選條件
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

  // === 綜合篩選 ===
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

// === 圖片 ===
const imgTd = document.createElement('td');
if (hero.item) {
  const img = document.createElement('img');
  const basePath = `/mo_data/pic/medicine/${hero.item}`;
  const extensions = ['.png', '.bpm', '.jpg']; // 嘗試的副檔名順序
  let attempt = 0;

  // 設定初始 src
  img.src = basePath + extensions[attempt];
  img.alt = hero.item;
  img.style.width = '40px';
  img.style.height = '40px';
  img.style.objectFit = 'contain';

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

      // === 其他欄位（不包含 job）===
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
