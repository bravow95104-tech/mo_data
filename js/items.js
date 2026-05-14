document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];
  let searchTimer = null; // ✅ 防抖用變數

  const heroesTable = document.getElementById('heroes-table');
  const cardContainer = document.getElementById('hero-card-container');
  const searchInput = document.getElementById('searchInput');

  // === 響應式判斷 ===
  const isBelow768 = () => window.innerWidth <= 768;
  let resizeFlag = isBelow768();
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentFlag = isBelow768();
      if (currentFlag !== resizeFlag) {
        resizeFlag = currentFlag;
        applyLayout();
      }
    }, 150);
  });

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/items.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data;
      applyFilters();
    })
    .catch(error => {
      console.error('載入道具資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入道具資料</td></tr>';
    });

  // === 搜尋框（防抖動版）===
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  // === 綜合篩選（搜尋）===
  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      const targetFields = [
        hero.items,
        hero.illustrate,
      ].join(' ').toLowerCase();
      return targetFields.includes(keyword);
    });

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      renderCards(lastFilteredData);
      if (heroesTable) heroesTable.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData);
      if (heroesTable) heroesTable.style.display = 'table';
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  // === 產生表格（電腦版）===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的道具</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.items) {
        const img = document.createElement('img');
        const fileName = encodeURIComponent(String(hero.items).trim());
        const basePath = `/mo_data/pic/items/${fileName}`;
        const extensions = ['.png', '.jpg', '.bmp'];
        let attempt = 0;

        img.src = basePath + extensions[attempt];
        img.alt = hero.items;
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
      const fields = ['items', 'illustrate'];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  }

  // === 產生卡片（手機版）===
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';

    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的道具</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const itemName = String(hero.items || "").trim();
      const card = document.createElement('div');
      card.className = 'card-item';

      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      // 卡片標題區域 (含圖示)
      const cardHeader = document.createElement('div');
      cardHeader.style.display = 'flex';
      cardHeader.style.alignItems = 'center';
      cardHeader.style.gap = '10px';
      cardHeader.style.marginBottom = '10px';
      cardHeader.style.paddingBottom = '8px';

      const img = document.createElement('img');
      const fileName = encodeURIComponent(itemName);
      const basePath = `/mo_data/pic/items/${fileName}`;
      const extensions = ['.png', '.jpg', '.bmp'];
      let attempt = 0;
      img.src = basePath + extensions[attempt];
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'contain';
      img.onerror = () => {
        attempt++;
        if (attempt < extensions.length) {
          img.src = basePath + extensions[attempt];
        } else {
          img.style.display = 'none';
        }
      };

      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.fontSize = '1.1rem';
      title.style.color = '#3399ff';
      title.style.borderBottom = 'none';
      title.style.textAlign = 'left';
      title.innerHTML = highlight(itemName);

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      const cardBody = document.createElement('div');
      cardBody.style.fontSize = '14px';
      cardBody.style.lineHeight = '1.6';
      cardBody.innerHTML = `
        <p><strong>說明：</strong>${highlight(hero.illustrate || '')}</p>
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);
      fragment.appendChild(card);
    });

    cardContainer.appendChild(fragment);
  }

  // === 清除篩選 ===
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }
});
