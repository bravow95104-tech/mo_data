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
    const searchName = document.getElementById("searchInput1"); // 名稱搜尋框
    const clearFiltersBtn = document.getElementById("clearFilters");

    // 填充 datalist 選項
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

    // 渲染表格內容（包含高亮顯示）
    function renderTable(filteredData) {
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "";

      if (filteredData.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>找不到符合條件的靈具卡</td></tr>";
        return;
      }

      filteredData.forEach(item => {
        const tr = document.createElement("tr");

        const fields = [
          item.card_id,           // 名稱
          item.card_lv,           // 等級
          item.property_first,    // 第一屬性
          item.property_second,   // 第二屬性
          item.property_third,    // 第三屬性
          item.drop,   // 掉落
        ];

        fields.forEach((value, index) => {
          const td = document.createElement("td");
          let text = String(value || "");
          let keyword = "";

          // 🔍 對應不同欄位的搜尋框
          if (index === 0) keyword = searchName.value.trim();
          else if (index === 2) keyword = searchFirst.value.trim();
          else if (index === 3) keyword = searchSecond.value.trim();
          else if (index === 4) keyword = searchThird.value.trim();

          // ✅ 有輸入關鍵字時高亮顯示
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

    // 篩選邏輯
    function applyFilters() {
      const keywordFirst = searchFirst.value.trim().toLowerCase();
      const keywordSecond = searchSecond.value.trim().toLowerCase();
      const keywordThird = searchThird.value.trim().toLowerCase();
      const keywordName = searchName.value.trim().toLowerCase();

      const filtered = data.filter(item => {
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

      renderTable(filtered);
    }

    // 綁定輸入事件
    [searchFirst, searchSecond, searchThird, searchName].forEach(input => {
      input.addEventListener("input", applyFilters);
    });

    // 清除篩選按鈕
    clearFiltersBtn.addEventListener("click", () => {
      searchFirst.value = "";
      searchSecond.value = "";
      searchThird.value = "";
      searchName.value = "";
      applyFilters();
    });

    // 初始化
    populateDatalists(data);
    renderTable(data);
  }

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

    contentDiv.innerHTML = "";

    // 1. 圖片處理 (與原代碼相同)
    const img = document.createElement("img");
    img.className = "hero-image";
    img.alt = item.card_id || "card-image";
    img.src = `/mo_data/pic/card-spirit/${encodeFileName(item.card_id)}.png`;
    // 這裡可以選擇不處理 onerror，讓圖片不存在時留白，或者加上一個預設圖
    img.onerror = () => { img.style.display = 'none'; }; 


 // 2. 🚀 新增內容區塊 HTML
 const html = `
 <div class="hero-details-container">
 <div class="hero-column details-text-column">
 <h2 class="hero-name">${item.card_id || "卡片名稱"}</h2>
                
                <p class="detail-line"><strong>等級：</strong> <span class="value">${item.card_lv || "N/A"}</span></p>

                <div class="property-section">
                    <h3>【卡片屬性】</h3>
                    <p><strong>屬性一：</strong> <span class="value">${item.property_first || "N/A"}</span></p>
                    <p><strong>屬性二：</strong> <span class="value">${item.property_second || "N/A"}</span></p>
                    <p><strong>屬性三：</strong> <span class="value">${item.property_third || "N/A"}</span></p>
                </div>
                
                <div class="drop-section">
                    <h3>【掉落來源】</h3>
                    <p class="pre-formatted-text">${item.drop || "N/A"}</p>
                </div>

 </div>
 
 <div class="hero-column image-column" id="imgContainer">
 </div>
 </div>
 `;

 contentDiv.innerHTML = html;

        const imgContainer = contentDiv.querySelector("#imgContainer");
        if (imgContainer) imgContainer.appendChild(img);

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
});
