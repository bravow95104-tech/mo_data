document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];
  let activeFilter = null; // 🔹記錄目前的篩選條件
  let searchTimer = null;  // ✅ 防抖用變數

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
  fetch('/mo_data/data/medicine.json')
    .then(response => {
      if (!response.ok) throw new Error('無法讀取 medicine.json');
      return response.json();
    })
    .then(data => {
      // ✅ 預先篩出 class = "藥品"
      heroesData = (data || []).filter(item => item.class === "藥品");
      applyFilters();
    })
    .catch(error => {
      console.error('載入藥品資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="9">無法載入藥品資料</td></tr>';
      if (cardContainer) cardContainer.innerHTML = `<p style="text-align:center; color:red; padding:20px;">載入失敗: ${error.message}</p>`;
    });

  // === 搜尋框（防抖動版）===
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200); // ✅ 停止輸入 0.2 秒後再篩選
    });
  }

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
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      activeFilter = null;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      applyFilters();
    });
  }

  // === 綜合篩選 ===
  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      // 🔹 搜尋條件
      const targetFields = [
        hero.job,
        hero.item,
        hero.sort,
        hero.lv,
        hero.illustrate
      ].join(' ').toLowerCase();
      const matchesKeyword = targetFields.includes(keyword);

      // 🔹 篩選條件
      const matchesFilter = !activeFilter || (
        activeFilter.type === "promotion" && hero.job === activeFilter.value
      );

      return matchesKeyword && matchesFilter;
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
      tbody.innerHTML = '<tr><td colspan="9">找不到符合條件的藥品</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // === 圖片 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.textAlign = 'center';

      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/medicine/${hero.item}`;
        const extensions = ['.png', '.jpg', '.bmp'];
        let attempt = 0;

        const tryLoad = () => {
          img.src = basePath + extensions[attempt];
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

      // === 其他欄位 ===
      const fields = [
        'item', 'lv', 'material1', 'material2', 'material3', 'material4', 'material5', 'illustrate'
      ];

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
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的藥品</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const card = document.createElement('div');
      card.className = 'card-item';
      card.style.cursor = 'pointer';
      card.onclick = () => showDetailModal(hero);

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
      cardHeader.style.borderBottom = '1px solid #eee';

      const img = document.createElement('img');
      const basePath = `/mo_data/pic/medicine/${hero.item}`;
      const extensions = ['.png', '.jpg', '.bmp'];
      let attempt = 0;
      const tryLoadImg = () => {
        img.src = basePath + extensions[attempt];
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) tryLoadImg();
          else img.style.display = 'none';
        };
      };
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.objectFit = 'contain';
      if (hero.item) tryLoadImg();

      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.fontSize = '1.1rem';
      title.style.color = '#3399ff';
      title.style.borderBottom = 'none';
      title.style.textAlign = 'left';
      title.innerHTML = highlight(hero.item || '');

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      const cardBody = document.createElement('div');
      cardBody.style.fontSize = '14px';
      cardBody.style.lineHeight = '1.6';
      cardBody.innerHTML = `
        <p><strong>等級：</strong>${highlight(hero.lv || '')}</p>
        <p><strong>說明：</strong>${highlight(hero.illustrate || '')}</p>
        <p style="text-align:right; color:#3399ff; font-size:12px; margin-top:5px;">查看所需材料 ▾</p>
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);
      fragment.appendChild(card);
    });

    cardContainer.appendChild(fragment);
  }

  // === Modal 控制 ===
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeBtn = document.querySelector('.close-btn');

  function showDetailModal(hero) {
    if (!modalContent) return;
    
    let materialsHTML = '';
    for (let i = 1; i <= 5; i++) {
      const mat = hero[`material${i}`];
      if (mat && mat.trim() !== "" && mat !== "—") {
        materialsHTML += `<p><strong>材料 ${i}：</strong>${mat}</p>`;
      }
    }

    modalContent.innerHTML = `
      <h2 class="hero-name">${hero.item}</h2>
      <div class="hero-column-details" style="padding: 20px; background:#f9f9f9; border-radius:8px;">
        <h3 style="margin-top:0; color:#3399ff; border-bottom:1px solid #ddd; padding-bottom:8px;">所需材料 (個 / 組)</h3>
        <div style="font-size: 16px; line-height: 2;">
          ${materialsHTML || '<p>無材料需求</p>'}
        </div>
      </div>
    `;
    openModal();
  }

  function openModal() {
    if (modalOverlay) modalOverlay.style.display = 'block';
    if (modalBox) modalBox.style.display = 'block';
    if (modalBox) modalBox.scrollTop = 0;
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (modalBox) modalBox.style.display = 'none';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // === Accordion 展開／收合 ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
