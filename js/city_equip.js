document.addEventListener("DOMContentLoaded", () => {
  let equipesData = [];
  let sortConfig = { key: null, direction: "asc" }; 
  let lastFilteredData = [];
  let activeFilters = {}; 

  // === 響應式斷點判斷 ===
  function isBreakpointBelow768() {
    return window.innerWidth <= 768;
  }
  let resizeFlag = isBreakpointBelow768();
  let resizeTimeout = null;

  window.addEventListener("resize", () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const isBelowNow = isBreakpointBelow768();
      if (isBelowNow !== resizeFlag) {
        resizeFlag = isBelowNow;
        applyLayout();
      }
    }, 150);
  });

  const tableBody = document.querySelector("#heroes-table tbody");
  const searchInput = document.getElementById("searchInput");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBox = document.getElementById("modalBox");
  const modalContent = document.getElementById("modalContent");
  const closeModalBtn = document.querySelector("#modalBox .close-btn");
  const equipesTableContainer = document.getElementById("hero-table-container");
  const equipesCardContainer = document.getElementById("hero-card-container");

  // === 1. 載入 JSON 資料 ===
  fetch("/mo_data/data/city_equip.json")
    .then((response) => response.json())
    .then((data) => {
      equipesData = data;
      applyFilters(); 
    })
    .catch((error) => {
      console.error("載入資料錯誤:", error);
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="7">無法載入裝備資料</td></tr>';
    });

  // === 2. 篩選與排序核心邏輯 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    let filtered = equipesData.filter((equip) => {
      for (let type in activeFilters) {
        if (equip[type] !== activeFilters[type]) return false;
      }
      if (keyword) {
        const targetFields = `${equip.item} ${equip.lv} ${equip.class}`.toLowerCase();
        if (!targetFields.includes(keyword)) return false;
      }
      return true;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let A = a[sortConfig.key];
        let B = b[sortConfig.key];
        const nA = parseFloat(A);
        const nB = parseFloat(B);
        if (!isNaN(nA) && !isNaN(nB)) { A = nA; B = nB; } 
        else { A = String(A || "").toLowerCase(); B = String(B || "").toLowerCase(); }
        if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      equipesTableContainer.style.display = "none";
      equipesCardContainer.style.display = "flex";
      renderCard(lastFilteredData);
    } else {
      equipesTableContainer.style.display = "block";
      equipesCardContainer.style.display = "none";
      renderTable(lastFilteredData);
    }
  }

  // === 3. 渲染視圖 (表格) - 已加入圖片欄位 ===
  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">找不到符合條件的裝備</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach((equip) => {
      const tr = document.createElement("tr");

      // --- ✅ 新增：圖片欄邏輯 ---
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'width:50px; height:50px; text-align:center; vertical-align:middle;';
      
      if (equip.item) {
        const img = document.createElement('img');
        const basePath = `/mo_data/pic/city_equip/${equip.item}`; // 注意：這裡路徑需確認是否為 city_equip
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;

        img.src = basePath + extensions[attempt];
        img.alt = equip.item;
        img.style.cssText = 'width:40px; height:40px; object-fit:contain; display:block; margin:0 auto; background:#f8f8f8; border-radius:4px;';

        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            img.src = basePath + extensions[attempt];
          } else {
            imgTd.innerHTML = '<span style="color:#ccc; font-size:12px;">-</span>';
          }
        };
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      // --- 原有資料欄位 ---
      const fields = ["item", "lv", "Property1", "Property2", "Durability", "illustrate"];
      fields.forEach((field) => {
        const td = document.createElement("td");
        let val = equip[field] !== undefined ? String(equip[field]) : "";
        let htmlVal = val.replace(/\n/g, "<br>");

        if (keyword && val.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, "gi");
          td.innerHTML = htmlVal.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.innerHTML = htmlVal;
        }
        tr.appendChild(td);
      });

      tr.addEventListener("click", () => showDetailModal(equip));
      fragment.appendChild(tr);
    });
    tableBody.appendChild(fragment);
  }

  // === 4. 渲染視圖 (手機卡片) - 已修正變數與圖片邏輯 ===
  function renderCard(data) {
    equipesCardContainer.innerHTML = "";
    if (data.length === 0) {
      equipesCardContainer.innerHTML = "<p style='padding:20px;'>找不到符合條件的裝備</p>";
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach((equip) => {
      const div = document.createElement("div");
      div.className = "accordion";
      
      // 修正：將 hero 改回 equip，並處理說明文字換行
      const illustrateHtml = equip.illustrate ? equip.illustrate.replace(/\n/g, "<br>") : "無說明";

      div.innerHTML = `
        <h2 class="hero-name">${equip.item}</h2>
        <div class="hero-details-container">
          <div class="hero-column-base hero-column">
            <p><strong>等級：</strong>${equip.lv}</p>
            <p><strong>攻擊 / 防禦：</strong>${equip.Property1}</p>
            <p><strong>命中 / 閃避：</strong>${equip.Property2}</p>
            <p><strong>耐久度：</strong>${equip.Durability}</p>
          </div>
          <div class="hero-column-base hero-column">
            ${[1,2,3,4,5,6,7,8,9,10,11].map(num => 
              equip[`material${num}`] ? `<p><strong>材料 ${num}：</strong>${equip[`material${num}`]}</p>` : ''
            ).join('')}
          </div>
          <div class="hero-column-details" style="grid-column: span 2; border-top: 1px solid #eee; padding-top: 10px;">
            <p><strong>說明：</strong><br>${illustrateHtml}</p>
          </div>
        </div>
      `;
      div.addEventListener("click", () => showDetailModal(equip));
      fragment.appendChild(div);
    });
    equipesCardContainer.appendChild(fragment);
  }

  // === 5. 事件監聽 (搜尋、按鈕、排序) ===
  searchInput.addEventListener("input", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyFilters, 200);
  });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        delete activeFilters[type];
      } else {
        document.querySelectorAll(`.filter-btn[data-type="${type}"]`).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilters[type] = value;
      }
      applyFilters();
    });
  });

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      sortConfig.direction = (sortConfig.key === col && sortConfig.direction === "asc") ? "desc" : "asc";
      sortConfig.key = col;
      document.querySelectorAll("th.sortable").forEach(el => el.classList.remove("sort-asc", "sort-desc"));
      th.classList.add(sortConfig.direction === "asc" ? "sort-asc" : "sort-desc");
      applyFilters();
    });
  });

  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    activeFilters = {};
    sortConfig = { key: null, direction: "asc" };
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll("th.sortable").forEach(el => el.classList.remove("sort-asc", "sort-desc"));
    applyFilters();
  });

  // === 6. Modal 詳細視窗 ===
  function showDetailModal(equip) {
    modalContent.innerHTML = `
      <h2 class="hero-name">${equip.item}</h2>
      <div class="hero-details-container">
        <div class="hero-column">
          <p><strong>等級：</strong>${equip.lv}</p>
          <p><strong>能力 1：</strong>${equip.Property1}</p>
          <p><strong>能力 2：</strong>${equip.Property2}</p>
          <p><strong>耐用度：</strong>${equip.Durability}</p>
        </div>
        <div class="hero-column">
           ${[1,2,3,4,5,6,7,8,9,10,11].map(num => 
              equip[`material${num}`] ? `<p><strong>材料 ${num}：</strong>${equip[`material${num}`]}</p>` : ''
            ).join('')}
        </div>
        <div class="hero-column-details" style="grid-column: span 2; border-top: 1px solid #ddd; padding-top: 15px;">
          <p><strong>說明：</strong><br>${equip.illustrate ? equip.illustrate.replace(/\n/g, "<br>") : "無說明"}</p>
        </div>
      </div>
    `;
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
  }

  closeModalBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);
});