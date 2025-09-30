// 計算模組的資料夾路徑
const MODULE_PATH = "modules/calculation/";
// searchDropdown.js
// 載入本地 heroes.json 並根據 input 搜尋更新下拉選單

document.addEventListener("DOMContentLoaded", () => {
  // 支援多組 searchInput + dropdown + dataSrc
  const combos = [
    { input: "searchInput1", dropdown: "dropdown1", dataSrc: "/data/heroes.json" },
    { input: "searchInput2", dropdown: "dropdown2", dataSrc: "/data/heroes.json" },
    { input: "searchInput3", dropdown: "dropdown3", dataSrc: "/data/heroes.json" },
    { input: "searchInput4", dropdown: "dropdown4", dataSrc: "/data/heroes.json" },
  ];

  combos.forEach(({ input, dropdown, dataSrc }) => {
    fetch(dataSrc)
      .then((response) => response.json())
      .then((data) => {
        setupDropdown(input, dropdown, data);
      });
  });

  function setupDropdown(inputId, dropdownId, data) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    let filtered = data;

    if (!input || !dropdown) return;

    input.addEventListener("input", () => {
      const keyword = input.value.trim().toLowerCase();
      filtered = data.filter((hero) => hero.name.toLowerCase().includes(keyword));
      renderDropdown(filtered);
      showDropdown();
    });

    input.addEventListener("focus", () => {
      renderDropdown(filtered);
      showDropdown();
    });

    document.addEventListener("mousedown", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        hideDropdown();
      }
    });

    function renderDropdown(list) {
      dropdown.innerHTML = "";
      if (list.length === 0) {
        const item = document.createElement("div");
        item.textContent = "查無資料";
        item.className = "dropdown-item";
        item.style.color = "#aaa";
        dropdown.appendChild(item);
        return;
      }
      list.forEach((hero) => {
        const item = document.createElement("div");
        item.textContent = hero.name;
        item.className = "dropdown-item";
        item.addEventListener("mousedown", function (e) {
          e.preventDefault();
          input.value = hero.name;
          hideDropdown();
        });
        dropdown.appendChild(item);
      });
    }
    function showDropdown() {
      dropdown.style.display = "block";
    }
    function hideDropdown() {
      dropdown.style.display = "none";
    }
  }
});
