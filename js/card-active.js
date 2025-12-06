document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/data/card.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 card.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data;
      const filteredData = data.filter(d => d.type === "主動技能卡");
      initCardTable(filteredData);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "<tr><td colspan='6'>無法載入資料</td></tr>";
    });


  // Accordion 展開／收合
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const accordion = header.parentElement;
      accordion.classList.toggle("collapsed");
    });
  });

  // 初始化表格邏輯
  function initCardTable(data) {
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearFilters");
    const filterBtns = document.querySelectorAll(".filter-btn");

    let activeFilters = { card_class: [] };

    // === 渲染表格 ===
    function renderTable(filteredData) {
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "";

      const keyword = searchInput.value.trim().toLowerCase();

      if (filteredData.length === 0) {
        tbody.innerHTML =
          "<tr><td colspan='6'>找不到符合條件的技能卡</td></tr>";
        return;
      }

      filteredData.forEach(item => {
        const tr = document.createElement("tr");
        const fields = [
          item.card_id,
          item.card_lv,
          item.card_property,
          item.card_class,
          item.card_mp,
          item.directions
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

    // === 篩選邏輯 ===
    function applyFilters() {
      const keyword = searchInput.value.trim().toLowerCase();

      const filtered = data.filter(item => {
        const matchSearch =
          !keyword ||
          (item.card_id && item.card_id.toLowerCase().includes(keyword)) ||
          (item.card_class && item.card_class.toLowerCase().includes(keyword)) ||
          (item.directions && item.directions.toLowerCase().includes(keyword));

        const matchCardClass =
          activeFilters.card_class.length === 0 ||
          activeFilters.card_class.includes(item.card_class);

        return matchSearch && matchCardClass;
      });

      renderTable(filtered);
    }

    // === 綁定按鈕 ===
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
      activeFilters = { card_class: [] };
      filterBtns.forEach(b => b.classList.remove("active"));
      searchInput.value = "";
      applyFilters();
    });

    // === 即時搜尋 ===
    searchInput.addEventListener("input", applyFilters);

    // === 初始渲染 ===
    renderTable(data);
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

    // 建立圖片元素
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id || "card-image";
    img.src = `/mo_data/pic/card-active/${encodeFileName(item.card_id)}.png`;
    img.onerror = () => {
    };

    // 建立內容
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
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.addEventListener("click", closeModal);
});
