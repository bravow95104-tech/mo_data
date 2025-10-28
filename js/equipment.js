document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null; // ✅ 防抖用變數

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
    .then(response => response.json())
    .then(data => {
      // ✅ 預先篩出 class = "防具"
      heroesData = data.filter(item => item.class === "防具");
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入防具資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入防具資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖動版）===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const keyword = searchInput.value.trim().toLowerCase();

      const filtered = heroesData.filter(hero => {
        const targetFields = [
          hero.item,
          hero.sort,
          hero.lv,
        ].join(' ').toLowerCase();

        return targetFields.includes(keyword);
      });

      renderTable(filtered);
    }, 200); // ✅ 等使用者停止輸入 0.2 秒再搜尋
  });

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的防具</td></tr>';
      return;
    }

    // ✅ 使用 DocumentFragment 減少重排，防止閃爍
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 第一格：圖片 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/equipment/${hero.item}`;
        const extensions = ['.png', '.jpg', '.bmp'];
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
      const fields = [
        'item', 'lv', 'Property1', 'Property2', 'Durability',
        'material1', 'material2', 'material3', 'material4', 'material5', 'illustrate'
      ];

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

    // ✅ 一次性插入，減少畫面閃爍
    tbody.appendChild(fragment);
  }

  // === 回到頂部按鈕 ===
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // === 篩選按鈕（單一篩選模式） ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.type;
      const value = btn.dataset.value;

      const filtered = heroesData.filter(hero => {
        if (type === "promotion") return hero.sort === value;
        if (type === "personality") return hero.sort === value;
        if (type === "job") return hero.job === value;
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
