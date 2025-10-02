let heroesData = []; // 全部英雄資料

// 渲染函式
function renderHeroes(list) {
  const container = document.getElementById("hero-list");
  container.innerHTML = ""; // 先清空舊的

  if (list.length === 0) {
    container.innerHTML = "<p>沒有符合條件的英雄</p>";
    return;
  }

  list.forEach((hero) => {
    const card = document.createElement("div");
    card.className = "hero-card";
    card.innerHTML = `
      <h2>${hero.name}</h2>
      <ul>
        <li><strong>英雄名稱：</strong> ${hero.name}</li>
        <li><strong>光輝：</strong> ${hero.glory}</li>
        <li><strong>拜官：</strong> ${hero.promotion}</li>
        <li><strong>初始：</strong> ${hero.initial}</li>
        <li><strong>素質：</strong> ${hero.traits}</li>
        <li><strong>個性：</strong> ${hero.personality}</li>
        <li><strong>屬性：</strong> ${hero.element}</li>
        <li><strong>力量：</strong> ${hero.str}</li>
        <li><strong>智慧：</strong> ${hero.int}</li>
        <li><strong>體質：</strong> ${hero.vit}</li>
        <li><strong>敏捷：</strong> ${hero.agi}</li>
        <li><strong>運氣：</strong> ${hero.luk}</li>
        <li><strong>積極度 (生變前)：</strong> ${hero.aggression_before}</li>
        <li><strong>積極度 (生變後)：</strong> ${hero.aggression_after}</li>
        <li><strong>裝備卡 (新專)：</strong> ${hero.equipment_new}</li>
        <li><strong>新專倍率：</strong> ${hero.new_multiplier}</li>
        <li><strong>裝備卡 (舊專)：</strong> ${hero.equipment_old}</li>
        <li><strong>天生技：</strong> ${hero.innate_skill}</li>
        <li><strong>生變技能：</strong> ${hero.transformation_skill}</li>
      </ul>
    `;
    container.appendChild(card);
  });
}

// 抓資料
fetch("data/heroes.json")
  .then((response) => response.json())
  .then((data) => {
    heroesData = data; // 存起來
    renderHeroes(heroesData); // 預設顯示全部
  })
  .catch((error) => {
    console.error("載入英雄資料失敗:", error);
    document.getElementById("hero-list").innerText =
      "載入資料失敗，請檢查 heroes.json 是否存在。";
  });
<script>
// 綁定快速搜尋按鈕
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;   // 例：拜官、個性、素質
    const value = btn.dataset.value; // 例：武者、掃蕩、750

    const filtered = heroesData.filter(hero => {
      if (type === "拜官") {
        return hero.promotion === value;
      }
      if (type === "個性") {
        return hero.personality === value;
      }
      if (type === "素質") {
        return hero.traits === value;
      }
      return true;
    });

    renderTable(filtered);
  });
});

// 清除篩選
document.getElementById('clearFilters').addEventListener('click', () => {
  renderTable(heroesData);
  searchInput.value = '';
});


document.addEventListener("DOMContentLoaded", function () {
  // 綁定 accordion 點擊事件
  document.querySelectorAll(".accordion").forEach((acc) => {
    acc.addEventListener("click", function () {
      this.classList.toggle("active");

      let panel = this.nextElementSibling;
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
});
</script>
