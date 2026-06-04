import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  let heroesData = [];
  let sortConfig = { key: null, direction: "asc" }; // 記錄排序狀態
  let lastFilteredData = [];

  // === 判斷斷點是否在768以下 ===
  function isBreakpointBelow768() {
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
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBox = document.getElementById("modalBox");
  const modalContent = document.getElementById("modalContent");
  const closeModalBtn = document.querySelector("#modalBox .close-btn");
  const heroesTableContainer = document.getElementById("hero-table-container");
  const heroesCardContainer = document.getElementById("hero-card-container");

  // === 1. 從 Supabase 載入資料 ===
  async function loadData() {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .order('sort_id', { ascending: true }); // 改為 sort_id 排序

      if (error) throw error;

      heroesData = data || [];
      
      // 🚀 檢查 URL 是否有 ?hero=名稱 參數
      const urlParams = new URLSearchParams(window.location.search);
      const heroParam = urlParams.get('hero');
      if (heroParam && searchInput) {
        searchInput.value = heroParam;
        applyFilters(); 
        
        if (lastFilteredData.length > 0) {
          const matchedHero = lastFilteredData.find(h => h.name === heroParam);
          if (matchedHero) {
            showDetailModal(matchedHero);
          }
        }
      } else {
        applyFilters(); 
      }
    } catch (error) {
      console.error("載入英雄資料錯誤:", error);
      if (tableBody)
        tableBody.innerHTML = '<tr><td colspan="15">無法載入英雄資料</td></tr>';
    }
  }

  loadData();

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    // A. 取得篩選條件
    const filters = {
      promotion: [],
      personality: [],
      traits: [],
      new_multiplier: [],
    };

    document.querySelectorAll(".filter-btn.active").forEach((btn) => {
      const type = btn.dataset.type;
      const val = btn.dataset.value;
      if (filters[type]) filters[type].push(val);
    });

    // B. filter
    let filtered = heroesData.filter((hero) => {
      const targetFields = [
        hero.name,
        hero.glory,
        hero.equipment_new,
        hero.equipment_old,
        hero.promotion,
        hero.personality,
        hero.traits,
      ]
        .join(" ")
        .toLowerCase();

      if (!targetFields.includes(keyword)) return false;

      if (
        filters.promotion.length &&
        !filters.promotion.includes(hero.promotion)
      )
        return false;

      if (
        filters.personality.length &&
        !filters.personality.includes(hero.personality)
      )
        return false;

      if (
        filters.traits.length &&
        !filters.traits.includes(String(hero.traits))
      )
        return false;

      if (
        filters.new_multiplier.length &&
        !filters.new_multiplier.includes(hero.new_multiplier)
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
    requestAnimationFrame(() => {
      if (resizeFlag) {
        if (heroesTableContainer) heroesTableContainer.style.display = "none";
        if (heroesCardContainer) heroesCardContainer.style.display = "flex";
        renderCard(lastFilteredData);
      } else {
        if (heroesTableContainer) heroesTableContainer.style.display = "block";
        if (heroesCardContainer) heroesCardContainer.style.display = "none";
        const table = document.getElementById("heroes-table");
        if (table) table.style.display = "table";
        renderTable(lastFilteredData);
      }
    });
  }

  // === 3. 渲染表格 ===
  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const keyword = searchInput.value.trim().toLowerCase();
    const regex = keyword ? new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi") : null;

    if (data.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="15">找不到符合條件的英雄</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const fields = [
      "name", "glory", "promotion", "initial", "traits", "personality", "element",
      "str", "int", "vit", "agi", "luk", "aggression_before", "equipment_new", "equipment_old"
    ];

    data.forEach((hero) => {
      const tr = document.createElement("tr");
      
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const td = document.createElement("td");
        // 修正：顯式處理 null/undefined 為空字串
        const val = hero[field];
        const value = (val === null || val === undefined) ? "" : String(val);

        if (regex && value.toLowerCase().includes(keyword)) {
          td.innerHTML = value.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.textContent = value;
        }
        tr.appendChild(td);
      }

      tr.addEventListener("click", () => showDetailModal(hero));
      fragment.appendChild(tr);
    });
    tableBody.appendChild(fragment);
  }

  // === 渲染手機版卡片 (簡化版以提升效能) ===
  function renderCard(data) {
    if (!heroesCardContainer) return;
    heroesCardContainer.innerHTML = "";

    if (data.length === 0) {
      heroesCardContainer.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">找不到符合條件的英雄</p>';
      return;
    }

    const keyword = searchInput.value.trim().toLowerCase();
    const regex = keyword ? new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi") : null;
    const fragment = document.createDocumentFragment();

    data.forEach((hero) => {
      const card = document.createElement("div");
      card.className = "hero-summary-card"; // 使用新的簡化樣式類名
      
      const highlight = (text) => {
        if (!regex) return text;
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      card.innerHTML = `
        <div class="card-header">
          <span class="hero-name">${highlight(hero.name)}</span>
          <span class="hero-promotion">${hero.promotion}</span>
        </div>
        <div class="card-body">
          <p><strong>光輝：</strong>${highlight(hero.glory)}</p>
          <p><strong>個性：</strong>${hero.personality} | <strong>屬性：</strong>${hero.element}</p>
          <p><strong>素質：</strong>${hero.traits} | <strong>初始：</strong>${hero.initial}</p>
        </div>
        <div class="card-footer">
          <span>點擊查看詳細資訊 ▾</span>
        </div>
      `;

      card.addEventListener("click", () => showDetailModal(hero));
      fragment.appendChild(card);
    });
    heroesCardContainer.appendChild(fragment);
  }
  // === 4. 事件監聽 (搜尋、按鈕、排序) ===
  let searchDebounceTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(applyFilters, 250);
  });

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

  // === 5. Modal 詳細視窗 ===
  function showDetailModal(hero) {
    const safeName = hero.name.replace(/[^\w\u4e00-\u9fa5]/g, "");

    function createImageWithFallbacks(basePath, altText) {
      const img = document.createElement("img");
      img.alt = altText;
      // 改為相對路徑
      img.src = basePath + ".png";
      img.onerror = () => {
         const extensions = ['.bmp', '.jpg'];
         let attempt = 0;
         const tryNext = () => {
            if (attempt < extensions.length) {
                img.src = basePath + extensions[attempt];
                attempt++;
            } else {
                img.style.display = "none";
            }
         };
         img.onerror = tryNext;
         tryNext();
      };
      
      img.onload = () => {
        if (modalBox.style.display === "block") {
          modalBox.scrollTop = 0;
        }
      };
      return img;
    }

    modalBox.scrollTop = 0;
    modalContent.innerHTML = `<h2 class="hero-name" id="modal-title">${hero.name}</h2>`;

    const imgContainer = document.createElement("div");
    imgContainer.className = "hero-images";
    imgContainer.appendChild(
      createImageWithFallbacks(`../pic/heroes/${safeName}_正`, "正面"),
    );
    imgContainer.appendChild(
      createImageWithFallbacks(`../pic/heroes/${safeName}_反`, "反面"),
    );
    modalContent.appendChild(imgContainer);

    const detailHTML = `
      <div class="hero-details-container">
        <div class="hero-column-base hero-column">
          <p><strong>對應光輝：</strong>${hero.glory}</p>
          <p><strong>拜官：</strong>${hero.promotion}</p>
          <p><strong>初始：</strong>${hero.initial}</p>
          <p><strong>素質：</strong>${hero.traits}</p>
          <p><strong>個性：</strong>${hero.personality}</p>
          <p><strong>屬性：</strong>${hero.element}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid rgba(255,255,255,0.1);">
          <p><strong>力量：</strong>${hero.str}</p>
          <p><strong>智慧：</strong>${hero.int}</p>
          <p><strong>體質：</strong>${hero.vit}</p>
          <p><strong>敏捷：</strong>${hero.agi}</p>
          <p><strong>運氣：</strong>${hero.luk}</p>
        </div>
        <div class="hero-column-base hero-column">
          <p><strong>積極度(生變前)：</strong>${hero.aggression_before}</p>
          <p><strong>積極度(生變後)：</strong>${hero.aggression_after}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid rgba(255,255,255,0.1);">
          <p><strong>裝備卡(新專)：</strong>${hero.equipment_new}</p>
          <p><strong>新專數值：</strong>${hero.equipment_new_data}</p>
          <p><strong>新專倍率：</strong>${hero.new_multiplier}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid rgba(255,255,255,0.1);">
          <p><strong>裝備卡(舊專)：</strong>${hero.equipment_old}</p>
          <p><strong>舊專數值：</strong>${hero.equipment_old_data}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid rgba(255,255,255,0.1);">
          <p><strong>天生技：</strong>${hero.innate_skill}</p>
          <p><strong>生變技能：</strong>${hero.transformation_skill}</p>
        </div>
        <div class="hero-column-base hero-column-details">
          <p><strong>光輝掉落(掉落較多)：</strong>${hero.fall_high}</p>
          <p><strong>光輝掉落(掉落較低)：</strong>${hero.fall_low}</p>
          ${hero.player ? `<p><strong>光輝掉落(玩家提供)：</strong>${hero.player}</p>` : ""}
        </div>
        ${
          hero.playerdata
            ? `
      <div class="hero-playerdata">
        <p><strong>資訊提供：</strong>${hero.playerdata}</p>
      </div>
      `
            : ""
        }
      </div>
    `;
    modalContent.insertAdjacentHTML("beforeend", detailHTML);

    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    
    modalBox.scrollTop = 0;
    setTimeout(() => {
      modalBox.scrollTop = 0;
    }, 10);
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
    modalBox.scrollTop = 0;
  }

  closeModalBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  // Accordion
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.parentElement.classList.toggle("collapsed");
    });
  });
});
