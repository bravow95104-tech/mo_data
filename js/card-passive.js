document.addEventListener("DOMContentLoaded", () => {
  let allCardData = [];
  let mapData = []; // 新增：儲存地圖資料
  let sortConfig = { key: null, direction: 'asc' }; // 統一管理排序狀態

  fetch("/mo_data/data/card.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 card.json 失敗");
      return res.json();
    })
    .then(json => {
      return fetch("/mo_data/data/detailed_map.json")
        .then(res => res.json())
        .then(maps => {
          mapData = Array.isArray(maps) ? maps : (maps.data || []);
          const data = Array.isArray(json) ? json : json.data;
          allCardData = data.filter(d => d.type === "被動技能卡");
          
          initializeSortIcons();
          applyFiltersAndSort(); // 初始渲染
          updateSortIcons();
        });
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      if (tbody) tbody.innerHTML = "<tr><td colspan='5'>無法載入資料</td></tr>";
    });

  function applyFiltersAndSort() {
    const searchInput = document.getElementById("searchInput");
    const keyword = searchInput.value.trim().toLowerCase();

    // === 篩選邏輯 ===
    let filtered = allCardData.filter(item =>
      !keyword ||
      (item.card_id && item.card_id.toLowerCase().includes(keyword)) ||
      (item.card_class && item.card_class.toLowerCase().includes(keyword)) ||
      (item.directions && item.directions.toLowerCase().includes(keyword))
    );

    // === 排序邏輯 ===
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
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

    renderTable(filtered, keyword);
  }

  function renderTable(filteredData, keyword) {
    const tbody = document.querySelector("#card-equip-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (filteredData.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5'>找不到符合條件的技能卡</td></tr>";
      return;
    }

    filteredData.forEach(item => {
      const tr = document.createElement("tr");
      
      const foundMaps = mapData.filter(map => {
        const dropStr = map.drop_skillcard || "";
        const dropList = dropStr.split('、');
        return dropList.includes(item.card_id);
      });
      const displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (item.drop || "-");

      const fields = [
        item.card_id,
        item.card_lv,
        item.card_class,
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

  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      if (!column) return;

      if (sortConfig.key === column) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = column;
        sortConfig.direction = 'desc';
      }
      
      updateSortIcons();
      applyFiltersAndSort();
    });
  });

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      sortConfig = { key: null, direction: 'asc' };
      if (searchInput) searchInput.value = "";
      updateSortIcons();
      applyFiltersAndSort();
    });
  }

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

  function updateSortIcons() {
    document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === sortConfig.key) {
        th.classList.add(`sorted-${sortConfig.direction}`);
      }
    });
  }

  function encodeFileName(name) {
    return name.replace(/[^\w\u4e00-\u9fa5()]/g, '');
  }

  function showDetailModal(item) {
    const overlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const contentDiv = document.getElementById('modalContent');
    if (!overlay || !modalBox || !contentDiv) return;

    contentDiv.innerHTML = "";
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id || "card-image";
    img.src = `/mo_data/pic/card-passive/${encodeFileName(item.card_id)}.png`;
    img.onerror = () => {};

    const html = `
      <div class="hero-details-container">
        <div class="hero-column">
          <h2 class="hero-name">${item.card_id}</h2>
        </div>
        <div class="hero-column" id="imgContainer"></div>
      </div>
    `;
    contentDiv.innerHTML = html;
    const imgContainer = contentDiv.querySelector("#imgContainer");
    if (imgContainer) imgContainer.appendChild(img);

    overlay.style.display = 'block';
    modalBox.style.display = 'block';
    setTimeout(() => {
      modalBox.scrollTop = 0;
    }, 0);
  }

  function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBox').style.display = 'none';
  }

  const closeBtn = document.querySelector('#modalBox .close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.addEventListener('click', closeModal);
});
