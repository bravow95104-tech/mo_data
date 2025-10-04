document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/json/equip-combo.json") // ← 改成你的 JSON 檔名
    .then(res => res.json())
    .then(data => initComboPage(data));
});

function initComboPage(data) {
  const comboList = document.createElement("div");
  comboList.id = "comboList";
  comboList.classList.add("combo-list");
  document.body.insertBefore(comboList, document.getElementById("backToTop"));

  const searchInput = document.getElementById("searchInput");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const clearBtn = document.getElementById("clearFilters");

  let activeFilters = [];

  function renderList() {
    const searchText = searchInput.value.toLowerCase();

    const filtered = data.filter(item => {
      const matchSearch =
        item.skillName.toLowerCase().includes(searchText) ||
        item.class.toLowerCase().includes(searchText) ||
        item.category.toLowerCase().includes(searchText) ||
        item.equipmentType.toLowerCase().includes(searchText);

      const matchFilter =
        activeFilters.length === 0 ||
        activeFilters.some(f => item.class.includes(f));

      return matchSearch && matchFilter;
    });

    comboList.innerHTML = "";

    if (filtered.length === 0) {
      comboList.innerHTML = "<p>找不到符合條件的資料。</p>";
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "combo-card";
      card.innerHTML = `
        <div class="combo-title">${item.skillName}</div>
        <div class="combo-category">${item.category}</div>
        <div class="combo-details">
          <p><strong>職業：</strong>${item.class}</p>
          <p><strong>職業技能：</strong>${item.classSkill}</p>
          <p><strong>裝備類型：</strong>${item.equipmentType}</p>
          <p><strong>組合方式：</strong>${item.combinationMethod}</p>
          <p><strong>描述：</strong>${item.description || "—"}</p>
        </div>
      `;
      card.addEventListener("click", () =>
        card.classList.toggle("active")
      );
      comboList.appendChild(card);
    });
  }

  // 🔍 即時搜尋
  searchInput.addEventListener("input", renderList);

  // ⚡ 多條件篩選
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.value;
      btn.classList.toggle("active");

      if (btn.classList.contains("active")) {
        activeFilters.push(value);
      } else {
        activeFilters = activeFilters.filter(f => f !== value);
      }
      renderList();
    });
  });

  // ❌ 清除篩選
  clearBtn.addEventListener("click", () => {
    activeFilters = [];
    filterBtns.forEach(b => b.classList.remove("active"));
    renderList();
  });

  renderList();
}
