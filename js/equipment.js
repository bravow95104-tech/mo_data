document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null;
  let activeFilter = null; 

  // === ✅ 取得 Modal 相關元素 (確保在 DOMContentLoaded 內抓取) ===
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('.close-btn');

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
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入防具資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框 ===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      applyFilters();
    }, 200);
  });

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = { type: btn.dataset.type, value: btn.dataset.value };
      applyFilters();
    });
  });

  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    activeFilter = null;
    searchInput.value = '';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    renderTable(heroesData);
  });

  // === 統一篩選函式 ===
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

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的防具</td></tr>';
      return;
    }

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
        img.alt = hero.item;
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f9f9f9; border-radius:4px;';
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) { img.src = basePath + extensions[attempt]; } 
          else { imgTd.textContent = '—'; }
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
        const value = hero[field] !== undefined ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }
        tr.appendChild(td);
      });

      // ✅ 整合：檢查 material1 是否有值，才允許開啟 Modal
      const hasMaterial = hero.material1 && String(hero.material1).trim() !== "";
      if (hasMaterial) {
        tr.style.cursor = "pointer";
        tr.addEventListener('click', () => showDetailModal(hero));
      } else {
        tr.style.cursor = "default";
      }

      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === Modal 詳細視窗 ===
  function showDetailModal(equip) {
    if (!modalContent) return;

    // 1. 生成材料 HTML
    const materialsHTML = [1,2,3,4,5,6,7,8,9,10,11]
      .map(num => equip[`material${num}`] ? `<p><strong>材料 ${num}：</strong>${equip[`material${num}`]}</p>` : '')
      .join('');

    // 2. ✅ 整合：如果「說明」沒資料就不顯示該區塊
    const illustrateHTML = (equip.illustrate && equip.illustrate.trim() !== "") 
      ? `<div class="hero-column-base hero-column-details" style="grid-column: span 2; border-top: 1px solid #ddd; padding-top: 10px;">
           <p><strong>說明：</strong><br>${equip.illustrate.replace(/\n/g, "<br>")}</p>
         </div>`
      : "";

    modalContent.innerHTML = `
      <h2 class="hero-name">${equip.item}</h2>
      <div class="hero-details-container">
        <div class="hero-column-base hero-column">
          <p><strong>等級：</strong>${equip.lv}</p>
          <p><strong>防禦：</strong>${equip.Property1}</p>
          <p><strong>閃避：</strong>${equip.Property2}</p>
          <p><strong>耐用度：</strong>${equip.Durability}</p>
        </div>
        <div class="hero-column-base hero-column">
           ${materialsHTML}
        </div>
        ${illustrateHTML}
      </div>
    `;
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
  }

  // === 關閉視窗邏輯 ===
  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = "none";
    if (modalBox) modalBox.style.display = "none";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  // === Accordion (若手機版有使用到) ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});