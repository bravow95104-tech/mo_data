let allQuestData = []; // 儲存原始資料

// ✅ 1. 載入 JSON
fetch("/mo_data/data/quest.json")
  .then(res => res.json())
  .then(data => {
    allQuestData = data; 
    renderQuests(""); // 初次載入，顯示全部
  })
  .catch(err => {
    console.error("❌ 載入失敗：", err);
  });

// ✅ 2. 監聽搜尋框輸入
document.getElementById('questSearchInput').addEventListener('input', (e) => {
  renderQuests(e.target.value.trim());
});

// ✅ 3. 渲染函式 (純列表，無分頁)
function renderQuests(keyword) {
  const container = document.getElementById("starContainer");
  if (!container) return;
  container.innerHTML = "";

  const filtered = allQuestData.filter(task => 
    task.star_q.toLowerCase().includes(keyword.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>找不到相符的任務</p>";
    return;
  }

  filtered.forEach(task => {
    const card = document.createElement("div");
    card.className = "mission-card";

    // 🌟 1. 整合獎勵與流程資訊到同一個欄位
    const rewardParts = [];
    
    // 檢查各個欄位，有資料才放入陣列，並加上對應的文字與單位
    if (task.process_exp)    rewardParts.push(`<strong>經驗：</strong>${task.process_exp} 點`);
    if (task.process_money)  rewardParts.push(`<strong>金錢：</strong>${task.process_money} 元`);
    if (task.process_renown) rewardParts.push(`<strong>名聲：</strong>${task.process_renown} 點`);
    if (task.process_item)   rewardParts.push(`<strong>物品：</strong>${task.process_item}`);

    // 如果以上任一欄位有資料，就組成一個 <tr>
    let combinedRewardRow = "";
    if (rewardParts.length > 0) {
      combinedRewardRow = `
        <tr>
          <td style="width: 100px; vertical-align: top;"><strong>任務獎勵：</strong></td>
          <td>${rewardParts.join("<br>")}</td>
        </tr>
      `;
    }

    // 處理圖片列
    let imageRow = "";
    if (task.image) {
      const imgSrc = `/mo_data/pic/quest/${task.image.toLowerCase()}`;
      imageRow = `
        <tr>
          <td><strong>任務參考圖：</strong></td>
          <td><img src="${imgSrc}" class="mission-img" onerror="this.closest('tr').style.display='none'"></td>
        </tr>`;
    }

    // 2. 組合完整的 HTML
    card.innerHTML = `
      <div class="mission-badge">${task.star || "一般任務"}</div>
      <h3>${task.star_q}</h3>
      <table class="mission-table">
        <tr><td style="width: 100px;"><strong>任務 ID：</strong></td><td>${task.id || "-"}</td></tr>
        <tr><td><strong>地區：</strong></td><td>${task.area || "-"}</td></tr>
        <tr><td><strong>起始 NPC：</strong></td><td>${task.start || "-"}</td></tr>
        <tr><td><strong>任務條件：</strong></td><td>${task.restriction || "-"}</td></tr>
        <tr><td><strong>任務流程：</strong></td><td>${task.award || "-"}</td></tr>
        ${combinedRewardRow}
        
        ${task.remark ? `<tr><td><strong>備註：</strong></td><td>${task.remark}</td></tr>` : ""}
        ${imageRow}
      </table>
    `;
    container.appendChild(card);
  });
}