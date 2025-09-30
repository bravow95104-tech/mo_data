fetch("data/heroes.json")
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("hero-list");

    data.forEach((hero) => {
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
  })
  .catch((error) => {
    console.error("載入英雄資料失敗:", error);
    document.getElementById("hero-list").innerText =
      "載入資料失敗，請檢查 heroes.json 是否存在。";
  });
