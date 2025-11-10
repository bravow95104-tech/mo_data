document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/data/equip-combo.json") // 相對路徑
    .then(res => {
      if (!res.ok) throw new Error("載入 equip-combo.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data; // ✅ 處理包外層 data
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

  let activeFilters = { promotion: [], commonly: [], category: [], equipmentType1: [], equipmentType2: [] };

  function renderList() {
    const searchText = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(item => {
      const skill = (item.skillName || "").toLowerCase();
      const job = (item.class || "").toLowerCase();
      const skillType = (item.classSkill || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const equipmentType1 = (item.equipmentType1 || "").toLowerCase();
      const equipmentType2 = (item.equipmentType2 || "").toLowerCase();
// 搜尋文字條件
      const matchSearch =
        searchText === "" ||
        skill.includes(searchText) ||
        job.includes(searchText) ||
        skillType.includes(searchText) ||
        cat.includes(searchText) ||
        equipmentType1.includes(searchText) ||
        equipmentType2.includes(searchText);
// 職業篩選
const matchFilter =
  activeFilters.promotion.length === 0 ||
  activeFilters.promotion.some(f => job.includes(f) || job.includes("全職業"));

    // category 篩選
    const matchCategory =
      activeFilters.category.length === 0 ||
      activeFilters.category.some(f => cat.includes(f.toLowerCase()));

       // category 篩選
    const equipmenttype1 =
      activeFilters.equipmenttype1.length === 0 ||
      activeFilters.equipmenttype1.some(f => equipmenttype1.includes(f.toLowerCase()));

// commonly 篩選
const matchCommonly =
  activeFilters.commonly.length === 0 ||
  (activeFilters.commonly.some(f => f.toLowerCase() === "true") &&
   String(item.commonly).toLowerCase() === "true");

      return matchSearch && matchFilter && matchCommonly && matchCategory && equipmenttype1;
    });

    comboList.innerHTML = "";

    if (filtered.length === 0) {
      comboList.innerHTML =
        `<p style="text-align:center;color:#777;">查無符合條件的資料</p>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "combo-card active"; // 預設展開
      card.innerHTML = `
        <div class="combo-title">${item.skillName || "—"}</div>
        <div class="combo-category"><strong>職業技能：</strong>${item.classSkill || "—"}</div>
        <div class="combo-details">
          <p><strong>職業：</strong>${item.class || "—"}</p>
          <p><strong>裝備部位：</strong>${item.equipmentType1 || "—"} - ${item.equipmentType2 || "—"}</p>
          <p><strong>文片組合：</strong>${item.combinationMethod || "—"}</p>
          <p><strong>說明：</strong>${item.description || "—"}</p>
        </div>
      `;
      comboList.appendChild(card);
    });
  }

  searchInput.addEventListener("input", renderList);

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;   // 取得 data-type
    const value = btn.dataset.value;

    btn.classList.toggle("active");

    if (btn.classList.contains("active")) {
      activeFilters[type].push(value);
    } else {
      activeFilters[type] = activeFilters[type].filter(f => f !== value);
    }
    renderList();
  });
});
//清除篩選
clearBtn.addEventListener("click", () => {
  activeFilters = { promotion: [], commonly: [], category: [] };
  filterBtns.forEach(btn => btn.classList.remove("active"));
  searchInput.value = "";
  console.log("清除篩選", activeFilters);
  renderList();
});


  renderList();
}

    // Accordion 展開／收合
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const accordion = header.parentElement;
    accordion.classList.toggle('collapsed');
  });
});