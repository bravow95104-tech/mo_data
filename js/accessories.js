document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null;
  let activeFilters = {
    promotion: null,
    attr: null
  };

  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('.close-btn');

  // === 載入 JSON 資料 ===
  fetch('/mo_data/data/accessories.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data.filter(item => item.class === "飾品");
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入飾品資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7">無法載入飾品資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框事件 ===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 200);
  });

  // === 篩選按鈕點擊事件 ===
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type'); // promotion 或 attr
      const value = btn.getAttribute('data-value');

      // 如果點擊已啟動的按鈕，就取消它
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        activeFilters[type] = null;
      } else {
        // 同一組 (type) 的按鈕先清除 active，達成單選效果
        document.querySelectorAll(`.filter-btn[data-type="${type}"]`)
          .forEach(b => b.classList.remove('active'));

        btn.classList.add('active');
        activeFilters[type] = value;
      }

      applyFilters(); // 執行篩選
    });
  });

  // === 綜合篩選核心邏輯 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      // 1. 搜尋框篩選 (名稱 + 說明)
      const matchesSearch = [hero.item, hero.illustrate]
        .some(field => String(field || "").toLowerCase().includes(keyword));

      // 2. 種類篩選 (對應 JSON 的 promotion 欄位，採完全比對)
      const matchesPromotion = activeFilters.promotion
        ? (hero.sort === activeFilters.promotion)
        : true;

      // 3. 屬性篩選 (對應 JSON 的 illustrate 說明文字，採部分字詞包含比對)
      // 這樣就算說明欄寫著 "體質+10、力量+5"，點擊 "體質" 也能過濾出來
      const matchesAttr = activeFilters.attr
        ? (hero.illustrate && hero.illustrate.includes(activeFilters.attr))
        : true;

      return matchesSearch && matchesPromotion && matchesAttr;
    });

    renderTable(filtered);
  }

  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    activeFilters.promotion = null;
    activeFilters.attr = null;
    filterButtons.forEach(btn => btn.classList.remove('active'));
    renderTable(heroesData);
  });


  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    // 1. 先清空原本的內容
    tbody.innerHTML = '';
    // 2. ✅ 新增：判斷如果篩選後沒有資料，顯示提示文字
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">找不到符合條件的飾品</td></tr>';
      return;
    }

    // 3. 原本的渲染邏輯 (使用 fragment)
    const keyword = searchInput.value.trim().toLowerCase();
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // --- 圖片欄位 ---
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
          if (attempt < extensions.length) img.src = basePath + extensions[attempt];
          else imgTd.textContent = '—';
        };
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // --- 其他欄位 ---
      const fields = ['item', 'lv', 'Property1', 'Property2', 'Durability', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        let value = hero[field] !== undefined ? String(hero[field]) : '';

        // 🔹 統一取得高亮關鍵字
        const highlightKey = activeFilters.attr || keyword;

        if (field === 'illustrate') {
          const specialRegex = /\^&([\s\S]*?)&\^/g;

          // 1. 先處理特殊連結符號
          if (value.includes('^&') && value.includes('&^')) {
            value = value.replace(specialRegex, '<span class="keyword-link">$1</span>');
          }

          // 2. ✅ 無論有沒有連結，都要處理「屬性按鈕/搜尋」的高亮
          if (highlightKey) {
            const hRegex = new RegExp(`(${highlightKey})`, 'gi');
            // 注意：為了不破壞剛剛產生的 keyword-link 標籤，我們只對文字部分高亮
            value = value.replace(hRegex, '<span class="highlight">$1</span>');
          }

          td.innerHTML = value.replace(/\n/g, '<br>');

          // 3. 綁定點擊事件
          td.querySelectorAll('.keyword-link').forEach(link => {
            link.addEventListener('click', (e) => {
              e.stopPropagation();
              showDetailModal(hero, link.textContent);
            });
          });

        } else {
          // 一般欄位的高亮
          if (highlightKey && value.toLowerCase().includes(highlightKey.toLowerCase())) {
            const regex = new RegExp(`(${highlightKey})`, 'gi');
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

  // === Modal 顯示 gain 內容 ===
  function showDetailModal(equip, effectName) {
    if (!modalContent) return;

    // ✅ 移除原本標籤內的 <br>，確保第一行文字不會下移
    const gainHTML = (equip.gain && equip.gain.trim() !== "")
      ? `<div class="hero-column-accessories-details">
           <p style="font-size: 16px; line-height: 1.8; margin: 0; padding: 5px 0;">
             ${equip.gain.replace(/\n/g, "<br>")}
           </p>
         </div>`
      : `<div class="hero-column-accessories-details"><p style="margin:0;">目前無詳細效果說明</p></div>`;

    modalContent.innerHTML = `
      <h2 class="hero-name">${effectName} 詳情</h2>
      <div class="hero-details-container" style="max-width: 100%; justify-content: center;">
           ${gainHTML}
      </div>
    `;
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
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