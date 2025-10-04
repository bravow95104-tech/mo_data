document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/data/equip-combo.json") // ← 如果放 GitHub，可改成 /mo_data/json/equip-combo.json
    .then(res => {
      if (!res.ok) throw new Error("載入 equip-combo.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data; // 處理外層包 data
      initComboPage(data);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const comboList = document.getElementById("comboList");
      if (comboList)
        comboList.innerHTML =
          "<p style='color:red;text-align:center;'>無法載入資料</p>";
    });
});

function initComboPage(data) {
  const comboList = document.getElementById("comboList");
  const searchInput = document.getElementById("searchInput");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const clearBtn = document.getElementById("clearFilters");

  let activeFilters = [];

  function renderList() {
    const searchText = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(item => {
      const skill = (item.skillName || "").toLowerCase();
      const job = (item.class || "").toLowerCase();
      const skillType = (item.classSkill || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();

      const matchSearch =
        searchText === "" ||
        skill.includes(searchText) ||
        job.includes(searchText) ||
        skillType.includes(searchText) ||
        cat.includes(searchText);

      const matchFilter =
        activeFilters.length === 0 ||
        activeFilters.some(f => job.includes(f));

      return matchSearch && matchFilter;
    });

    comboList.innerHTML = "";

    if (filtered.length === 0) {
      comboList.innerHTML =
        `<p style="text-align:center;color:#777;">查無符合條件的資料</p>`;
      return;
    }

    // === 卡片渲染 ===
    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "combo-card";
      card.innerHTML = `
        <div class="combo-header">
          <div class="combo-title">${item.skillName || "—"}</div>
          <div class="combo-sub">${item.classSkill || "—"}</div>
        </div>
        <hr>
        <div class="combo-details">
          <p><strong>職業：</strong>${item.class || "—"}</p>
          <p><strong>裝備部位：</strong>${item.equipmentType || "—"}</p>
          <p><strong>文片組合：</strong>${item.combinationMethod || "—"}</p>
          <p><strong>說明：</strong>${item.description || "—"}</p>
        </div>
      `;
      comboList.appendChild(card);
    });
  }

  // === 搜尋事件 ===
  searchInput.addEventListener("input", renderList);

  // === 篩選事件 ===
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

  // === 清除篩選 ===
  clearBtn.addEventListener("click", () => {
    activeFilters = [];
    filterBtns.forEach(b => b.classList.remove("active"));
    searchInput.value = "";
    renderList();
  });

  renderList();
}
