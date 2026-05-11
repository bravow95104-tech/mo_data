document.addEventListener("DOMContentLoaded", () => {
  let allCardData = [];
  let mapData = []; // 新增：儲存地圖資料
  let sortConfig = { key: null, direction: 'asc' }; // 統一管理排序狀態

  // 載入 JSON 資料
  Promise.all([
    fetch("/mo_data/data/card.json").then(res => {
      if (!res.ok) throw new Error("載入 card.json 失敗");
      return res.json();
    }),
    fetch("/mo_data/data/detailed_map.json").then(res => {
      if (!res.ok) throw new Error("載入 detailed_map.json 失敗");
      return res.json();
    })
  ])
  .then(([json, maps]) => {
    mapData = Array.isArray(maps) ? maps : (maps.data || []);
    const data = Array.isArray(json) ? json : (json.data || []);
    allCardData = data.filter(d => d.type === "主動技能卡");
    
    initializeSortIcons();
    applyFiltersAndSort(); // 初始渲染
    updateSortIcons();
  })
  .catch(err => {
    console.error("❌ 資料載入失敗：", err);
    const tbody = document.querySelector("#card-equip-table tbody");
    if (tbody) tbody.innerHTML = "<tr><td colspan='7'>無法載入資料</td></tr>";
  });

  // Accordion 展開／收合
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const accordion = header.parentElement;
      accordion.classList.toggle("collapsed");
    });
  });

  // 初始化表格邏輯
  function applyFiltersAndSort() {
    const searchInput = document.getElementById("searchInput");
    const keyword = searchInput.value.trim().toLowerCase();
    const activeCardClasses = Array.from(document.querySelectorAll('.filter-btn.active[data-type="card_class"]')).map(btn => btn.dataset.value);

    // === 篩選邏輯 ===
    let filteredData = allCardData.filter(item => {
      const matchSearch =
        !keyword ||
        (item.card_id && item.card_id.toLowerCase().includes(keyword)) ||
        (item.card_class && item.card_class.toLowerCase().includes(keyword)) ||
        (item.directions && item.directions.toLowerCase().includes(keyword));

      const matchCardClass =
        activeCardClasses.length === 0 ||
        activeCardClasses.includes(item.card_class);

      return matchSearch && matchCardClass;
    });

    // === 排序邏輯 ===
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // 嘗試轉為數字比較
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
            valA = numA;
            valB = numB;
        } else {
            valA = String(valA || "").toLowerCase();
            valB = String(valB || "").toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    renderTable(filteredData, keyword);
  }

  // === 渲染表格 ===
  function renderTable(data, keyword) {
    const tbody = document.querySelector("#card-equip-table tbody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='7'>找不到符合條件的技能卡</td></tr>";
      return;
    }

    data.forEach(item => {
      const tr = document.createElement("tr");

      // 🚀 核心優化：尋找掉落地圖
      const foundMaps = mapData.filter(map => {
        const dropStr = map.drop_skillcard || "";
        const dropList = dropStr.split('、');
        return dropList.includes(item.card_id);
      });
      
      let displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (item.drop || "");

      const fields = [
        item.card_id,
        item.card_lv,
        item.card_property,
        item.card_class,
        item.card_mp,
        item.directions,
        displayDrop
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

      tr.addEventListener("click", () => {
        showDetailModal(item);
      });

      tbody.appendChild(tr);
    });
  }

  // === 綁定事件 ===
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", applyFiltersAndSort);
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      applyFiltersAndSort();
    });
  });

  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      if (!column) return;

      if (sortConfig.key === column) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = column;
        sortConfig.direction = 'desc'; // 首次點擊預設為降序
      }
      
      updateSortIcons();
      applyFiltersAndSort();
    });
  });

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      sortConfig = { key: null, direction: 'asc' };
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove("active"));
      if (searchInput) searchInput.value = "";
      updateSortIcons();
      applyFiltersAndSort();
    });
  }

  // Helper function to set up the initial sort icons
  function initializeSortIcons() {
    document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
      if (th.querySelector('.header-content')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'header-content';
      const textSpan = document.createElement('span');
      while (th.firstChild) {
        textSpan.appendChild(th.firstChild);
      }
      const iconContainer = document.createElement('span');
      iconContainer.className = 'sort-icon-container';
      iconContainer.innerHTML = `
        <span class="sort-arrow arrow-up">▲</span>
        <span class="sort-arrow arrow-down">▼</span>
      `;
      wrapper.appendChild(textSpan);
      wrapper.appendChild(iconContainer);
      th.appendChild(wrapper);
    });
  }

  // Helper function to update sort icons in table headers
  function updateSortIcons() {
    document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === sortConfig.key) {
        th.classList.add(`sorted-${sortConfig.direction}`);
      }
    });
  }

  // === 檔名過濾（保留中文、數字、英文、底線、括號） ===
  function encodeFileName(name) {
    return name.replace(/[^\w\u4e00-\u9fa5()]/g, "");
  }

  // === Modal 顯示 ===
  function showDetailModal(item) {
    const overlay = document.getElementById("modalOverlay");
    const modalBox = document.getElementById("modalBox");
    const contentDiv = document.getElementById("modalContent");

    if (!overlay || !modalBox || !contentDiv) {
      console.error("❌ 找不到 Modal 元素");
      return;
    }

    // 清空舊內容
    contentDiv.innerHTML = "";

    // 建立名稱
    const title = document.createElement("h2");
    title.className = "hero-name";
    title.textContent = item.card_id;

    // 建立圖片元素
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id || "card-image";
    img.src = `/mo_data/pic/card-active/${encodeFileName(item.card_id)}.png`;
    img.onerror = () => {};

    // 加入元素
    contentDiv.appendChild(title);
    contentDiv.appendChild(img);

    overlay.style.display = "block";
    modalBox.style.display = "block";
    setTimeout(() => {
      modalBox.scrollTop = 0;
    }, 0);
  }

  // === 關閉 Modal ===
  function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("modalBox").style.display = "none";
  }

  const closeBtn = document.querySelector("#modalBox .close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.addEventListener("click", closeModal);
});
