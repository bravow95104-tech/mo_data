const repoName = window.location.pathname.split("/")[1]; // 只取 repo 名
const baseURL = `${window.location.origin}/${repoName}`;
// const baseURL = ``;
const refineLevelRate = [
  0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.9, 1.05, 1.2,
  1.35, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5,
];
const processLLevelRate = [0.05, 0.1, 0.15, 0.25, 0.35, 0.45, 0.6, 0.75, 0.9];
let heroesData = [];
function setInputValueAndTrigger(input, value) {
  input.value = value || "";

  const event = new Event("change", { bubbles: true }); // or 'input'
  input.dispatchEvent(event);
}

const getRefineInitValue = (calcValue, rate, addend) => {
  const intA = [];

  const lower = (calcValue - addend) / rate; // 下界
  const upper = (calcValue + 1 - addend) / rate; // 上界

  if (Math.ceil(lower) === Math.ceil(upper)) {
    intA.push(Math.ceil(lower));
  }
  // 找出區間內的整數
  for (let i = Math.ceil(lower); i < upper; i++) {
    intA.push(i);
  }
  return intA[0] || 0;
};
function getRefineInit(value, refine, process) {
  const calcValue = Number(value) || 0;
  const refineLevel = Number(refine) || 0;
  const processLevel = Number(process) || 0;
  if (refineLevel != 0) {
    const refineRate = refineLevelRate[refineLevel - 1] || 0;
    const rate = 1.9 + refineRate;
    const addend = refineLevel + 9 + 1;
    return getRefineInitValue(calcValue, rate, addend);
  }
  if (processLevel != 0) {
    const refineRate = processLLevelRate[processLevel - 1] || 0;
    const rate = 1 + refineRate;
    const addend = processLevel;
    return getRefineInitValue(calcValue, rate, addend);
  }
  return calcValue;
}
function getRefineValue(value) {
  const calcValue = Number(value) || 0;
  let res = [];
  for (let index = 0; index < 20; index++) {
    const rate = refineLevelRate[index];
    const calc = calcValue * (1.9 + rate) + (index + 11);
    res.push(Math.floor(calc));
  }
  return res;
}
// 搜索啟動開關控制下拉選單與 radio 啟用/停用
document.addEventListener("DOMContentLoaded", () => {
  const searchSwitch = document.getElementById("search-enable-switch");
  const togglePrefixSwitch = document.getElementById("toggle-prefix-switch");
  const toggle = document.getElementById("toggle-switch");
  const refine = document.getElementById("refine-level");
  const process = document.getElementById("process-level");

  const searchInput1 = document.getElementById("searchInput1");
  const searchInput2 = document.getElementById("searchInput2");

  function setEnable(el, enabled) {
    if (el) el.disabled = !enabled;
  }

  if (searchSwitch) {
    searchSwitch.addEventListener("change", function () {
      setEnable(process, this.checked);
      // 當啟用時檢查並 clamp 值
      if (process) {
        if (this.checked) {
          // 設定正確的 min/max 屬性，並 clamp 現有值
          process.min = 0;
          process.max = 9;
          const v = Number(process.value) || 0;
          if (v < 0) process.value = 0;
          if (v > 9) process.value = 9;
        } else {
          setInputValueAndTrigger(process, 0);
        }
      }
    });
    // 預設關閉
    setEnable(process, false);
  }

  if (toggle) {
    toggle.addEventListener("change", function () {
      setEnable(refine, this.checked);
      // 當啟用時檢查並 clamp 值
      if (refine) {
        if (this.checked) {
          refine.min = 0;
          refine.max = 20;
          const v = Number(refine.value) || 0;
          if (v < 0) refine.value = 0;
          if (v > 20) refine.value = 20;
        } else {
          setInputValueAndTrigger(refine, 0);
        }
      }
    });
    // 預設關閉
    setEnable(refine, false);
  }

  if (togglePrefixSwitch) {
    togglePrefixSwitch.addEventListener("change", function () {
      setEnable(searchInput1, this.checked);
      setEnable(searchInput2, this.checked);
      if (!this.checked) {
        setInputValueAndTrigger(searchInput1, "");
        setInputValueAndTrigger(searchInput2, "");
      }
    });
    // 預設關閉
    setEnable(searchInput1, false);
    setEnable(searchInput2, false);
  }
});

// 強制 clamp 使用者手動輸入的值（即時限制）
document.addEventListener("DOMContentLoaded", () => {
  const processInput = document.getElementById("process-level");
  const refineInput = document.getElementById("refine-level");

  function clampInput(el, min, max) {
    if (!el) return;
    const clamp = () => {
      let v = Number(el.value);
      if (Number.isNaN(v)) {
        el.value = "";
        return;
      }
      if (v < min) el.value = String(min);
      if (v > max) el.value = String(max);
    };
    el.addEventListener("input", clamp);
    el.addEventListener("change", clamp);
    // 若有 stepper buttons 或 programmatic set，仍可在 blur 時再次 clamp
    el.addEventListener("blur", clamp);
  }

  clampInput(processInput, 0, 9);
  clampInput(refineInput, 0, 20);
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

const calcResult = (mainList = [], subList = []) => {
  const main = [...mainList];
  const sub = [...subList];
  if (main.length != 0 || sub.length != 0) {
    let strList = [];
    for (let index = 0; index < 20; index++) {
      const str = ` <tr>
                <td>${index + 1}</td>
                <td>${main[index] || "-"}</td>
                <td>${sub[index] || "-"}</td>
              </tr>`;
      strList.push(str);
    }
    const tbodyStr = strList.join("\n");
    return `<table class="card-table">
            <thead>
              <tr>
                <th>精煉等級</th>
                <th>防禦力/攻擊力</th>
                <th>閃避/命中</th>
              </tr>
            </thead>
            <tbody>
              ${tbodyStr}
            </tbody>
          </table>`;
  }
  return `<table class="card-table">
            <thead>
              <tr>
                <th>精煉等級</th>
                <th>防禦力/攻擊力</th>
                <th>閃避/命中</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>2</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>3</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>4</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>5</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>6</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>7</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>8</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>9</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>10</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>11</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>12</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>13</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>14</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>15</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>16</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>17</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>18</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>19</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>20</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>`;
};

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

      const mainStat = document.getElementById("main-stat")?.value || 0;
      const subResult = document.getElementById("sub-stat")?.value || 0;
      const refineLevel = document.getElementById("refine-level")?.value || 0;
      const processLevel = document.getElementById("process-level")?.value || 0;
      const mainRefineInit = getRefineInit(mainStat, refineLevel, processLevel);
      const subRefineInit = getRefineInit(subResult, refineLevel, processLevel);
      const searchInput2 = document.getElementById("searchInput2");
      const ratea = searchInput2.dataset.ratea || 1;
      const rateb = searchInput2.dataset.rateb || 1;
      const result = document.getElementById("result");
      const mainList = getRefineValue(mainRefineInit * ratea);
      const subList = getRefineValue(subRefineInit * rateb);

      if (result) result.innerHTML = calcResult(mainList, subList); // 預設顯示結果

    });
  }
});
// 計算模組的資料夾路徑

// searchDropdown.js
// 載入本地 heroes.json 並根據 input 搜尋更新下拉選單

document.addEventListener("DOMContentLoaded", () => {
  // 支援多組 searchInput + dropdown + dataSrc
  // combos 支援 key 與 label 設定

  const typeList = [
    { id: 1, name: "武器" },
    { id: 2, name: "防具" },
    { id: 3, name: "飾品" },
  ];
  const typeOneCodeList = [
    { id: 0, name: "白字", rateA: 1, rateB: 1 },
    { id: 1, name: "精湛", rateA: 1.3, rateB: 1.3 },
    { id: 2, name: "鋒利", rateA: 1.3, rateB: 1 },
    { id: 3, name: "輕快", rateA: 1.3, rateB: 1.3 },
    { id: 4, name: "威力", rateA: 1.15, rateB: 1 },
    { id: 5, name: "靈巧", rateA: 1.15, rateB: 1.15 },
    { id: 6, name: "耐用", rateA: 1, rateB: 1.15 },
    { id: 7, name: "強襲", rateA: 1.15, rateB: 1 },
    { id: 8, name: "迅擊", rateA: 1, rateB: 1.15 },
    { id: 9, name: "堅固", rateA: 1, rateB: 1 },
    { id: 10, name: "其他(抽包或是掉落)", rateA: 1, rateB: 1 },
  ];
  const typeTwoCodeList = [
    { id: 0, name: "白字", rateA: 1, rateB: 1 },
    { id: 1, name: "華麗", rateA: 1.3, rateB: 1.3 },
    { id: 2, name: "堅硬", rateA: 1.3, rateB: 1 },
    { id: 3, name: "迴避", rateA: 1.3, rateB: 1.3 },
    { id: 4, name: "保護", rateA: 1.15, rateB: 1 },
    { id: 5, name: "流動", rateA: 1.15, rateB: 1.15 },
    { id: 6, name: "耐用", rateA: 1, rateB: 1.15 },
    { id: 7, name: "屏障", rateA: 1.15, rateB: 1 },
    { id: 8, name: "機動", rateA: 1, rateB: 1.15 },
    { id: 9, name: "堅固", rateA: 1, rateB: 1 },
    { id: 10, name: "其他(抽包或是掉落)", rateA: 1, rateB: 1 },
  ];
  const typeThreeCodeList = [
    { id: 10, name: "其他(抽包或是掉落)", rateA: 1, rateB: 1 },
  ];
  setupDropdown("searchInput1", "dropdown1", typeList, "id", "name");

  // 初始化 searchInput2/dropdown2（先空資料），之後會根據 dropdown1 選擇填入對應的 code list
  // setupDropdown("searchInput2", "dropdown2", [], "id", "name");

  // 當 dropdown1 有選擇時，根據其 id 帶入對應的 code list 到 dropdown2
  const input1 = document.getElementById("searchInput1");
  const input2 = document.getElementById("searchInput2");
  const dropdown2 = document.getElementById("dropdown2");

  function populateDropdown2(list, labelKey = "name") {
    if (!dropdown2) return;
    dropdown2.innerHTML = "";
    if (list.length) {
      setupDropdown("searchInput2", "dropdown2", [...list], "id", "name");
    }
  }

  if (input1) {
    input1.addEventListener("change", function () {
      const val = this.value?.trim();
      // 根據 typeList 找 id
      const sel = typeList.find((t) => (t.name || "") === val);
      let list = [];
      if (sel) {
        if (sel.id === 1) list = typeOneCodeList;
        else if (sel.id === 2) list = typeTwoCodeList;
        else if (sel.id === 3) list = typeThreeCodeList;
      }
      // 清空 input2 的值
      if (input2) setInputValueAndTrigger(input2, "");
      populateDropdown2(list, "name");
    });
  }

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
        const searchVal = (item[labelKey] || "").toString().toLowerCase();
        return searchVal.includes(keyword);
      });
      renderDropdown(filtered);
      showDropdown();
    });

    // 點擊 input 時若有 value 立即搜尋
    input.addEventListener("focus", () => {
      // const keyword = input.value.trim().toLowerCase();
      // if (keyword) {
      //   filtered = data.filter((item) => {
      //     const searchVal = (item[labelKey] || "").toString().toLowerCase();
      //     return searchVal.includes(keyword);
      //   });
      // }

      renderDropdown(data);
      showDropdown();
    });

    // 失焦時，若尚未選擇且不在 heroesData 才自動選第一筆，否則不動作
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (filtered.length > 0) {
          // 判斷 input.value 是否在 heroesData（或 data）裡
          const exists = data.some(
            (item) => (item[labelKey] || "") === input.value
          );
          if (!exists && input.value) {
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
          input.dataset.ratea = item.rateA || 1;
          input.dataset.rateb = item.rateB || 1;

          setInputValueAndTrigger(input, item[labelKey] || "");
          // 選取後讓 input 失去焦點，避免保留 focus 狀態
          try {
            input.blur();
          } catch (err) {
            /* ignore */
          }
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
      // 顯示時加上邊框
      dropdown.style.border = "1px solid #ccc";
      dropdown.style.borderTop = "none";
    }
    function hideDropdown() {
      dropdown.style.display = "none";
      // 隱藏時移除邊框，回復到 CSS 的預設
      dropdown.style.border = "";
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const result = document.getElementById("result");
  if (result) result.innerHTML = calcResult(); // 預設顯示結果
});
