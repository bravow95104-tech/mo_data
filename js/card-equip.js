document.addEventListener("DOMContentLoaded", () => {
  fetch("/mo_data/data/card.json")
    .then(res => {
      if (!res.ok) throw new Error("載入 card-equip.json 失敗");
      return res.json();
    })
    .then(json => {
      const data = Array.isArray(json) ? json : json.data;
      const filteredData = data.filter(d => d.type === "裝備卡");
      initCardTable(filteredData);
    })
    .catch(err => {
      console.error("❌ JSON 載入失敗：", err);
      const tbody = document.querySelector("#card-equip-table tbody");
      tbody.innerHTML = "<tr><td colspan='6'>無法載入資料</td></tr>";
    });
});

function initCardTable(data) {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearFilters");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeFilters = {
    card_property: [],
    nemultiplier: [],
    new_old: [],
  };

  function renderTable(filteredData) {
    const tbody = document.querySelector("#card-equip-table tbody");
    tbody.innerHTML = "";

    const keyword = searchInput.value.trim().toLowerCase();

    if (filteredData.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>找不到符合條件的裝備卡</td></tr>";
      return;
    }

    filteredData.forEach(item => {
      const tr = document.createElement("tr");

      const fields = [
        item.card_id,
        item.card_lv,
        item.card_property,
        item.card_data,
        item.nemultiplier,
        item.hero_name,
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

      tr.addEventListener("click", () => {
        showDetailModal(item);
      });

      tbody.appendChild(tr);
    });
  }

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(item => {
      const matchSearch =
        keyword === "" ||
        String(item.card_id || "").toLowerCase().includes(keyword) ||
        String(item.hero_name || "").toLowerCase().includes(keyword) ||
        String(item.card_property || "").toLowerCase().includes(keyword);

      const matchProperty =
        activeFilters.card_property.length === 0 ||
        activeFilters.card_property.includes(item.card_property);

      const matchMultiplier =
        activeFilters.nemultiplier.length === 0 ||
        activeFilters.nemultiplier.includes(item.nemultiplier);

      const matchNewOld =
        activeFilters.new_old.length === 0 ||
        activeFilters.new_old.includes(item.new_old);

      return matchSearch && matchProperty && matchMultiplier && matchNewOld;
    });

    renderTable(filtered);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      btn.classList.toggle("active");

      if (btn.classList.contains("active")) {
        activeFilters[type].push(value);
      } else {
        activeFilters[type] = activeFilters[type].filter(f => f !== value);
      }

      applyFilters();
    });
  });

  clearBtn.addEventListener("click", () => {
    activeFilters = {
      card_property: [],
      nemultiplier: [],
      new_old: [],
    };
    filterBtns.forEach(b => b.classList.remove("active"));
    searchInput.value = "";
    applyFilters();
  });

  searchInput.addEventListener("input", applyFilters);

  renderTable(data);
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

  // Accordion 展開／收合
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const accordion = header.parentElement;
    accordion.classList.toggle('collapsed');
  });
});
  // 回到頂部按鈕邏輯
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });