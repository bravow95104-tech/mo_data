let allQuestData = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetch("/mo_data/data/quest.json")
      .then(res => res.json())
      .then(data => {
        allQuestData = data; 
        renderQuests(""); 
      })
      .catch(err => {
        console.error("❌ 載入失敗：", err);
      });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderQuests(e.target.value.trim());
      });
    }
});

function renderQuests(keyword) {
  const container = document.getElementById("starContainer");
  if (!container) return;
  container.innerHTML = "";

  const lowKeyword = keyword.toLowerCase();

  // 🔍 多欄位篩選邏輯
  const filtered = allQuestData.filter(task => {
    // 定義要參與搜尋的欄位，並確保欄位不存在時給予空字串
    const searchStr = [
      task.id,           // 任務名稱
      task.area,         // 地區
      task.start        // 起始 NPC
    ].join("|").toLowerCase(); // 用特殊符號串接後轉小寫

    return searchStr.includes(lowKeyword);
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>找不到相符的任務內容</p>";
    return;
  }

  filtered.forEach(task => {
    const card = document.createElement("div");
    card.className = "mission-card";

    // 💰 獎勵欄位整合
    const rewardParts = [];
    if (task.process_exp)    rewardParts.push(`<strong>經驗：</strong>${task.process_exp} 點`);
    if (task.process_money)  rewardParts.push(`<strong>金錢：</strong>${task.process_money} 元`);
    if (task.process_renown) rewardParts.push(`<strong>名聲：</strong>${task.process_renown} 點`);
    if (task.process_item)   rewardParts.push(`<strong>物品：</strong>${task.process_item}`);
    if (task.process)   rewardParts.push(`${task.process}`);

    let combinedRewardRow = "";
    if (rewardParts.length > 0) {
      combinedRewardRow = `
        <tr>
          <td style="vertical-align: top;"><strong>任務獎勵：</strong></td>
          <td>${rewardParts.join("<br>")}</td>
        </tr>`;
    }

    // 🖼️ 圖片列處理
    let imageRow = "";
    if (task.image) {
      const imgSrc = `/mo_data/pic/quest/${task.image.toLowerCase()}`;
      imageRow = `
        <tr>
          <td><strong>任務參考圖：</strong></td>
          <td>
            <div class="mission-image-box">
              <img src="${imgSrc}" class="mission-img" onerror="this.closest('tr').style.display='none'">
            </div>
          </td>
        </tr>`;
    }

    // 📝 組合 HTML
    card.innerHTML = `
      <div class="mission-badge" style="float:right; background:#3399ff; color:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">
        ${task.star || "一般任務"}
      </div>
      <h3 style="color: #3399ff; margin-bottom:10px;">${task.id || "未命名任務"}</h3>
      <table class="mission-table">
        <tr><td style="width: 120px;"><strong>任務地區：</strong></td><td>${task.area || "-"}</td></tr>
        <tr><td><strong>起始 NPC：</strong></td><td>${task.start || "-"}</td></tr>
        <tr><td><strong>任務條件：</strong></td><td>${(task.restriction || "-").replace(/\n/g, "<br>")}</td></tr>
        <tr><td><strong>任務流程：</strong></td><td>${(task.award || "-").replace(/\n/g, "<br>")}</td></tr>
        ${combinedRewardRow}
        ${task.remark ? `<tr><td><strong>備註：</strong></td><td>${task.remark.replace(/\n/g, "<br>")}</td></tr>` : ""}
        ${imageRow}
      </table>
    `;
    container.appendChild(card);
  });
}