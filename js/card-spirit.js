document.addEventListener("DOMContentLoaded", () => {
  // 載入 JSON 資料
  fetch("/mo_data/data/card.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 card.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data;
      const filteredData = data.filter(d => d.type === "靈具卡");
      initCardTable(filteredData);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "<tr><td colspan='5'>無法載入資料</td></tr>";
    });

  // 初始化表格與搜尋功能
  function initCardTable(data) {
    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");
    const clearFiltersBtn = document.getElementById("clearFilters");

    // 填充 datalist 選項，並拆開「、」拆字串去重
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

    // 渲染表格內容
    function renderTable(filteredData) {
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "";

      if (filteredData.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>找不到符合條件的靈具卡</td></tr>";
        return;
      }

      filteredData.forEach(item => {
        const tr = document.createElement("tr");

        const fields = [
          item.card_id,
          item.card_lv,
          item.property_first,
          item.property_second,
          item.property_third,
        ];

        fields.forEach((value, index) => {
          const td = document.createElement("td");
          let text = String(value || "");
          const keyword = [searchFirst.value, searchSecond.value, searchThird.value][index - 2];
          if (index >= 2 && keyword) {
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

    // 篩選邏輯
    function applyFilters() {
      const keywordFirst = searchFirst.value.trim().toLowerCase();
      const keywordSecond = searchSecond.value.trim().toLowerCase();
      const keywordThird = searchThird.value.trim().toLowerCase();

      const filtered = data.filter(item => {
        const matchFirst = !keywordFirst || (item.property_first || "").toLowerCase().includes(keywordFirst);
        const matchSecond = !keywordSecond ||
          (item.property_second || "").toLowerCase().includes(keywordSecond) ||
          (item.property_second || "").toLowerCase().includes("隨機");
        const matchThird = !keywordThird ||
          (item.property_third || "").toLowerCase().includes(keywordThird) ||
          (item.property_third || "").toLowerCase().includes("隨機");

        return matchFirst && matchSecond && matchThird;
      });

      renderTable(filtered);
    }

    // 綁定輸入事件：輸入或選擇時篩選
    [searchFirst, searchSecond, searchThird].forEach(input => {
      input.addEventListener("input", applyFilters);
    });

    // 清除篩選按鈕事件
    clearFiltersBtn.addEventListener("click", () => {
      searchFirst.value = "";
      searchSecond.value = "";
      searchThird.value = "";
      applyFilters();
    });

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
  img.src = `/mo_data/pic/card-spirit/${encodeFileName(item.card_id)}.png`;
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
  closeBtn.addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);

    // 初始化選單與表格
    populateDatalists(data);
    renderTable(data);
  }
});
