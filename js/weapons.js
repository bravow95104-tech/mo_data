import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let lastFilteredData = [];
  let activeFilters = {
    promotion: null,
    personality: null,
    job: null,
    attr: null
  };
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

  const searchInput = document.getElementById('searchInput');

  // === 從 Supabase 載入資料 ===
  async function loadData() {
    const { data, error } = await supabase
      .from('weapons')
      .select('*')
      .order('sort_id', { ascending: true });

    if (error) {
      console.error('載入武器資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入武器資料</td></tr>';
      return;
    }

    heroesData = data || [];
    handleUrlSearch(); // 載入資料後，先檢查 URL 參數
    applyFilters();    // 再執行過濾
  }

  loadData();

  // === 處理 URL 搜尋參數 ===
  function handleUrlSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchKey = urlParams.get('search');
    if (searchKey && searchInput) {
      searchInput.value = searchKey;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { applyFilters(); }, 200);
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
        // 如果是基礎職業或進階職業，清除這兩組的所有選中狀態 (因為它們共用資料欄位 sort)
        if (type === 'promotion' || type === 'personality') {
          document.querySelectorAll('.filter-btn[data-type="promotion"], .filter-btn[data-type="personality"]')
            .forEach(b => b.classList.remove('active'));
          activeFilters.promotion = null;
          activeFilters.personality = null;
        } else {
          document.querySelectorAll(`.filter-btn[data-type="${type}"]`)
            .forEach(b => b.classList.remove('active'));
        }
        
        btn.classList.add('active');
        activeFilters[type] = value;
      }
      applyFilters();
    });
  });

  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      activeFilters = {
        promotion: null,
        personality: null,
        job: null,
        attr: null
      };
      filterButtons.forEach(btn => btn.classList.remove('active'));
      applyFilters();
    });
  }

  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const filtered = heroesData.filter(item => {
      const materialFields = [
        item.material1, item.material2, item.material3, item.material4,
        item.material5, item.material6, item.material7, item.material8,
        item.material9, item.material10, item.material11
      ];

      const matchesSearch = [item.item, item.illustrate, ...materialFields]
        .some(field => String(field || "").toLowerCase().includes(keyword));

      const matchPromotion = activeFilters.promotion ? item.sort === activeFilters.promotion : true;
      const matchPersonality = activeFilters.personality ? item.sort === activeFilters.personality : true;
      const matchJob = activeFilters.job ? item.job === activeFilters.job : true;
      const matchAttr = activeFilters.attr ? (item.illustrate && String(item.illustrate).includes(activeFilters.attr)) : true;

      return matchesSearch && matchPromotion && matchPersonality && matchJob && matchAttr;
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
    const highlightKey = activeFilters.attr || keyword;
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      const tr = document.createElement('tr');
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'width:50px; height:50px; text-align:center; vertical-align:middle;';
      
      if (item.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/weapons/${item.item}`;
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;
        img.src = basePath + extensions[attempt];
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f8f8f8; border-radius:4px; border:1px solid #eee;';
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

      const fields = ['item', 'lv', 'property1', 'property2', 'durability', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        if (field === 'item') td.classList.add('table-title-cell');
        let value = (item[field] !== null && item[field] !== undefined) ? String(item[field]) : '-';

        if (field === 'illustrate') {
          if (value === '-') {
            td.textContent = '-';
          } else {
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
                showGainModal(item, link.textContent);
              });
            });
          }
        } else {
          if (value !== '-' && highlightKey && value.toLowerCase().includes(highlightKey.toLowerCase())) {
            const regex = new RegExp(`(${highlightKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            td.innerHTML = value.replace(regex, '<span class="highlight2">$1</span>').replace(/\n/g, '<br>');
          } else {
            td.innerHTML = value.replace(/\n/g, '<br>');
          }
        }
        tr.appendChild(td);
      });

      if (item.material1 && String(item.material1).trim() !== "" && item.material1 !== null) {
        tr.style.cursor = "pointer";
        tr.addEventListener('click', () => showDetailModal(item));
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
    const highlightKey = activeFilters.attr || keyword;
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card-item';

      const highlight = (text) => {
        if (!highlightKey || text === '-') return text;
        const regex = new RegExp(`(${highlightKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight2">$1</span>');
      };

      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';

      const img = document.createElement('img');
      img.className = 'card-icon';
      const basePath = `/mo_data/pic/weapons/${item.item}`;
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
      title.innerHTML = highlight(item.item || '-');

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      const rawIllustrate = item.illustrate ? item.illustrate.replace(/\^&|&\^/g, "").substring(0, 50) : "-";
      const safeIllustrate = highlight(rawIllustrate);
      
      cardBody.innerHTML = `
        <p><strong>等級：</strong>${item.lv || '-'}</p>
        <p><strong>攻擊：</strong>${item.property1 || '-'}</p>
        <p><strong>命中：</strong>${item.property2 || '-'}</p>
        <p><strong>耐用度：</strong>${item.durability || '-'}</p>
        <p><strong>說明：</strong>${safeIllustrate}${rawIllustrate !== '-' ? '...' : ''}</p>
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);

      card.addEventListener('click', () => showDetailModal(item));
      fragment.appendChild(card);
    });
    cardContainer.appendChild(fragment);
  }

  // === Modal 邏輯 ===
  function showDetailModal(equip) {
    if (!modalContent) return;
    const materialsHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      .map(num => (equip[`material${num}`] && equip[`material${num}`] !== null) ? `<p><strong>材料 ${num}：</strong>${equip[`material${num}`]}</p>` : '')
      .join('');

    const illustrateHTML = (equip.illustrate && equip.illustrate.trim() !== "" && equip.illustrate !== null)
      ? `<div class="hero-column-base hero-column-details" style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
           <h3 class="modal-sub-title">說明</h3>
           <p style="font-size: 16px; line-height: 1.6;">${equip.illustrate.replace(/\^&|&\^/g, "").replace(/\n/g, "<br>")}</p>
         </div>`
      : "";

    const gainHTML = (equip.gain && equip.gain.trim() !== "" && equip.gain !== null)
      ? `<div class="hero-column-base hero-column-details" style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
           <h3 class="modal-sub-title">詳細效果</h3>
           <p style="font-size: 16px; line-height: 1.8;">${equip.gain.replace(/\n/g, "<br>")}</p>
         </div>`
      : "";

    modalContent.innerHTML = `
      <h2 class="hero-name">${equip.item || '-'}</h2>
      <div class="hero-details-container">
        <div class="hero-column-base hero-column">
        <h3 class="modal-sub-title">基礎數值</h3>
          <p><strong>等級：</strong>${equip.lv || '-'}</p>
          <p><strong>攻擊：</strong>${equip.property1 || '-'}</p>
          <p><strong>命中：</strong>${equip.property2 || '-'}</p>
          <p><strong>耐用度：</strong>${equip.durability || '-'}</p>
        </div>
        <div class="hero-column-base hero-column">
        <h3 class="modal-sub-title">製作材料</h3>
        ${materialsHTML}
        </div>
        ${illustrateHTML}
        ${gainHTML}
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
    if (e.key === "Escape") closeModal();
  });

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