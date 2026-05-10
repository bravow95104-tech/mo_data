document.addEventListener("DOMContentLoaded", () => {
  let garbageData = [];
  let mapData = []; // 新增：儲存地圖資料
  let searchTimer = null;

  // === 載入資料 ===
  Promise.all([
    fetch('/mo_data/data/garbage.json').then(res => res.json()),
    fetch('/mo_data/data/detailed_map.json').then(res => res.json())
  ])
  .then(([garbage, maps]) => {
    garbageData = garbage;
    mapData = maps;
    renderTable(garbageData);
  })
  .catch(error => {
    console.error('載入資料錯誤:', error);
    const tbody = document.querySelector('#garbageTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5">無法載入資料</td></tr>';
  });

  const searchInput = document.getElementById('searchInput');

  // === 搜尋框（防抖）===
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  // === 綜合篩選 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = garbageData.filter(garbage => {
      const targetFields = (garbage.name || "").toLowerCase();
      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  }

  // === 產生表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#garbageTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">找不到符合條件的道具</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      const tr = document.createElement('tr');

      const fields = [
        'class', 'name', 'family', 'renown', 'contribute'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const rawValue = item[field] ? String(item[field]) : '';
        const htmlValue = rawValue.replace(/\n/g, '<br>');

        // === 搜尋字串高亮 ===
        if (keyword && rawValue.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }

        // 🚀 新增：如果是「垃圾名稱」欄位，加上點擊功能
        if (field === 'name') {
          td.style.cursor = 'pointer';
          td.style.color = '#3399ff';
          td.style.textDecoration = 'underline';
          td.title = '點擊查看掉落地圖';
          td.onclick = () => showDropMaps(item.name);
        }

        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  }

  // 🚀 核心實驗功能：尋找並顯示掉落地圖
  function showDropMaps(garbageName) {
    if (!mapData || mapData.length === 0) return;

    // 在地圖資料中尋找含有此垃圾的地圖
    const foundMaps = mapData.filter(map => {
      const dropStr = map.drop_rubbish || "";
      // 利用「、」切換成陣列，進行精確比對
      const dropList = dropStr.split('、');
      return dropList.includes(garbageName);
    });

    const mapNames = foundMaps.map(m => m.mapid);
    const resultText = mapNames.length > 0 
      ? mapNames.join('、') 
      : "目前無地圖掉落資料";

    // 顯示在 Modal
    const modalContent = document.getElementById('modalContent');
    if (modalContent) {
      modalContent.innerHTML = `
        <h2 class="hero-name">${garbageName}</h2>
        <div class="hero-column-details" style="padding: 20px;">
          <p style="font-size: 18px; margin-bottom: 10px;"><strong>掉落地圖：</strong></p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">${resultText}</p>
        </div>
      `;
      openModal();
    }
  }

  // === Modal 控制 ===
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const closeBtn = document.querySelector('.close-btn');

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

  // === 清除搜尋 ===
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      renderTable(garbageData);
    });
  }
});
