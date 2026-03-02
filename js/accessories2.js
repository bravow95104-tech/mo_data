
document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let searchTimer = null;
  let activeFilter = null;

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
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入飾品資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋與篩選邏輯 (保持不變) ===
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 200);
  });

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const filtered = heroesData.filter(hero => {
      const targetFields = [hero.item, hero.sort, hero.lv].join(' ').toLowerCase();
      const matchKeyword = keyword ? targetFields.includes(keyword) : true;
      let matchFilter = activeFilter ? (hero.sort === activeFilter.value) : true;
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
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');

      // 1. 圖片欄位
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'width:50px; height:50px; text-align:center; vertical-align:middle;';
      if (hero.item) {
        const img = document.createElement('img');
        img.src = `/mo_data/pic/accessories/${hero.item}.png`; // 簡化路徑邏輯
        img.style.cssText = 'width:40px; height:40px; object-fit:contain;';
        imgTd.appendChild(img);
      }
      tr.appendChild(imgTd);

      // 2. 資料欄位處理
      const fields = ['item', 'lv', 'Property1', 'Property2', 'Durability', 'illustrate'];
      fields.forEach(field => {
        const td = document.createElement('td');
        let value = hero[field] !== undefined ? String(hero[field]) : '';

        // ✅ 核心功能：針對說明欄位處理「增益效果」連結
        if (field === 'illustrate') {
          // 正規表示式：抓取任何以「增益」結尾的詞，例如：火龍增益
          const keywordRegex = /([^\s,，、]+增益)/g;

          if (value.match(keywordRegex)) {
            // 加上關鍵字高亮 class (keyword-link)
            value = value.replace(keywordRegex, `<span class="keyword-link">$1</span>`);
            td.innerHTML = value.replace(/\n/g, '<br>');

            // 綁定點擊事件
            td.querySelectorAll('.keyword-link').forEach(link => {
              link.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止干擾可能存在的 tr 事件
                showDetailModal(hero, link.textContent); // 傳入增益名稱
              });
            });
          } else {
            td.innerHTML = value.replace(/\n/g, '<br>');
          }
        } else {
          // 一般高亮邏輯
          if (keyword && value.toLowerCase().includes(keyword)) {
            const regex = new RegExp(`(${keyword})`, 'gi');
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

  // === Modal 詳細視窗 ===
  function showDetailModal(equip, effectName) {
    if (!modalContent) return;

    const gainHTML = (equip.gain && equip.gain.trim() !== "")
      ? `<div class="hero-column-accessories-details">
           <p style="font-size: 16px; line-height: 1.6;">${equip.gain.replace(/\n/g, "<br>")}</p>
         </div>`
      : `<div class="hero-column-accessories-details"><p>暫無增益效果詳細說明。</p></div>`;

    modalContent.innerHTML = `
      <h2 class="hero-name">${effectName} 詳情</h2>
      <div class="hero-details-container" style="max-width: 100%; justify-content: center;">
           ${gainHTML}
      </div>
    `;
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
  }

  // === 關閉與其他 UI 邏輯 ===
  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
  }
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);
});