document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null; // ✅ 防抖動用變數
  let activeFilter = null; // ✅ 記錄目前的篩選條件

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/works.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data; // ✅ 儲存資料
      renderTable(heroesData); // ✅ 初次載入顯示
    })
    .catch(error => {
      console.error('載入工作資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入工作資料</td></tr>';
    });

  // === 搜尋框（防抖動）===
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 200); // ✅ 200ms防抖
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

    // ✅ 移除搜尋高亮
    document.querySelectorAll('.highlight, .highlight2').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  });

  // === 綜合篩選（搜尋 + 篩選）===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // 🔹 搜尋條件
      const targetFields = [
        hero.type,
        hero.name,
        hero.area,
        hero.lv,
      ].join(' ').toLowerCase();
      const matchesKeyword = targetFields.includes(keyword);

      // 🔹 篩選條件
      const matchesFilter = !activeFilter || (
        activeFilter.type === "promotion" && hero.type === activeFilter.value
      );

      return matchesKeyword && matchesFilter;
    });

    renderTable(filtered);
  }

  // === 產生表格（防閃爍 + 固定寬高）===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的工作</td></tr>';
      return;
    }

    // ✅ 使用 DocumentFragment 避免多次重繪
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.name) {
        const safeName = hero.name.replace(/[\\\/:*?"<>|]/g, '');
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;

        const img = document.createElement('img');
        img.alt = hero.name;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.style.borderRadius = '4px';
        img.style.backgroundColor = '#f9f9f9';

        // 嘗試載入圖片
        function tryLoad() {
          img.src = `/mo_data/pic/works/${safeName}${extensions[attempt]}`;
          img.onerror = () => {
            attempt++;
            if (attempt < extensions.length) {
              tryLoad();
            } else {
              imgTd.textContent = '—';
            }
          };
        }

        tryLoad();
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }

      tr.appendChild(imgTd);

      // === 其他欄位 ===
      const fields = ['type', 'lv', 'name', 'area'];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    // ✅ 一次性插入，減少 reflow
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
