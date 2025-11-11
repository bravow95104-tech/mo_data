document.addEventListener("DOMContentLoaded", () => {
  // === 載入 JSON 資料 ===
  fetch("/mo_data/data/detailed_map.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 detailed_map.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data;

      // ✅ 預載圖片
      preloadCardImages(data);

      // ✅ 初始化表格
      initCardTable(data);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      if (tbody)
        tbody.innerHTML = "<tr><td colspan='6'>無法載入資料</td></tr>";
    });

  // === Accordion 展開／收合 ===
  document.addEventListener("click", e => {
    if (e.target.classList.contains("accordion-header")) {
      e.target.parentElement.classList.toggle("collapsed");
    }
  });
});


// === 預載卡圖 ===
function preloadCardImages(data) {
  data.forEach(item => {
    const img = new Image();
    img.src = `/mo_data/pic/map/${encodeURIComponent(item.card_id)}.png`;
  });
}


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
      tbody.innerHTML = "<tr><td colspan='6'>找不到符合條件的地圖</td></tr>";
      return;
    }

    filteredData.forEach(item => {
      const tr = document.createElement("tr");
      const fields = [
        item.mapid,
        item.traits,
        item.drop_glory_high,
        item.drop_glory_low,
        item.player
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


  // === 套用搜尋／篩選條件 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    let filtered = data.filter(item => {
      const matchKeyword =
        !keyword ||
        Object.values(item).some(v =>
          String(v || "").toLowerCase().includes(keyword)
        );

      // 這裡可擴充多重篩選條件 (activeFilters)，目前只用搜尋字
      return matchKeyword;
    });

    renderTable(filtered);
  }


  // === 清除篩選 ===
  clearBtn.addEventListener("click", () => {
    activeFilters = { card_property: [], multiplier: [], new_old: [] };
    filterBtns.forEach(b => b.classList.remove("active"));
    searchInput.value = "";
    applyFilters();
  });

  // === 搜尋框 ===
  searchInput.addEventListener("input", applyFilters);


  // === Modal 顯示 ===
  async function showDetailModal(item) {
    const overlay = document.getElementById("modalOverlay");
    const modalBox = document.getElementById("modalBox");
    const contentDiv = document.getElementById("modalContent");

    const img = new Image();
    img.alt = item.card_id;
    img.className = "hero-image";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.objectFit = "contain";

    const path = `/mo_data/pic/map/${encodeURIComponent(item.card_id)}.png`;

    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = path;
      });
    } catch {
      console.warn("圖片載入失敗，使用預設圖");
      img.src = "/mo_data/pic/default.png";
    }

    const html = `
      <h2 class="hero-name">${item.card_id}</h2>
      <div class="hero-details-container" style="display:flex; gap: 20px;">
        <div class="hero-column left" style="flex:1;"></div>
        <div class="hero-column right" style="flex:1;">
          <p><strong>專卡名稱：</strong>${item.card_id}</p>
          <p class="section-gap"><strong>等級：</strong>${item.card_lv}</p>
          <p><strong>屬性：</strong>${item.card_property} <strong>+</strong> ${item.card_data}</p>
          <p><strong>倍率：</strong>${item.nemultiplier}</p>
          <p class="section-gap"><strong>專屬英雄：</strong>${item.hero_name}</p>
        </div>
      </div>
    `;

    contentDiv.innerHTML = html;
    contentDiv.querySelector(".hero-column.left").appendChild(img);

    overlay.style.display = "block";
    modalBox.style.display = "block";
  }


  // === 關閉 Modal ===
  function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("modalBox").style.display = "none";
  }

  const closeBtn = document.querySelector("#modalBox .close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", closeModal);

  // === 頁面載入後渲染表格 ===
  renderTable(data);
}
