document.addEventListener("DOMContentLoaded", () => {
  // 載入 JSON
  fetch("/mo_data/data/card.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 card.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data;
      const filteredData = data.filter(d => d.type === "裝備卡");
      initCardTable(filteredData);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "<tr><td colspan='6'>無法載入資料</td></tr>";
    });

  // === 回到頂部按鈕 ===
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // === Accordion 展開／收合 ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});


// === 初始化卡片表格 ===
function initCardTable(data) {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearFilters");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const tbody = document.querySelector("#card-equip-table tbody");

  let activeFilters = {
    card_property: [],
    multiplier: [],
    new_old: [],
  };

  // === 表格渲染 ===
  function renderTable(filteredData) {
    tbody.innerHTML = "";
    const keyword = searchInput.value.trim().toLowerCase();

    if (filteredData.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>找不到符合條件的裝備卡</td></tr>";
      return;
    }

    filteredData.forEach(item => {
      const tr = document.createElement("tr");
      const fields = [
        item.card_id,
        item.card_lv,
        item.card_property,
        item.card_data,
        item.multiplier || item.nemultiplier, // 兼容舊欄位名稱
        item.hero_name,
      ];

      fields.forEach(value => {
        const td = document.createElement("td");
        const str = String(value || "");
        if (keyword && str.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, "gi");
          td.innerHTML = str.replace(regex, "<span class='highlight2'>$1</span>");
        } else {
          td.textContent = str;
        }
        tr.appendChild(td);
      });

      tr.addEventListener("click", () => showDetailModal(item));
      tbody.appendChild(tr);
    });
  }

  // === 篩選邏輯 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(item => {
      const matchSearch =
        !keyword ||
        String(item.card_id || "").toLowerCase().includes(keyword) ||
        String(item.hero_name || "").toLowerCase().includes(keyword) ||
        String(item.card_property || "").toLowerCase().includes(keyword);

      const matchProperty =
        activeFilters.card_property.length === 0 ||
        activeFilters.card_property.includes(item.card_property);

      const matchMultiplier =
        activeFilters.multiplier.length === 0 ||
        activeFilters.multiplier.includes(item.multiplier || item.nemultiplier);

      const matchNewOld =
        activeFilters.new_old.length === 0 ||
        activeFilters.new_old.includes(item.new_old);

      return matchSearch && matchProperty && matchMultiplier && matchNewOld;
    });

    renderTable(filtered);
  }

  // === Modal 顯示 ===
  function showDetailModal(item) {
    const overlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const contentDiv = document.getElementById('modalContent');

    const safeName = item.card_id.replace(/[^\w\u4e00-\u9fa5]/g, '');
    const img = document.createElement('img');
    img.alt = item.card_id;
    img.className = 'hero-image';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';

    // 多格式圖片路徑
    const imageCandidates = [
      `/mo_data/pic/card-equip/${item.card_id}_${item.card_property}`,
      `/mo_data/pic/card-equip/${item.card_id}`,
    ];

    const extensions = ['.png', '.bmp', '.jpg'];
    let attempt = 0;

    // 嘗試多種副檔名
    function tryNext() {
      if (attempt >= imageCandidates.length * extensions.length) {
        console.warn('❌ 所有圖片載入失敗，顯示預設圖');
        img.src = '/mo_data/pic/no-image.png';
        return;
      }

      const pathIndex = Math.floor(attempt / extensions.length);
      const extIndex = attempt % extensions.length;
      const candidate = imageCandidates[pathIndex] + extensions[extIndex];
      const needEncoding = /[^\w\-./]/.test(candidate);
      const safePath = needEncoding ? encodeURI(candidate) : candidate;

      const testImg = new Image();
      testImg.onload = () => (img.src = safePath);
      testImg.onerror = () => {
        attempt++;
        tryNext();
      };
      testImg.src = safePath;
    }
    tryNext();

    // === Modal HTML ===
    const html = `
      <h2 class="hero-name">${item.card_id}</h2>
      <div class="hero-details-container" style="display:flex; gap: 20px;">
        <div class="hero-column left" style="flex:1;"></div>
        <div class="hero-column right" style="flex:1;">
          <p><strong>專卡名稱：</strong>${item.card_id}</p>
          <p><strong>等級：</strong>${item.card_lv}</p>
          <p><strong>屬性：</strong>${item.card_property} + ${item.card_data}</p>
          <p><strong>倍率：</strong>${item.multiplier || item.nemultiplier}</p>
          <p><strong>專屬英雄：</strong>${item.hero_name}</p>
        </div>
      </div>
    `;

    contentDiv.innerHTML = html;
    contentDiv.querySelector('.hero-column.left').appendChild(img);

    overlay.style.display = 'block';
    modalBox.style.display = 'block';
  }

  // === 關閉 Modal ===
  function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBox').style.display = 'none';
  }

  const closeBtn = document.querySelector('#modalBox .close-btn');
  closeBtn.addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);

  // === 篩選按鈕 ===
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      btn.classList.toggle("active");
      if (btn.classList.contains("active")) {
        activeFilters[type].push(value);
      } else {
        activeFilters[type] = activeFilters[type].filter(f => f !== value);
      }

      applyFilters();
    });
  });

  // === 清除篩選 ===
  clearBtn.addEventListener("click", () => {
    activeFilters = { card_property: [], multiplier: [], new_old: [] };
    filterBtns.forEach(b => b.classList.remove("active"));
    searchInput.value = "";
    applyFilters();
  });

  // === 搜尋框 ===
  searchInput.addEventListener("input", applyFilters);

  // 頁面載入後先渲染
  renderTable(data);
}
