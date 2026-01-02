let allQuestData = []; 

// ✅ 1. 確保 HTML 載入後才執行 (解決 addEventListener null 的問題)
document.addEventListener("DOMContentLoaded", () => {
    
    // ✅ 2. 載入 JSON
    fetch("/mo_data/data/quest.json")
      .then(res => res.json())
      .then(data => {
        allQuestData = data; 
        renderQuests(""); // 初次載入
      })
      .catch(err => {
        console.error("❌ 載入失敗：", err);
        const container = document.getElementById("starContainer");
        if(container) container.innerHTML = "<p>資料載入失敗，請檢查 quest.json 格式</p>";
      });

    // ✅ 3. 監聽搜尋框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderQuests(e.target.value.trim());
      });
    }
});

// ✅ 4. 渲染函式
function renderQuests(keyword) {
  const container = document.getElementById("starContainer");
  if (!container) return;
  container.innerHTML = "";

  // 🔍 篩選邏輯 (加上安全檢查，防止 star_q 為空時報錯)
  const filtered = allQuestData.filter(task => {
    const taskName = task.star_q || ""; // 如果沒這欄位，給它空字串
    return taskName.toLowerCase().includes(keyword.toLowerCase());
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>找不到相符的任務</p>";
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

    let combinedRewardRow = "";
    if (rewardParts.length > 0) {
      combinedRewardRow = `
        <tr>
          <td style="vertical-align: top;"><strong>任務獎勵：</strong></td>
          <td>${rewardParts.join("<br>")}</td>
        </tr>
      `;
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

    card.innerHTML = `
      <div class="mission-badge" style="float:right; background:#3399ff; color:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">
        ${task.star || "一般任務"}
      </div>
      <h3 style="color: #3399ff; margin-bottom:10px;">${task.star_q || "未命名任務"}</h3>
      <table class="mission-table">
        <tr><td style="width: 120px;"><strong>任務名稱：</strong></td><td>${task.id || "-"}</td></tr>
        <tr><td><strong>地區：</strong></td><td>${task.area || "-"}</td></tr>
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