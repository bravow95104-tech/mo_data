document.addEventListener("DOMContentLoaded", () => {
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

  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function initCardTable(data) {
    const searchFirst = document.getElementById("searchFirst");
    const searchSecond = document.getElementById("searchSecond");
    const searchThird = document.getElementById("searchThird");

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
          const keyword = [searchFirst.value, searchSecond.value, searchThird.value][index - 2]; // index 2~4 對應屬性
          if (index >= 2 && keyword) {
            const regex = new RegExp(`(${keyword})`, "gi");
            td.innerHTML = text.replace(regex, "<span class='highlight2'>$1</span>");
          } else {
            td.textContent = text;
          }
          tr.appendChild(td);
        });

        tr.addEventListener("click", () => {
          showDetailModal?.(item);
        });

        tbody.appendChild(tr);
      });
    }

    function applyFilters() {
      const keywordFirst = searchFirst.value.trim().toLowerCase();
      const keywordSecond = searchSecond.value.trim().toLowerCase();
      const keywordThird = searchThird.value.trim().toLowerCase();

      const filtered = data.filter(item => {
        const matchFirst = !keywordFirst || (item.property_first || "").toLowerCase().includes(keywordFirst);
        const matchSecond = !keywordSecond || (  (item.property_second || "").toLowerCase().includes(keywordSecond) ||  (item.property_second || "").includes("隨機"));
        const matchThird = !keywordThird || (  (item.property_third || "").toLowerCase().includes(keywordThird) ||  (item.property_third || "").includes("隨機"));

        return matchFirst && matchSecond && matchThird;
      });

      renderTable(filtered);
    }

    [searchFirst, searchSecond, searchThird].forEach(input => {
      input.addEventListener("input", applyFilters);
    });

    renderTable(data);
  }
});
