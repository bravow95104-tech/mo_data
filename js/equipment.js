document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null;
  let activeFilter = null;

  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('.close-btn');

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/weapons.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data.filter(item => item.class === "防具");
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入防具資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入防具資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋與篩選事件 ===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { applyFilters(); }, 200);
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = { type: btn.dataset.type, value: btn.dataset.value };
      applyFilters();
    });
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    activeFilter = null;
    searchInput.value = '';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    renderTable(heroesData);
  });

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const filtered = heroesData.filter(hero => {
      const targetFields = [hero.item, hero.sort, hero.lv].join(' ').toLowerCase();
      const matchKeyword = keyword ? targetFields.includes(keyword) : true;
      let matchFilter = true;
      if (activeFilter) {
        const { type, value } = activeFilter;
        if (type === "promotion" || type === "personality") {
          matchFilter = hero.sort === value;
        } else if (type === "job") {
          matchFilter = hero.job === value;
        }
      }
      return matchKeyword && matchFilter;
    });
    renderTable(filtered);
  }

  // === 產生卡片 (手機版) ===
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的防具</p>';
      return;
    }

    const keyword = searchInput.value.trim().toLowerCase();
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const card = document.createElement('div');
      card.className = 'card-item';
      
      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight2">$1</span>');
      };

      card.innerHTML = `
        <div class="card-header">
          <img class="card-icon" src="/mo_data/pic/equipment/${hero.item}.png" onerror="this.src='/mo_data/pic/equipment/${hero.item}.bmp'; this.onerror=null;">
          <h3 class="card-title">${highlight(hero.item)}</h3>
        </div>
        <div class="card-body">
          <p><strong>等級：</strong>${hero.lv}</p>
          <p><strong>屬性：</strong>${hero.Property1} / ${hero.Property2}</p>
          <p><strong>說明：</strong>${hero.illustrate.replace(/\^&|&\^/g, "").substring(0, 50)}...</p>
        </div>
      `;

      card.addEventListener('click', () => showDetailModal(hero));
      fragment.appendChild(card);
    });
    cardContainer.appendChild(fragment);
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    // 1. 先清空原本的內容
    tbody.innerHTML = '';
    // 2. ✅ 新增：判斷如果篩選後沒有資料，顯示提示文字 (保持風格一致)
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">找不到符合條件的防具</td></tr>';
      return;
    }

    // 3. 原本的渲染邏輯 (使用 fragment)
    const keyword = searchInput.value.trim().toLowerCase();
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // --- 圖片欄 ---
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'width:50px; height:50px; text-align:center; vertical-align:middle;';
      if (hero.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/equipment/${hero.item}`;
        const extensions = ['.png', '.jpg', '.bmp'];
        let attempt = 0;
        img.src = basePath + extensions[attempt];
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f9f9f9; border-radius:4px; border:1px solid #eee;';
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) img.src = basePath + extensions[attempt];
          else imgTd.textContent = '—';
        };
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // --- 資料欄位 ---
      const fields = ['item', 'lv', 'Property1', 'Property2', 'Durability', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        let value = hero[field] !== undefined ? String(hero[field]) : '';

        if (field === 'illustrate') {
          const specialRegex = /\^&([\s\S]*?)&\^/g;
          if (value.includes('^&') && value.includes('&^')) {
            value = value.replace(specialRegex, '<span class="keyword-link">$1</span>');
            td.innerHTML = value.replace(/\n/g, '<br>');
            td.querySelectorAll('.keyword-link').forEach(link => {
              link.addEventListener('click', (e) => {
                e.stopPropagation();
                showGainModal(hero, link.textContent);
              });
            });
          } else {
            td.innerHTML = value.replace(/\n/g, '<br>');
          }
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

      const hasMaterial = hero.material1 && String(hero.material1).trim() !== "";
      if (hasMaterial) {
        tr.style.cursor = "pointer";
        tr.addEventListener('click', () => showDetailModal(hero));
      }
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === Modal 1: 製作材料 ===
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
          <p><strong>防禦：</strong>${equip.Property1}</p>
          <p><strong>閃避：</strong>${equip.Property2}</p>
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

  // === Modal 2: 增益效果 ===
  function showGainModal(equip, effectName) {
    if (!modalContent) return;
    const gainContent = (equip.gain && equip.gain.trim() !== "")
      ? `<div class="hero-column-accessories-details">
           <p style="font-size: 16px; line-height: 1.8; padding-top: 10px;">
             ${equip.gain.replace(/\n/g, "<br>")}
           </p>
         </div>`
      : `<div class="hero-column-accessories-details"><p>暫無詳細增益數值。</p></div>`;

    modalContent.innerHTML = `
      <h2 class="hero-name">${effectName} 詳情</h2>
      <div class="hero-details-container" style="justify-content: center;">
        ${gainContent}
      </div>
    `;
    openModal();
  }

  // === Modal 顯示控制 ===
  function openModal() {
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

  // --- 事件監聽器 (統一放置) ---

  // 1. 關閉按鈕與遮罩
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  // 2. 按下 ESC 鍵關閉
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBox.style.display === "block") {
      closeModal();
    }
  });

  // 3. Accordion 邏輯
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.parentElement.classList.toggle("collapsed");
    });
  });

});