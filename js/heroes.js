import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let gloryDropsData = []; // 儲存地點掉落資料
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

  // === 1. 載入資料 (改為從 Supabase 讀取) ===
  async function loadDataFromSupabase() {
    try {
      // 同時抓取英雄與地點資料
      const [heroesRes, dropsRes] = await Promise.all([
        supabase.from('heroes').select('*').order('sort_id', { ascending: true }),
        supabase.from('glory_drop').select('*')
      ]);

      if (heroesRes.error) throw heroesRes.error;
      if (dropsRes.error) throw dropsRes.error;

      heroesData = heroesRes.data;
      gloryDropsData = dropsRes.data;
      applyFilters(); // 初始渲染
      
      // === 🚀 跨頁面深度連結處理 ===
      const urlParams = new URLSearchParams(window.location.search);
      const heroName = urlParams.get('hero');
      if (heroName) {
        // 在所有資料中尋找匹配的英雄
        const targetHero = heroesData.find(h => h.name === heroName);
        if (targetHero) {
          // 稍微延遲確保 DOM 渲染完成再開啟 Modal
          setTimeout(() => {
            showDetailModal(targetHero);
          }, 100);
        }
      }
    } catch (error) {
      console.error("載入英雄資料錯誤:", error);
      if (tableBody)
        tableBody.innerHTML = '<tr><td colspan="15">無法載入雲端資料</td></tr>';
    }
  }

  loadDataFromSupabase();

  // 輔助函式：確保顯示時不會出現 null 或 undefined
  const clean = (val) => (val === null || val === undefined) ? "" : val;

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
    if (resizeFlag) {
      heroesTableContainer.style.display = "none";
      heroesCardContainer.style.display = "flex";
      renderCard(lastFilteredData);
    } else {
      heroesTableContainer.style.display = "block";
      heroesCardContainer.style.display = "none";
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
    data.forEach((hero) => {
      const tr = document.createElement("tr");
      const fields = [
        "name",
        "glory",
        "promotion",
        "initial",
        "traits",
        "personality",
        "element",
        "str",
        "int",
        "vit",
        "agi",
        "luk",
        "aggression_before",
        "equipment_new",
        "equipment_old",
      ];

      fields.forEach((field) => {
        const td = document.createElement("td");
        // 如果值是 null 或 undefined，改為顯示空字串
        const rawValue = hero[field];
        const value = (rawValue === null || rawValue === undefined) ? "" : String(rawValue);

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

      tr.addEventListener("click", () => showDetailModal(hero));
      fragment.appendChild(tr);
    });
    tableBody.appendChild(fragment);
  }

  function renderCard(data) {
    const fragment = document.createDocumentFragment();
    heroesCardContainer.innerHTML = "";

    data.forEach((hero) => {
      const div = document.createElement("div");
      div.className = "accordion";
      const safeName = hero.name.replace(/[^\w\u4e00-\u9fa5]/g, "");

      function createImageWithFallbacks(basePath, altText) {
        const img = document.createElement("img");
        img.alt = altText;
        img.src = basePath + ".png";
        img.onerror = () => (img.style.display = "none"); // Keep this for fallback
        return img;
      }

      div.innerHTML = `<h2 class="hero-name" id="modal-title">${clean(hero.name)}</h2>`;

      const imgContainer = document.createElement("div");
      imgContainer.className = "hero-images hero-card-images";
      imgContainer.appendChild(
        createImageWithFallbacks(`/mo_data/pic/heroes/${safeName}_正`, "正面"),
      );
      imgContainer.appendChild(
        createImageWithFallbacks(`/mo_data/pic/heroes/${safeName}_反`, "反面"),
      );
      div.appendChild(imgContainer);

      // 輔助函式：根據英雄的光輝動態查找地點
      function getLocationsForGlory(gloryName) {
        if (!gloryName) return "無資訊";
        
        // 找出哪些 Area 的 more 包含這個光輝
        const highLocations = gloryDropsData
          .filter(d => d.more && d.more.split('、').includes(gloryName))
          .map(d => d.area);
          
        // 找出哪些 Area 的 low 包含這個光輝
        const lowLocations = gloryDropsData
          .filter(d => d.low && d.low.split('、').includes(gloryName))
          .map(d => d.area);

        return {
          high: highLocations.length > 0 ? highLocations.join('、') : "無資訊",
          low: lowLocations.length > 0 ? lowLocations.join('、') : "無資訊"
        };
      }

      const locations = getLocationsForGlory(hero.glory);

      const detailHTML = `
      <div class="hero-details-container">
        <div class="hero-column-base hero-column">
          <p><strong>對應光輝：</strong>${clean(hero.glory)}</p>
          <p><strong>拜官：</strong>${clean(hero.promotion)}</p>
          <p><strong>初始：</strong>${clean(hero.initial)}</p>
          <p><strong>素質：</strong>${clean(hero.traits)}</p>
          <p><strong>個性：</strong>${clean(hero.personality)}</p>
          <p><strong>屬性：</strong>${clean(hero.element)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>力量：</strong>${clean(hero.str)}</p>
          <p><strong>智慧：</strong>${clean(hero.int)}</p>
          <p><strong>體質：</strong>${clean(hero.vit)}</p>
          <p><strong>敏捷：</strong>${clean(hero.agi)}</p>
          <p><strong>運氣：</strong>${clean(hero.luk)}</p>
        </div>
        <div class="hero-column-base hero-column">
          <p><strong>積極度(生變前)：</strong>${clean(hero.aggression_before)}</p>
          <p><strong>積極度(生變後)：</strong>${clean(hero.aggression_after)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>裝備卡(新專)：</strong>${clean(hero.equipment_new)}</p>
          <p><strong>新專數值：</strong>${clean(hero.equipment_new_data)}</p>
          <p><strong>新專倍率：</strong>${clean(hero.new_multiplier)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>裝備卡(舊專)：</strong>${clean(hero.equipment_old)}</p>
          <p><strong>舊專數值：</strong>${clean(hero.equipment_old_data)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>天生技：</strong>${clean(hero.innate_skill)}</p>
          <p><strong>生變技能：</strong>${clean(hero.transformation_skill)}</p>
        </div>
        <div class="hero-column-base hero-column-details">
          <p><strong>光輝掉落(掉落較多)：</strong>${locations.high}</p>
          <p><strong>光輝掉落(掉落較低)：</strong>${locations.low}</p>
          ${hero.player ? `<p><strong>光輝掉落(玩家提供)：</strong>${clean(hero.player)}</p>` : ""}
        </div>
        ${
          hero.playerdata
            ? `
      <div class="hero-playerdata">
        <p><strong>資訊提供：</strong>${clean(hero.playerdata)}</p>
      </div>
      `
            : ""
        }
      </div>
    `;
      div.insertAdjacentHTML("beforeend", detailHTML);

      fragment.appendChild(div);
    });
    heroesCardContainer.appendChild(fragment);
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

  // === 5. Modal 詳細視窗 ===
  function showDetailModal(hero) {
    const safeName = hero.name.replace(/[^\w\u4e00-\u9fa5]/g, "");

    function createImageWithFallbacks(basePath, altText) {
      const img = document.createElement("img");
      img.alt = altText;
      img.src = basePath + ".png";
      img.onerror = () => (img.style.display = "none"); // Keep this for fallback
      // ✅ 圖片載入後再次確保置頂
      img.onload = () => {
        if (modalBox.style.display === "block") {
          modalBox.scrollTop = 0;
        }
      };
      return img;
    }

    // 輔助函式：動態查找地點 (複用渲染卡片的邏輯)
    function getLocationsForGlory(gloryName) {
      if (!gloryName) return { high: "無資訊", low: "無資訊" };
      const high = gloryDropsData.filter(d => d.more && d.more.split('、').includes(gloryName)).map(d => d.area);
      const low = gloryDropsData.filter(d => d.low && d.low.split('、').includes(gloryName)).map(d => d.area);
      return {
        high: high.length > 0 ? high.join('、') : "無資訊",
        low: low.length > 0 ? low.join('、') : "無資訊"
      };
    }

    const locations = getLocationsForGlory(hero.glory);

    // ✅ 打開前先清空內容並強制歸零
    modalBox.scrollTop = 0;
    modalContent.innerHTML = `<h2 class="hero-name" id="modal-title">${clean(hero.name)}</h2>`;

    const imgContainer = document.createElement("div");
    imgContainer.className = "hero-images";
    imgContainer.appendChild(
      createImageWithFallbacks(`/mo_data/pic/heroes/${safeName}_正`, "正面"),
    );
    imgContainer.appendChild(
      createImageWithFallbacks(`/mo_data/pic/heroes/${safeName}_反`, "反面"),
    );
    modalContent.appendChild(imgContainer);

    const detailHTML = `
      <div class="hero-details-container">
        <div class="hero-column-base hero-column">
          <p><strong>對應光輝：</strong>${clean(hero.glory)}</p>
          <p><strong>拜官：</strong>${clean(hero.promotion)}</p>
          <p><strong>初始：</strong>${clean(hero.initial)}</p>
          <p><strong>素質：</strong>${clean(hero.traits)}</p>
          <p><strong>個性：</strong>${clean(hero.personality)}</p>
          <p><strong>屬性：</strong>${clean(hero.element)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>力量：</strong>${clean(hero.str)}</p>
          <p><strong>智慧：</strong>${clean(hero.int)}</p>
          <p><strong>體質：</strong>${clean(hero.vit)}</p>
          <p><strong>敏捷：</strong>${clean(hero.agi)}</p>
          <p><strong>運氣：</strong>${clean(hero.luk)}</p>
        </div>
        <div class="hero-column-base hero-column">
          <p><strong>積極度(生變前)：</strong>${clean(hero.aggression_before)}</p>
          <p><strong>積極度(生變後)：</strong>${clean(hero.aggression_after)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>裝備卡(新專)：</strong>${clean(hero.equipment_new)}</p>
          <p><strong>新專數值：</strong>${clean(hero.equipment_new_data)}</p>
          <p><strong>新專倍率：</strong>${clean(hero.new_multiplier)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>裝備卡(舊專)：</strong>${clean(hero.equipment_old)}</p>
          <p><strong>舊專數值：</strong>${clean(hero.equipment_old_data)}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p><strong>天生技：</strong>${clean(hero.innate_skill)}</p>
          <p><strong>生變技能：</strong>${clean(hero.transformation_skill)}</p>
        </div>
        <div class="hero-column-base hero-column-details">
          <p><strong>光輝掉落(掉落較多)：</strong>${locations.high}</p>
          <p><strong>光輝掉落(掉落較低)：</strong>${locations.low}</p>
          ${hero.player ? `<p><strong>光輝掉落(玩家提供)：</strong>${clean(hero.player)}</p>` : ""}
        </div>
        ${
          hero.playerdata
            ? `
      <div class="hero-playerdata">
        <p><strong>資訊提供：</strong>${clean(hero.playerdata)}</p>
      </div>
      `
            : ""
        }
      </div>
    `;
    modalContent.insertAdjacentHTML("beforeend", detailHTML);

    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    
    // ✅ 強制歸零
    modalBox.scrollTop = 0;
    
    // ✅ 雙重保險：稍微延遲再歸零一次，對付瀏覽器的自動捲動恢復
    setTimeout(() => {
      modalBox.scrollTop = 0;
    }, 10);
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
    // ✅ 關鍵：關閉時就歸零，防止「記憶」殘留
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
