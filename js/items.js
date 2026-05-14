document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];
  let searchTimer = null;

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
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      heroesData = data || [];
      applyFilters();
    })
    .catch(error => {
      console.error('載入道具資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="3">無法載入道具資料</td></tr>';
      const cardContainer = document.getElementById('hero-card-container');
      if (cardContainer) cardContainer.innerHTML = '<p style="text-align:center; color:red; padding:20px;">無法載入道具資料</p>';
    });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      const name = String(hero.items || "").toLowerCase();
      const desc = String(hero.illustrate || "").toLowerCase();
      return name.includes(keyword) || desc.includes(keyword);
    });

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    const heroesTable = document.getElementById('heroes-table');
    const cardContainer = document.getElementById('hero-card-container');

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

  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">找不到符合條件的道具</td></tr>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // 圖片
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.textAlign = 'center';
      if (hero.items) {
        const img = document.createElement('img');
        const itemName = String(hero.items).trim();
        const extensions = ['.png', '.jpg', '.bmp'];
        let attempt = 0;
        
        const tryLoad = () => {
          img.src = `/mo_data/pic/items/${encodeURIComponent(itemName)}${extensions[attempt]}`;
          img.onerror = () => {
            attempt++;
            if (attempt < extensions.length) tryLoad();
            else imgTd.textContent = '—';
          };
        };
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        tryLoad();
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // 名稱與說明
      const fields = ['items', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          td.innerHTML = value.replace(regex, '<span class="highlight">$1</span>').replace(/\n/g, '<br>');
        } else {
          td.innerHTML = value.replace(/\n/g, '<br>');
        }
        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  function renderCards(data) {
    const cardContainer = document.getElementById('hero-card-container');
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

      const cardHeader = document.createElement('div');
      cardHeader.style.display = 'flex';
      cardHeader.style.alignItems = 'center';
      cardHeader.style.gap = '10px';
      cardHeader.style.marginBottom = '10px';
      cardHeader.style.paddingBottom = '8px';
      cardHeader.style.borderBottom = '1px solid #eee'; // 新增分隔線

      const img = document.createElement('img');
      const extensions = ['.png', '.jpg', '.bmp'];
      let attempt = 0;
      const tryLoadImg = () => {
        img.src = `/mo_data/pic/items/${encodeURIComponent(itemName)}${extensions[attempt]}`;
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) tryLoadImg();
          else img.style.display = 'none';
        };
      };
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'contain';
      if (itemName) tryLoadImg();

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
      cardBody.innerHTML = `<p><strong>說明：</strong>${highlight(hero.illustrate || '')}</p>`;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);
      fragment.appendChild(card);
    });
    cardContainer.appendChild(fragment);
  }

  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }
});
