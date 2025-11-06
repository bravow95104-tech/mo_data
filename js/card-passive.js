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

        tbody.appendChild(tr);
      });
    }

    // 即時搜尋
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

    // 清除搜尋（若有清除按鈕）
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderTable(data);
      });
    }

    // 初始載入全部資料
    renderTable(data);
  }
});
