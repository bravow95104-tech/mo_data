document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];
  let searchTimer = null;
  let activeFilters = {
    promotion: null,
    attr: null
  };

  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('.close-btn');
  const tableContainer = document.getElementById('heroes-table');
  const cardContainer = document.getElementById('hero-card-container');

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
  fetch('/mo_data/data/accessories.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      heroesData = data.filter(item => item.class && item.class.trim() === "飾品");
      applyFilters();
    })
    .catch(error => {
      console.error('載入飾品資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7">無法載入飾品資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type'); 
      const value = btn.getAttribute('data-value');

      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        activeFilters[type] = null;
      } else {
        document.querySelectorAll(`.filter-btn[data-type="${type}"]`)
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilters[type] = value;
      }
      applyFilters();
    });
  });

  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      const matchesSearch = [hero.item, hero.illustrate]
        .some(field => String(field || "").toLowerCase().includes(keyword));

      const matchesPromotion = activeFilters.promotion
        ? (hero.sort === activeFilters.promotion)
        : true;

      const matchesAttr = activeFilters.attr
        ? (hero.illustrate && String(hero.illustrate).includes(activeFilters.attr))
        : true;

      return matchesSearch && matchesPromotion && matchesAttr;
    });

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      renderCards(lastFilteredData);
      if (tableContainer) tableContainer.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData);
      if (tableContainer) tableContainer.style.display = 'table';
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      activeFilters.promotion = null;
      activeFilters.attr = null;
      filterButtons.forEach(btn => btn.classList.remove('active'));
      applyFilters();
    });
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">找不到符合條件的飾品</td></tr>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'width:50px; height:50px; text-align:center; vertical-align:middle;';
      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/accessories/${hero.item}`;
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;
        img.src = basePath + extensions[attempt];
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f9f9f9; border-radius:4px; border:1px solid #eee;';
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            img.src = basePath + extensions[attempt];
          } else {
            imgTd.textContent = '-';
          }
        };
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '-';
      }
      tr.appendChild(imgTd);

      const fields = ['item', 'lv', 'Property1', 'Property2', 'Durability', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        let value = hero[field] !== undefined ? String(hero[field]) : '';
        const highlightKey = activeFilters.attr || keyword;

        if (field === 'illustrate') {
          const specialRegex = /\^&([\s\S]*?)&\^/g;
          if (value.includes('^&') && value.includes('&^')) {
            value = value.replace(specialRegex, '<span class="keyword-link">$1</span>');
          }
          if (highlightKey) {
            const hRegex = new RegExp(`(${highlightKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            value = value.replace(hRegex, '<span class="highlight">$1</span>');
          }
          td.innerHTML = value.replace(/\n/g, '<br>');
          td.querySelectorAll('.keyword-link').forEach(link => {
            link.addEventListener('click', (e) => {
              e.stopPropagation();
              showDetailModal(hero, link.textContent);
            });
          });
        } else {
          if (highlightKey && value.toLowerCase().includes(highlightKey.toLowerCase())) {
            const regex = new RegExp(`(${highlightKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            td.innerHTML = value.replace(regex, '<span class="highlight">$1</span>').replace(/\n/g, '<br>');
          } else {
            td.innerHTML = value.replace(/\n/g, '<br>');
          }
        }
        tr.appendChild(td);
      });
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === 產生卡片 (手機版) ===
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的飾品</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const highlightKey = activeFilters.attr || keyword;
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const card = document.createElement('div');
      card.className = 'card-item';
      
      const highlight = (text) => {
        if (!highlightKey) return text;
        const regex = new RegExp(`(${highlightKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight2">$1</span>');
      };

      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';

      const img = document.createElement('img');
      img.className = 'card-icon';
      const basePath = `/mo_data/pic/accessories/${hero.item}`;
      const extensions = ['.png', '.bmp', '.jpg'];
      let attempt = 0;
      img.src = basePath + extensions[attempt];
      img.onerror = () => {
        attempt++;
        if (attempt < extensions.length) {
          img.src = basePath + extensions[attempt];
        } else {
          img.style.display = 'none';
          const noImgSpan = document.createElement('span');
          noImgSpan.textContent = '-';
          noImgSpan.style.cssText = 'width:50px; height:50px; display:flex; align-items:center; justify-content:center; background:#f8f8f8; border-radius:4px; border:1px solid #eee; font-weight:bold; color:#ccc;';
          cardHeader.insertBefore(noImgSpan, img);
        }
      };

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.innerHTML = highlight(hero.item);

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      // --- 判斷是否需要開啟彈窗的邏輯 ---
      const cleanIllustrate = hero.illustrate ? hero.illustrate.replace(/\^&|&\^/g, "") : "";
      const isLongDesc = cleanIllustrate.length > 50;
      const hasGain = hero.gain && hero.gain.trim() !== "";
      const hasLinks = hero.illustrate && hero.illustrate.includes('^&');
      const shouldBeClickable = hasGain || hasLinks || isLongDesc;

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      cardBody.innerHTML = `
        <p><strong>等級：</strong>${hero.lv}</p>
        <p><strong>屬性：</strong>${highlight(hero.Property1)}</p>
        <p><strong>說明：</strong>${highlight(cleanIllustrate.substring(0, 50))}${isLongDesc ? '...' : ''}</p>
        ${shouldBeClickable ? '<p style="text-align:right; color:#3399ff; font-size:12px; margin-top:5px;">查看完整資訊 ▾</p>' : ''}
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);

      if (shouldBeClickable) {
          card.style.cursor = 'pointer';
          card.addEventListener('click', () => {
              showDetailModal(hero, hero.item);
          });
      }

      fragment.appendChild(card);
    });
    cardContainer.appendChild(fragment);
  }

  // === Modal 顯示內容 ===
  function showDetailModal(equip, titleName) {
    if (!modalContent) return;

    // 1. 完整說明區域
    const illustrateHTML = `
      <div class="hero-column-accessories">
        <h3 class="modal-sub-title">完整說明</h3>
        <p style="font-size: 16px; line-height: 1.6;">
          ${equip.illustrate.replace(/\^&|&\^/g, "").replace(/\n/g, "<br>")}
        </p>
      </div>
    `;

    // 2. 詳細數值區域 (gain)
    const gainHTML = (equip.gain && equip.gain.trim() !== "")
      ? `<div class="hero-column-accessories-details" style="margin-top:15px;">
           <h3 class="modal-sub-title">詳細效果</h3>
           <p style="font-size: 16px; line-height: 1.8; margin: 0; padding: 5px 0;">
             ${equip.gain.replace(/\n/g, "<br>")}
           </p>
         </div>`
      : "";

    modalContent.innerHTML = `
      <h2 class="hero-name">${titleName}</h2>
      <div class="hero-details-container" style="max-width: 100%; justify-content: center; flex-direction:column;">
           ${illustrateHTML}
           ${gainHTML}
      </div>
    `;
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    setTimeout(() => {
      modalBox.scrollTop = 0;
    }, 0);
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
  }
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => header.parentElement.classList.toggle('collapsed'));
  });
});