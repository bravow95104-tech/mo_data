document.addEventListener("DOMContentLoaded", () => {
  let equipesData = [];
  let sortConfig = { key: null, direction: "asc" }; // 記錄排序狀態
  let lastFilteredData = [];

  // === 判斷斷點是否在768以下 ===
  function isBreakpointBelow768() {
    console.log("Viewport width:", window.innerWidth);
    return window.innerWidth <= 768;
  }
  let resizeFlag = isBreakpointBelow768();
  let resizeTimeout = null;

  // 隨時監聽窗口大小變化 (使用節流避免過度重排)
  window.addEventListener("resize", () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
      const isBelowNow = isBreakpointBelow768();

      if (isBelowNow !== resizeFlag) {
        resizeFlag = isBelowNow;
        requestAnimationFrame(applyLayout);
      }
    }, 150);
  });

  // === 動態新增排序箭頭 (最終修正版) ===
  document.querySelectorAll("th.sortable").forEach((th) => {
    // 防止重複執行
    if (th.querySelector(".th-flex-container")) return;

    const flexContainer = document.createElement("div");
    flexContainer.className = "th-flex-container";

    const textWrapper = document.createElement("span");
    textWrapper.className = "th-text-wrapper";

    // 將現有內容移入 textWrapper
    while (th.firstChild) {
      textWrapper.appendChild(th.firstChild);
    }

    // 建立箭頭容器
    const caretContainer = document.createElement("span");
    caretContainer.className = "sort-caret-container";
    caretContainer.innerHTML =
      '<span class="caret-up">▲</span><span class="caret-down">▼</span>';

    // 將文字和箭頭都放入 flex 總容器
    flexContainer.appendChild(textWrapper);
    flexContainer.appendChild(caretContainer);

    // 最後將總容器放回 th
    th.appendChild(flexContainer);
  });

  // === DOM 元素快取 ===
  const tableBody = document.querySelector("#heroes-table tbody");
  const searchInput = document.getElementById("searchInput");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const equipesTableContainer = document.getElementById("equip-table-container");
  const equipesCardContainer = document.getElementById("equip-card-container");
  // === 1. 載入 JSON 資料 ===
  fetch("/mo_data/data/rebirth_equip.json")
    .then((response) => response.json())
    .then((data) => {
      equipesData = data;
      applyFilters(); // 初始渲染
    })
    .catch((error) => {
      console.error("載入裝備資料錯誤:", error);
      if (tableBody)
        tableBody.innerHTML = '<tr><td colspan="6">無法載入裝備資料</td></tr>';
    });

  
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    

    // A. 取得篩選條件
    const filters = {
      lv: [],
      atk: [],
      hit: [],
    };

    document.querySelectorAll(".filter-btn.active").forEach((btn) => {
      const type = btn.dataset.type;
      const val = btn.dataset.value;
      if (filters[type]) filters[type].push(val);
    });

    // B. filter
    let filtered = equipesData.filter((equip) => {
      const targetFields = [
        equip.item,
        equip.lv,
      ]
        .join(" ")
        .toLowerCase();

      if (!targetFields.includes(keyword)) return false;

      if (
        filters.promotion.length &&
        !filters.promotion.includes(equip.promotion)
      )
        return false;

      if (
        filters.personality.length &&
        !filters.personality.includes(equip.personality)
      )
        return false;

      if (
        filters.traits.length &&
        !filters.traits.includes(String(equip.traits))
      )
        return false;

      if (
        filters.new_multiplier.length &&
        !filters.new_multiplier.includes(equip.new_multiplier)
      )
        return false;

      return true;
    });

    // C. sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let A = a[sortConfig.key];
        let B = b[sortConfig.key];

        const nA = parseFloat(A);
        const nB = parseFloat(B);

        if (!isNaN(nA) && !isNaN(nB)) {
          A = nA;
          B = nB;
        } else {
          A = String(A || "").toLowerCase();
          B = String(B || "").toLowerCase();
        }

        if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // D. 存起來
    lastFilteredData = filtered;

    // E. 只在「資料真的改變」時 render
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

  // === 3. 渲染表格 ===
  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="15">找不到符合條件的英雄</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach((equip) => {
      const tr = document.createElement("tr");
      const fields = [
        "item",
        "lv",
        "Property1",
        "Property2",
        "Durability",
        "illustrate",
      ];

      fields.forEach((field) => {
        const td = document.createElement("td");
        const value = equip[field] !== undefined ? String(equip[field]) : "";

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, "gi");
          td.innerHTML = value.replace(
            regex,
            '<span class="highlight">$1</span>',
          );
        } else {
          td.textContent = value;
        }
        tr.appendChild(td);
      });

      tr.addEventListener("click", () => showDetailModal(equip));
      fragment.appendChild(tr);
    });
    tableBody.appendChild(fragment);
  }

  function renderCard(data) {
    const fragment = document.createDocumentFragment();
    equipesCardContainer.innerHTML = "";

    data.forEach((equip) => {
      const div = document.createElement("div");
      div.className = "accordion";
      console.log(equip);
      const safeName = equip.name.replace(/[^\w\u4e00-\u9fa5]/g, "");

      function createImageWithFallbacks(basePath, altText) {
        const img = document.createElement("img");
        img.alt = altText;
        img.src = basePath + ".png";
        img.onerror = () => (img.style.display = "none"); // Keep this for fallback
        return img;
      }

      div.innerHTML = `<h2 class="equip-name" id="modal-title">${equip.item}</h2>`;

      const imgContainer = document.createElement("div");
      imgContainer.className = "equip-images equip-card-images";
      imgContainer.appendChild(
        createImageWithFallbacks(`/mo_data/pic/equipes/${safeName}_正`, "正面"),
      );
      imgContainer.appendChild(
        createImageWithFallbacks(`/mo_data/pic/equipes/${safeName}_反`, "反面"),
      );
      div.appendChild(imgContainer);

      const detailHTML = `
      <div class="equip-details-container">
        <div class="equip-column-base equip-column">
          <p><strong>等級：</strong>${equip.lv}</p>
          <p><strong>攻擊 / 防禦：</strong>${equip.Property1}</p>
          <p><strong>命中 / 閃避</strong>${equip.Property2}</p>
        </div>
        <div class="equip-column-base equip-column">
          <p><strong>材料 1：</strong>${equip.material1}</p>
          <p><strong>材料 2：</strong>${equip.material2}</p>
          <p><strong>材料 3：</strong>${equip.material3}</p>
          <p><strong>材料 4：</strong>${equip.material4}</p>
          <p><strong>材料 5：</strong>${equip.material5}</p>
          <p><strong>材料 6：</strong>${equip.material6}</p>
          <p><strong>材料 7：</strong>${equip.material7}</p>
          <p><strong>材料 8：</strong>${equip.material8}</p>
          <p><strong>材料 9：</strong>${equip.material9}</p>
          <p><strong>材料10：</strong>${equip.material10}</p>
          <p><strong>材料11：</strong>${equip.material11}</p>
        </div>
        <div class="equip-column-base equip-column-details">
          <p><strong>說明：</strong>${equip.illustrate}</p>
        </div>
        ${
          equip.playerdata
            ? `
      <div class="equip-playerdata">
        <p><strong>資訊提供：</strong>${equip.playerdata}</p>
      </div>
      `
            : ""
        }
      </div>
    `;
      div.insertAdjacentHTML("beforeend", detailHTML);

      fragment.appendChild(div);
    });
    console.log(fragment);
    equipesCardContainer.appendChild(fragment);
  }
  // === 4. 事件監聽 (搜尋、按鈕、排序) ===
  searchInput.addEventListener("input", applyFilters);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      applyFilters();
    });
  });

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      if (sortConfig.key === col) {
        sortConfig.direction = sortConfig.direction === "asc" ? "desc" : "asc";
      } else {
        sortConfig.key = col;
        sortConfig.direction = "desc";
      }

      document.querySelectorAll("th.sortable").forEach((el) => {
        el.classList.remove("sort-asc", "sort-desc");
      });
      th.classList.add(
        sortConfig.direction === "asc" ? "sort-asc" : "sort-desc",
      );

      applyFilters();
    });
  });

  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    sortConfig = { key: null, direction: "asc" };
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll("th.sortable")
      .forEach((el) => el.classList.remove("sort-asc", "sort-desc"));
    applyFilters();
  });

  
  // Accordion
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.parentElement.classList.toggle("collapsed");
    });
  });
});
