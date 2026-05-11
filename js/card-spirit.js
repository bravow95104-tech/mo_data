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
    const data = Array.isArray(json) ? json : (json.data || []);
    allCardData = data.filter(d => d.type === "靈具卡");
    mapData = Array.isArray(maps) ? maps : (maps.data || []);
    
    populateDatalists(allCardData); // 🚀 補回：填充下拉清單
    initializeSortIcons();
    applyFiltersAndSort(); // 初始渲染
    updateSortIcons();
  })
  .catch(err => {
    console.error("❌ 資料載入失敗：", err);
    const tbody = document.querySelector("#card-equip-table tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:red;">資料載入失敗 (${err.message})</td></tr>`;
  });

  // 🚀 補回：填充 datalist 選項函式
  function populateDatalists(data) {
    const uniqueFirst = new Set();
    const uniqueSecond = new Set();
    const uniqueThird = new Set();

    data.forEach(item => {
      if (item.property_first) uniqueFirst.add(item.property_first);

      if (item.property_second) {
        item.property_second.split("、").forEach(val => {
          const v = val.trim();
          if (v) uniqueSecond.add(v);
        });
      }

      if (item.property_third) {
        item.property_third.split("、").forEach(val => {
          const v = val.trim();
          if (v) uniqueThird.add(v);
        });
      }
    });

    function fillDatalist(id, items) {
      const datalist = document.getElementById(id);
      if (!datalist) return;
      datalist.innerHTML = "";
      Array.from(items).sort().forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        datalist.appendChild(option);
      });
    }

    fillDatalist("propertyFirstList", uniqueFirst);
    fillDatalist("propertySecondList", uniqueSecond);
    fillDatalist("propertyThirdList", uniqueThird);
  }

  function applyFiltersAndSort() {
    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");
    const searchName = document.getElementById("searchInput1");

    const keywordFirst = searchFirst.value.trim().toLowerCase();
    const keywordSecond = searchSecond.value.trim().toLowerCase();
    const keywordThird = searchThird.value.trim().toLowerCase();
    const keywordName = searchName.value.trim().toLowerCase();

    // === 篩選邏輯 ===
    let filtered = allCardData.filter(item => {
      const matchFirst = !keywordFirst || (item.property_first || "").toLowerCase().includes(keywordFirst);
      const matchSecond = !keywordSecond ||
        (item.property_second || "").toLowerCase().includes(keywordSecond) ||
        (item.property_second || "").toLowerCase().includes("隨機");
      const matchThird = !keywordThird ||
        (item.property_third || "").toLowerCase().includes(keywordThird) ||
        (item.property_third || "").toLowerCase().includes("隨機");
      const matchName = !keywordName || (item.card_id || "").toLowerCase().includes(keywordName);

      return matchFirst && matchSecond && matchThird && matchName;
    });

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

    renderTable(filtered);
  }

  function renderTable(filteredData) {
    const tbody = document.querySelector("#card-equip-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");
    const searchName = document.getElementById("searchInput1");

    if (filteredData.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>找不到符合條件的靈具卡</td></tr>";
      return;
    }

    filteredData.forEach(item => {
      const tr = document.createElement("tr");

      let displayDrop = item.drop || "";
      if (!displayDrop || displayDrop === "未知") {
        const foundMaps = mapData.filter(map => {
          const dropStr = map.drop_equidcard || "";
          const dropList = dropStr.split("、");
          return dropList.includes(item.card_id);
        });
        displayDrop = foundMaps.length > 0 ? foundMaps.map(m => m.mapid).join("、 ") : displayDrop;
      }

      const fields = [
        item.card_id,
        item.card_lv,
        item.property_first,
        item.property_second,
        item.property_third,
        displayDrop,
      ];

      fields.forEach((value, index) => {
        const td = document.createElement("td");
        let text = String(value || "");
        let keyword = "";

        if (index === 0) keyword = searchName.value.trim();
        else if (index === 2) keyword = searchFirst.value.trim();
        else if (index === 3) keyword = searchSecond.value.trim();
        else if (index === 4) keyword = searchThird.value.trim();

        if (keyword) {
          const regex = new RegExp(`(${keyword})`, "gi");
          td.innerHTML = text.replace(regex, "<span class='highlight2'>$1</span>");
        } else {
          td.textContent = text;
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
  const searchFirst = document.getElementById("searchFirst");
  const searchSecond = document.getElementById("searchSecond");
  const searchThird = document.getElementById("searchThird");
  const searchName = document.getElementById("searchInput1");
  const clearFiltersBtn = document.getElementById("clearFilters");

  [searchFirst, searchSecond, searchThird, searchName].forEach(input => {
    if (input) input.addEventListener("input", applyFiltersAndSort);
  });

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

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      sortConfig = { key: null, direction: 'asc' };
      if (searchFirst) searchFirst.value = "";
      if (searchSecond) searchSecond.value = "";
      if (searchThird) searchThird.value = "";
      if (searchName) searchName.value = "";
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

    // 建立名稱
    const title = document.createElement("h2");
    title.className = "hero-name";
    title.textContent = item.card_id;

    // 建立圖片
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id || "card-image";
    img.src = `/mo_data/pic/card-spirit/${encodeFileName(item.card_id)}.png`;
    img.onerror = () => {};

    // 加入元素
    contentDiv.appendChild(title);
    contentDiv.appendChild(img);

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
