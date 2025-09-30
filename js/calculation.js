const repoName = window.location.pathname.split("/")[1]; // 只取 repo 名
const baseURL = `${window.location.origin}/${repoName}`;
// const baseURL = ``;

let heroesData = [];
function setInputValueAndTrigger(input, value) {
  input.value = value || "";

  const event = new Event('change', { bubbles: true }); // or 'input'
  input.dispatchEvent(event);
}
// 裝備卡下拉選單選擇後自動比對英雄資料並選擇 radio
document.addEventListener("DOMContentLoaded", async () => {
  // 取得英雄資料（每次都 fetch，確保最新）
  try {
    const res = await fetch(`${baseURL}/data/heroes.json`);
    heroesData = await res.json();
  } catch (e) {
    return;
  }
  // 綁定三個裝備卡下拉選單
  [1, 2, 3].forEach((idx) => {
    const equipInput = document.getElementById(`searchInput${idx}`);
    if (!equipInput) return;

    // 監聽英雄欄位變化，沒選英雄時裝備卡 disabled
    const heroInput = document.getElementById("searchInput4");
    function updateEquipInputState() {
      const heroName = heroInput?.value?.trim();
      equipInput.disabled = !heroName;
      if (!heroName) equipInput.value = "";
    }
    if (heroInput) {
      heroInput.addEventListener("input", updateEquipInputState);
      heroInput.addEventListener("change", updateEquipInputState);
      updateEquipInputState();
    }

    equipInput.addEventListener("change", async function () {
      const heroName = heroInput?.value?.trim();
      if (!heroName) return;
      const equipName = this.value.trim();
      if (!equipName) return;
      // 查找英雄
      const hero = heroesData.find((h) => h.name === heroName);
      if (!hero) return;
      let radioValue = "normal";
      if (equipName === hero.equipment_new && hero.magnification_new) {
        radioValue = hero.magnification_new;
      } else if (equipName === hero.equipment_old && hero.magnification_old) {
        radioValue = hero.magnification_old;
      }
      if (!["2x", "2.5x"].includes(radioValue)) radioValue = "normal";
      document
        .querySelectorAll(`input[name='equip${idx}-type']`)
        .forEach((el) => {
          el.checked = el.value === radioValue;
        });
    });
  });
});
// 搜索啟動開關控制下拉選單與 radio 啟用/停用
document.addEventListener("DOMContentLoaded", () => {
  const searchSwitch = document.getElementById("search-enable-switch");
  const searchInputs = [
    document.getElementById("searchInput1"),
    document.getElementById("searchInput2"),
    document.getElementById("searchInput3"),
    document.getElementById("searchInput4"),
  ];
  const radioNames = ["equip1-type", "equip2-type", "equip3-type"];
  const heroInput = document.getElementById("searchInput4");

  function setEnable(enabled) {
    // 英雄欄位直接受 enabled 控制
    if (searchInputs[3]) searchInputs[3].disabled = !enabled;
    // 裝備卡下拉選單需同時判斷英雄欄位有無值
    [0, 1, 2].forEach((i) => {
      const equipInput = searchInputs[i];
      if (equipInput) {
        equipInput.disabled = !enabled || !(heroInput && heroInput.value.trim());
        if (!enabled || !(heroInput && heroInput.value.trim())) equipInput.value = "";
      }
    });
    // radio 反向控制
    radioNames.forEach((name) => {
      document.querySelectorAll(`input[name='${name}']`).forEach((el) => {
        el.disabled = enabled;
      });
    });
  }

  // 監聽英雄欄位變化，動態更新裝備卡 enable 狀態
  if (heroInput) {
    heroInput.addEventListener("input", function () {
      setEnable(searchSwitch && searchSwitch.checked);
    });
    heroInput.addEventListener("change", function () {
      setEnable(searchSwitch && searchSwitch.checked);
    });
  }

  if (searchSwitch) {
    searchSwitch.addEventListener("change", function () {
      setEnable(this.checked);
    });
    // 預設關閉
    setEnable(false);
  }
});

// Toggle Switch 狀態切換
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-switch");
  if (toggle) {
    toggle.addEventListener("change", function () {
      // 可根據 toggle.checked 判斷狀態
      // true = 生變, false = 未生變
      // 這裡可加上資料切換邏輯
      // console.log(toggle.checked ? '生變' : '未生變');
    });
  }
});
// 切換按鈕動畫與 active 狀態
document.addEventListener("DOMContentLoaded", () => {
  const beforeBtn = document.getElementById("switch-before");
  const afterBtn = document.getElementById("switch-after");
  if (beforeBtn && afterBtn) {
    beforeBtn.addEventListener("click", () => {
      beforeBtn.classList.add("active");
      afterBtn.classList.remove("active");
    });
    afterBtn.addEventListener("click", () => {
      afterBtn.classList.add("active");
      beforeBtn.classList.remove("active");
    });
  }
});
// 波紋效果 for .calc-btn
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".calc-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = e.clientX - rect.left - size / 2 + "px";
      ripple.style.top = e.clientY - rect.top - size / 2 + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });

  // 計算邏輯
  const calcBtn = document.querySelector(".calc-btn");
  if (calcBtn) {
    calcBtn.addEventListener("click", function () {
      // 取得 toggle-switch 狀態
      const toggle = document.getElementById("toggle-switch");
      const isTransformed = toggle ? toggle.checked : false;

      // 取得屬性 input 值
      // 順序: 等級、力量、智慧、體質、敏捷、運氣
      const heroInputs = document.querySelectorAll(".hero-input");
      let [level, str, int, vit, agi, luk] = Array.from(heroInputs).map(
        (input) => Number(input.value) || 0
      );

      // 驗證欄位
      if (level < 1) {
        alert("等級必須大於等於 1");
        return;
      }
      if (str <= 0 || int <= 0 || vit <= 0 || agi <= 0 || luk <= 0) {
        alert("力量、智慧、體質、敏捷、運氣都必須大於 0");
        return;
      }

      // 計算五項屬性總和
      const attrSum = str + int + vit + agi + luk;

      // 取得三個裝備卡 input 及 radio 值
      const equipInputs = document.querySelectorAll(".equip-input");
      let equipTotal = 0;
      equipInputs.forEach((input, idx) => {
        const val = Number(input.value) || 0;
        // radio name: equip1-type, equip2-type, equip3-type
        const radio = document.querySelector(
          `input[name="equip${idx + 1}-type"]:checked`
        );
        let multiplier = 1;
        if (radio) {
          if (radio.value === "2x") multiplier = 2;
          else if (radio.value === "2.5x") multiplier = 2.5;
        }
        equipTotal += val * multiplier;
      });
      const transformedPoint = isTransformed ? 800 : 0;
      const transformedRemainingPoints = isTransformed ? 2520 : 1720;
      const attributePoints = attrSum - (level - 40) * 18 - equipTotal; // 英雄 LV40 屬性點總和
      const currentLevelCap =
        level * 18 + Math.ceil(level / 10) * 100 + transformedPoint; // 目前等級屬性點上限
      const currentLevelTotal = attrSum - equipTotal; // 目前等級屬性點總和
      const heroRemaining = transformedRemainingPoints - attributePoints; // 英雄此生剩下可食用點數
      const currentLevelRemaining = currentLevelCap - currentLevelTotal; // 目前等級剩下可食用點數

      // 將結果寫入對應 input
      document.getElementById("total-attribute-points").value = attributePoints;
      document.getElementById("current-level-cap").value = currentLevelCap;
      document.getElementById("current-level-total").value = currentLevelTotal;
      document.getElementById("current-level-remaining").value =
        currentLevelRemaining;
      document.getElementById("hero-remaining").value = heroRemaining;
    });
  }
});
// 計算模組的資料夾路徑

// searchDropdown.js
// 載入本地 heroes.json 並根據 input 搜尋更新下拉選單

document.addEventListener("DOMContentLoaded", () => {
  // 支援多組 searchInput + dropdown + dataSrc
  // combos 支援 key 與 label 設定
  const combos = [
    {
      input: "searchInput1",
      dropdown: "dropdown1",
      dataSrc: `${baseURL}/data/equipment.json`,
      key: "key", // 預設搜尋 key
      label: "label", // 預設顯示 key
    },
    {
      input: "searchInput2",
      dropdown: "dropdown2",
      dataSrc: `${baseURL}/data/equipment.json`,
      key: "key",
      label: "label",
    },
    {
      input: "searchInput3",
      dropdown: "dropdown3",
      dataSrc: `${baseURL}/data/equipment.json`,
      key: "key",
      label: "label",
    },
    {
      input: "searchInput4",
      dropdown: "dropdown4",
      dataSrc: `${baseURL}/data/heroes.json`,
      key: "name",
      label: "name",
    },
  ];

  combos.forEach(({ input, dropdown, dataSrc, key, label }) => {
    fetch(dataSrc)
      .then((response) => response.json())
      .then((data) => {
        setupDropdown(input, dropdown, data, key, label);
      });
  });

  // 支援 key 與 label 的下拉選單
  function setupDropdown(
    inputId,
    dropdownId,
    data,
    key = "name",
    labelKey = "name"
  ) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    let filtered = data;

    if (!input || !dropdown) return;

    // input 輸入時即時搜尋
    input.addEventListener("input", () => {
      const keyword = input.value.trim().toLowerCase();
      filtered = data.filter((item) => {
        const searchVal = (item[key] || "").toString().toLowerCase();
        return searchVal.includes(keyword);
      });
      renderDropdown(filtered);
      showDropdown();
    });

    // 點擊 input 時若有 value 立即搜尋
    input.addEventListener("focus", () => {
      const keyword = input.value.trim().toLowerCase();
      if (keyword) {
        filtered = data.filter((item) => {
          const searchVal = (item[key] || "").toString().toLowerCase();
          return searchVal.includes(keyword);
        });
      }
      renderDropdown(filtered);
      showDropdown();
    });

    // 失焦時，若尚未選擇且不在 heroesData 才自動選第一筆，否則不動作
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (filtered.length > 0) {
          // 判斷 input.value 是否在 heroesData（或 data）裡
          const exists = data.some(item => (item[labelKey] || "") === input.value);
          if (!exists) {
            setInputValueAndTrigger(input, filtered[0][labelKey] || "");
          }
        } else {
          setInputValueAndTrigger(input, "");
        }
        hideDropdown();
      }, 120);
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
      list.forEach((item) => {
        const dropdownItem = document.createElement("div");
        dropdownItem.textContent = item[labelKey] || "";
        dropdownItem.className = "dropdown-item";
        dropdownItem.addEventListener("mousedown", function (e) {
          e.preventDefault();
          // input.value = item[labelKey] || "";
          setInputValueAndTrigger(input, item[labelKey] || "");
          hideDropdown();
        });
        dropdown.appendChild(dropdownItem);
      });
    }
    function showDropdown() {
      dropdown.style.display = "block";
      // 自動判斷是否 overflow，若會則顯示在上方
      const rect = dropdown.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
      // 預設下方顯示
      dropdown.style.top = "";
      dropdown.style.bottom = "";
      dropdown.style.transform = "";
      // 若下方空間不足，則顯示在上方
      if (rect.bottom > windowHeight && inputRect.top > rect.height) {
        dropdown.style.top = "auto";
        dropdown.style.bottom = `100%`;
        dropdown.style.transform = "translateY(-8px)";
      } else {
        dropdown.style.top = "100%";
        dropdown.style.bottom = "auto";
        dropdown.style.transform = "none";
      }
    }
    function hideDropdown() {
      dropdown.style.display = "none";
    }
  }
});
