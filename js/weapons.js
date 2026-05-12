document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];
  let activeFilter = null;
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

  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('.close-btn');
  const tableContainer = document.getElementById('heroes-table');
  const cardContainer = document.getElementById('hero-card-container');

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      heroesData = data.filter(item => item.class && item.class.trim() === "武器");
      applyFilters();
    })
    .catch(error => {
      console.error('載入武器資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入武器資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { applyFilters(); }, 200);
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = { type: btn.dataset.type, value: btn.dataset.value };
      applyFilters();
    });
  });

  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      activeFilter = null;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      applyFilters();
    });
  }

  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const filtered = heroesData.filter(hero => {
      if (activeFilter) {
        const { type, value } = activeFilter;
        if (type === "promotion" || type === "personality") {
          if (hero.sort !== value) return false;
        }
        if (type === "job") {
          if (hero.job !== value) return false;
        }
      }
      if (keyword) {
        const targetFields = [hero.item, hero.sort, hero.lv, hero.job].join(' ').toLowerCase();
        if (!targetFields.includes(keyword)) return false;
      }
      return true;
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

  // === 產生表格 (電腦版) ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">找不到符合條件的武器</td></tr>';
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
        const basePath = `/mo_data/pic/weapons/${hero.item}`;
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;
        img.src = basePath + extensions[attempt];
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f8f8f8; border-radius:4px; border:1px solid #eee;';
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            img.src = basePath + extensions[attempt];
          } else {
            imgTd.textContent = '-'; // 真的沒圖片顯示 -
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

        if (field === 'illustrate') {
          const specialRegex = /\^&([\s\S]*?)&\^/g;
          value = value.replace(specialRegex, '<span class="keyword-link">$1</span>');
          td.innerHTML = value.replace(/\n/g, '<br>');
          td.querySelectorAll('.keyword-link').forEach(link => {
            link.addEventListener('click', (e) => {
              e.stopPropagation();
              showGainModal(hero, link.textContent);
            });
          });
        } else {
          if (keyword && value.toLowerCase().includes(keyword)) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            td.innerHTML = value.replace(regex, '<span class="highlight2">$1</span>').replace(/\n/g, '<br>');
          } else {
            td.innerHTML = value.replace(/\n/g, '<br>');
          }
        }
        tr.appendChild(td);
      });

      if (hero.material1 && String(hero.material1).trim() !== "") {
        tr.style.cursor = "pointer";
        tr.addEventListener('click', () => showDetailModal(hero));
      }
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === 產生卡片 (手機版) ===
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的武器</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const card = document.createElement('div');
      card.className = 'card-item';
      
      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight2">$1</span>');
      };

      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';

      const img = document.createElement('img');
      img.className = 'card-icon';
      const basePath = `/mo_data/pic/weapons/${hero.item}`;
      const extensions = ['.png', '.bmp', '.jpg'];
      let attempt = 0;
      img.src = basePath + extensions[attempt];
      img.onerror = () => {
        attempt++;
        if (attempt < extensions.length) {
          img.src = basePath + extensions[attempt];
        } else {
          // 如果真的沒圖片，隱藏 img 並在父容器顯示 -
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

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      cardBody.innerHTML = `
        <p><strong>等級：</strong>${hero.lv}</p>
        <p><strong>屬性：</strong>${hero.Property1} / ${hero.Property2}</p>
        <p><strong>說明：</strong>${hero.illustrate.replace(/\^&|&\^/g, "").substring(0, 50)}...</p>
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);

      card.addEventListener('click', () => showDetailModal(hero));
      fragment.appendChild(card);
    });
    cardContainer.appendChild(fragment);
  }

  // === Modal 邏輯 ===
  function showDetailModal(equip) {
    if (!modalContent) return;
    const materialsHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      .map(num => equip[`material${num}`] ? `<p><strong>材料 ${num}：</strong>${equip[`material${num}`]}</p>` : '')
      .join('');

    const illustrateHTML = (equip.illustrate && equip.illustrate.trim() !== "")
      ? `<div class="hero-column-base hero-column-details" style="grid-column: span 2; border-top: 1px solid #ddd; padding-top: 10px;">
           <p><h3 class="modal-sub-title">說明</h3><br>${equip.illustrate.replace(/\^&|&\^/g, "").replace(/\n/g, "<br>")}</p>
         </div>`
      : "";

    modalContent.innerHTML = `
      <h2 class="hero-name">${equip.item}</h2>
      <div class="hero-details-container">
        <div class="hero-column-base hero-column">
        <h3 class="modal-sub-title">基礎數值</h3>
          <p><strong>等級：</strong>${equip.lv}</p>
          <p><strong>攻擊：</strong>${equip.Property1}</p>
          <p><strong>命中：</strong>${equip.Property2}</p>
          <p><strong>耐用度：</strong>${equip.Durability}</p>
        </div>
        <div class="hero-column-base hero-column">
        <h3 class="modal-sub-title">製作材料</h3>
        ${materialsHTML}
        </div>
        ${illustrateHTML}
      </div>
    `;
    openModal();
  }

  function showGainModal(equip, effectName) {
    if (!modalContent) return;
    const gainContent = (equip.gain && equip.gain.trim() !== "")
      ? `<div class="hero-column-accessories-details">
           <p style="font-size: 16px; line-height: 1.8; padding-top: 10px;">
             ${equip.gain.replace(/\n/g, "<br>")}
           </p>
         </div>`
      : `<div class="hero-column-accessories-details"><p>暫無詳細效果說明。</p></div>`;

    modalContent.innerHTML = `
      <h2 class="hero-name">${effectName} 詳情</h2>
      <div class="hero-details-container" style="justify-content: center;">
        ${gainContent}
      </div>
    `;
    openModal();
  }

  function openModal() {
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    modalBox.scrollTop = 0;
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBox.style.display === "block") {
      closeModal();
    }
  });

  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});