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
      tbody.innerHTML = "<tr><td colspan='6'>找不到符合條件的技能卡</td></tr>";
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
  // === Modal ===
  function showDetailModal(hero) {
    const overlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const contentDiv = document.getElementById('modalContent');

    // 英雄名稱安全化（移除特殊字元避免檔案路徑錯誤）
    const safeName = hero.name.replace(/[^\w\u4e00-\u9fa5]/g, '');

    // Modal 內容
    let html = `
      <h2 class="hero-name">${item.card_id}</h2>
      <div class="hero-details-container">
        <div class="hero-column left">
          <img src="/mo_data/pic/card-equip/${safeName}.jpg" alt="${item.card_id}" class="hero-image" />
        </div>

        <div class="hero-column right">
          <p><strong>專卡名稱：</strong>${item.card_id}</p>
          <p><strong>等級：</strong>${item.card_lv}</p>
          <p><strong>屬性：</strong>${ item.card_property} <strong>+</strong>${item.card_data}</p>
          <p><strong>倍率：</strong>${item.nemultiplier}</p>
          <p><strong>專屬英雄：</strong>${item.hero_name}</p>
        </div>

      </div>
    `;

    contentDiv.innerHTML = html;

    overlay.style.display = 'block';
    modalBox.style.display = 'block';
  }

    // === 關閉 Modal ===
  const closeBtn = document.querySelector('#modalBox .close-btn');
  closeBtn.addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);

  function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBox').style.display = 'none';
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


  });