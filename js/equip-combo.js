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

  let activeFilters = [];

  function renderList() {
    const searchText = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(item => {
      const skill = (item.skillName || "").toLowerCase();
      const job = (item.class || "").toLowerCase();
      const skillType = (item.classSkill || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const equipmentType = (item.equipmentType || "").toLowerCase();
// 搜尋文字條件
      const matchSearch =
        searchText === "" ||
        skill.includes(searchText) ||
        job.includes(searchText) ||
        skillType.includes(searchText) ||
        cat.includes(searchText);
        equipmentType.includes(searchText);
// 職業篩選
const matchFilter =
  activeFilters.length === 0 ||
  activeFilters.some(f => job.includes(f) || job.includes("全職業"));
// 常用篩選
    const matchCommonly =
      activeFilters.commonly.length === 0 ||
      (activeFilters.commonly.includes("true") && item.commonly === "true");

      return matchSearch && matchFilter && matchCommonly;
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
          <p><strong>裝備部位：</strong>${item.equipmentType || "—"}</p>
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

  clearBtn.addEventListener("click", () => {
    activeFilters = [];
    filterBtns.forEach(b => b.classList.remove("active"));
    searchInput.value = "";
    renderList();
  });

  renderList();
}
  // 回到頂部按鈕邏輯
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
    // Accordion 展開／收合
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const accordion = header.parentElement;
    accordion.classList.toggle('collapsed');
  });
});