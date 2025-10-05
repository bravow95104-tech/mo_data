document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/data/card-equip.json")
  .then(res => res.json())
  .then(data => {
    // ✅ 只取出 type === "裝備卡" 的資料
    const equipCards = data.filter(item => item.type === "裝備卡");
    initCardEquipTable(equipCards); // 傳給後續渲染函數
  })
  .catch(err => {
    console.error("資料載入失敗", err);
  });

});

function initCardEquipTable(data) {
  const tableBody = document.querySelector("#card-equip-table tbody");
  const searchInput = document.getElementById("searchInput");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const clearBtn = document.getElementById("clearFilters");

  let activeFilters = {
    card_property: [],
    nemultiplier: [],
    new_old: []
  };

  function renderTable() {
    const searchText = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(item => {
      const name = (item.card_id || "").toLowerCase();
      const hero = (item.hero_name || "").toLowerCase();
      const property = item.card_property || "";
      const multiplier = item.nemultiplier || "";
      const newOld = item.new_old || "";

      // 搜尋文字
      const matchSearch = !searchText || name.includes(searchText) || hero.includes(searchText);

      // 篩選屬性
      const matchProperty = activeFilters.card_property.length === 0 ||
        activeFilters.card_property.includes(property);

      // 篩選倍率
      const matchMultiplier = activeFilters.nemultiplier.length === 0 ||
        activeFilters.nemultiplier.includes(multiplier);

      // 新舊專
      const matchNewOld = activeFilters.new_old.length === 0 ||
        activeFilters.new_old.includes(newOld);

      return matchSearch && matchProperty && matchMultiplier && matchNewOld;
    });

    // 清空表格
    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #777;">找不到符合條件的資料</td></tr>`;
      return;
    }

    // 生成表格資料
    filtered.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.card_id || "—"}</td>
        <td>${item.card_lv || "—"}</td>
        <td>${item.card_property || "—"}</td>
        <td>${item.card_data || "—"}</td>
        <td>${item.nemultiplier || "—"}</td>
        <td>${item.hero_name || "—"}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // 搜尋文字事件
  searchInput.addEventListener("input", renderTable);

  // 篩選按鈕事件
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      btn.classList.toggle("active");

      if (!activeFilters[type]) {
        activeFilters[type] = [];
      }

      if (btn.classList.contains("active")) {
        activeFilters[type].push(value);
      } else {
        activeFilters[type] = activeFilters[type].filter(v => v !== value);
      }

      renderTable();
    });
  });

  // 清除篩選
  clearBtn.addEventListener("click", () => {
    activeFilters = {
      card_property: [],
      nemultiplier: [],
      new_old: []
    };

    searchInput.value = "";
    filterBtns.forEach(b => b.classList.remove("active"));
    renderTable();
  });

  renderTable();
}