document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/works.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data; // ✅ 儲存資料
      renderTable(heroesData); // ✅ 一開始顯示
    })
    .catch(error => {
      console.error('載入工作資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入工作資料</td></tr>';
    });

  // === 搜尋框 ===
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      const targetFields = [
        hero.type,
        hero.name,
        hero.area,
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
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的工作</td></tr>';
      return;
    }

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 第一格：根據 item 自動載入圖片 ===
      const imgTd = document.createElement('td');
      if (hero.name) {
        const img = document.createElement('img');
        img.src = `/mo_data/pic/works/${hero.name}.jpg`;
        img.alt = hero.name;
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
      const fields = ['type', 'lv', 'name', 'area'];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>'); // ✅ 支援換行

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        tr.appendChild(td);
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

  // === 篩選按鈕（全域單一篩選模式） ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.type;
      const value = btn.dataset.value;

      const filtered = heroesData.filter(hero => {
        if (type === "promotion") return hero.type === value;
        return true;
      });

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
