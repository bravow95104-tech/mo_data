document.addEventListener("DOMContentLoaded", () => {
  let allCardData = [];
  let mapData = [];
  let lastFilteredData = [];
  let sortConfig = { key: null, direction: 'asc' };

  // === 響應式判斷 ===
  const isBelow768 = () => window.innerWidth <= 768;
  let resizeFlag = isBelow768();
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentFlag = isBelow768();
      if (currentFlag !== resizeFlag) {
        resizeFlag = currentFlag;
        applyLayout();
      }
    }, 150);
  });

  const tableContainer = document.getElementById('card-equip-table');
  const cardContainer = document.getElementById('card-equip-container');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('#modalBox .close-btn');

  Promise.all([
    fetch("/mo_data/data/card.json").then(res => res.json()),
    fetch("/mo_data/data/detailed_map.json").then(res => res.json())
  ])
  .then(([json, maps]) => {
    mapData = Array.isArray(maps) ? maps : (maps.data || []);
    const data = Array.isArray(json) ? json : (json.data || []);
    allCardData = data.filter(d => d.type === "被動技能卡");
    
    initializeSortIcons();
    applyFiltersAndSort();
    updateSortIcons();
  })
  .catch(err => {
    console.error("❌ 資料載入失敗：", err);
    const tbody = document.querySelector("#card-equip-table tbody");
    if (tbody) tbody.innerHTML = "<tr><td colspan='5'>無法載入資料</td></tr>";
  });

  function applyFiltersAndSort() {
    const searchInput = document.getElementById("searchInput");
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    let filtered = allCardData.filter(item =>
      !keyword || [
        item.card_id,
        item.card_class,
        item.directions
      ].some(val => String(val || "").toLowerCase().includes(keyword))
    );

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

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    const keywordInput = document.getElementById("searchInput");
    const keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
    if (resizeFlag) {
      renderCards(lastFilteredData, keyword);
      if (tableContainer) tableContainer.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData, keyword);
      if (tableContainer) tableContainer.style.display = 'table';
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  function renderTable(data, keyword) {
    const tbody = document.querySelector("#card-equip-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px; color:#999;'>找不到符合條件的技能卡</td></tr>";
      return;
    }

    data.forEach(item => {
      const tr = document.createElement("tr");
      const foundMaps = mapData.filter(map => (map.drop_skillcard || "").split('、').includes(item.card_id));
      const displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (item.drop || "-");

      const fields = ['card_id', 'card_lv', 'card_class', 'directions'];
      fields.forEach(field => {
        const td = document.createElement("td");
        const str = String(item[field] || "");
        if (keyword && str.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
          td.innerHTML = str.replace(regex, "<span class='highlight2'>$1</span>");
        } else {
          td.textContent = str;
        }
        tr.appendChild(td);
      });

      const dropTd = document.createElement("td");
      dropTd.textContent = displayDrop;
      tr.appendChild(dropTd);

      tr.addEventListener("click", () => showDetailModal(item));
      tbody.appendChild(tr);
    });
  }

  function renderCards(data, keyword) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">沒有找到符合條件的技能卡</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    data.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card-item';
      
      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
        return String(text).replace(regex, "<span class='highlight2'>$1</span>");
      };

      cardDiv.innerHTML = `
        <h3>${highlight(card.card_id)}</h3>
        <p><strong>等級：</strong>${card.card_lv || '-'}</p>
        <p><strong>拜官：</strong>${highlight(card.card_class || '-')}</p>
        <p><strong>說明：</strong>${highlight(card.directions || '-')}</p>
      `;
      cardDiv.addEventListener('click', () => showDetailModal(card));
      fragment.appendChild(cardDiv);
    });
    cardContainer.appendChild(fragment);
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.addEventListener("input", applyFiltersAndSort);

  document.querySelectorAll('#card-equip-table th[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
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
      while (th.firstChild) textSpan.appendChild(th.firstChild);
      const iconContainer = document.createElement('span');
      iconContainer.className = 'sort-icon-container';
      iconContainer.innerHTML = '<span class="sort-arrow arrow-up">▲</span><span class="sort-arrow arrow-down">▼</span>';
      wrapper.appendChild(textSpan);
      wrapper.appendChild(iconContainer);
      th.appendChild(wrapper);
    });
  }

  function updateSortIcons() {
    document.querySelectorAll('#card-equip-table th[data-sort]').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === sortConfig.key) th.classList.add(`sorted-${sortConfig.direction}`);
    });
  }

  function encodeFileName(name) {
    return name.replace(/[^\w\u4e00-\u9fa5()]/g, '');
  }

  function showDetailModal(item) {
    if (!modalOverlay || !modalBox || !modalContent) return;

    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id;
    img.src = `/mo_data/pic/card-passive/${encodeFileName(item.card_id)}.png`;
    img.onerror = () => { img.style.display = 'none'; };

    const foundMaps = mapData.filter(map => (map.drop_skillcard || "").split('、').includes(item.card_id));
    const displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join('、 ') : (item.drop || "未知");

    modalContent.innerHTML = `
      <h2 class="hero-name">${item.card_id}</h2>
      <div class="hero-details-container">
        <div class="hero-column left" id="modal-img-col"></div>
        <div class="hero-column right">
          <p><strong>卡片名稱：</strong>${item.card_id}</p>
          <p><strong>等級：</strong>${item.card_lv}</p>
          <p><strong>拜官：</strong>${item.card_class || '-'}</p>
          <p><strong>說明：</strong>${item.directions || '-'}</p>
          <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>掉落地圖：</strong>${displayDrop}</p>
        </div>
      </div>
    `;
    modalContent.querySelector('#modal-img-col').appendChild(img);

    modalOverlay.style.display = 'block';
    modalBox.style.display = 'block';
    modalBox.scrollTop = 0;
  }

  function closeModal() {
    modalOverlay.style.display = 'none';
    modalBox.style.display = 'none';
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
});
