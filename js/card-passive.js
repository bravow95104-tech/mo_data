document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/data/card.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 card.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data;
      const filteredData = data.filter(d => d.type === "被動技能卡");
      initCardTable(filteredData);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "<tr><td colspan='4'>無法載入資料</td></tr>";
    });

  // 回到頂部按鈕邏輯
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 初始化表格
  function initCardTable(data) {
    const searchInput = document.getElementById("searchInput");

    // === 檔名過濾：保留中文、數字、英文、底線、括號 ===
    function encodeFileName(name) {
      return name.replace(/[^\w\u4e00-\u9fa5()]/g, '');
    }

    // === Modal 顯示 ===
    function showDetailModal(item) {
      const overlay = document.getElementById('modalOverlay');
      const modalBox = document.getElementById('modalBox');
      const contentDiv = document.getElementById('modalContent');

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
      img.src = `/mo_data/pic/card-passive/${encodeFileName(item.card_id)}.png`;
      img.onerror = () => {

      };

      // 建立整體結構
      const html = `
        <div class="hero-details-container">
          <div class="hero-column">
            <h2 class="hero-name">${item.card_id}</h2>
          </div>
          <div class="hero-column" id="imgContainer"></div>
        </div>
      `;

      // 插入 HTML
      contentDiv.innerHTML = html;

      // 將圖片插入第二欄
      const imgContainer = contentDiv.querySelector("#imgContainer");
      if (imgContainer) imgContainer.appendChild(img);

      // 顯示 Modal
      overlay.style.display = 'block';
      modalBox.style.display = 'block';
    }

    // === 關閉 Modal ===
    function closeModal() {
      document.getElementById('modalOverlay').style.display = 'none';
      document.getElementById('modalBox').style.display = 'none';
    }

    const closeBtn = document.querySelector('#modalBox .close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.addEventListener('click', closeModal);

    // === 渲染表格 ===
    function renderTable(filteredData) {
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "";

      const keyword = searchInput.value.trim().toLowerCase();

      if (filteredData.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>找不到符合條件的技能卡</td></tr>";
        return;
      }

      filteredData.forEach(item => {
        const tr = document.createElement("tr");
        const fields = [
          item.card_id,
          item.card_lv,
          item.card_class,
          item.directions,
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

        // 點擊列開啟 Modal
        tr.addEventListener("click", () => {
          showDetailModal(item);
        });

        tbody.appendChild(tr);
      });
    }

    // === 搜尋事件 ===
    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.trim().toLowerCase();
      const filtered = data.filter(item =>
        !keyword ||
        (item.card_id && item.card_id.toLowerCase().includes(keyword)) ||
        (item.card_class && item.card_class.toLowerCase().includes(keyword)) ||
        (item.directions && item.directions.toLowerCase().includes(keyword))
      );
      renderTable(filtered);
    });

    // === 清除搜尋（若有按鈕） ===
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderTable(data);
      });
    }

    // === 初始載入全部資料 ===
    renderTable(data);
  }
});
