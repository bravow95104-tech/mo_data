let allQuestData = []; 

document.addEventListener("DOMContentLoaded", () => {
  // 1. 載入資料
  fetch("/mo_data/data/quest.json")
    .then(res => res.json())
    .then(data => {
      allQuestData = data; 
      renderQuests(allQuestData); // 初次渲染全部
    })
    .catch(err => console.error("❌ 載入失敗：", err));

  // 2. 監聽搜尋框
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // 3. 監聽篩選按鈕 (名聲按鈕)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      applyFilters(); // 每次點擊都重新計算篩選
    });
  });

  // 4. Accordion 展開／收合
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});

// ✅ 核心功能：連動篩選邏輯
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  
  // 取得目前所有啟用的名聲數值
  const activeRenowns = Array.from(document.querySelectorAll('.filter-btn.active'))
                             .map(btn => btn.dataset.value);

  const filtered = allQuestData.filter(task => {
    // A. 處理文字搜尋 (id, area, start)
    const searchStr = [task.id, task.area, task.start].join("|").toLowerCase();
    const matchKeyword = searchStr.includes(keyword);

    // B. 處理名聲按鈕 (如果沒點按鈕就不篩選名聲，有點則必須符合其中之一)
    // 注意：task.process_renown 轉成字串比對
    const taskRenown = String(task.process_renown || "");
    const matchRenown = activeRenowns.length === 0 || activeRenowns.includes(taskRenown);

    return matchKeyword && matchRenown; // 兩個條件都要符合
  });

  renderQuests(filtered);
}

// ✅ 負責把資料畫出來的函式
function renderQuests(data) {
  const container = document.getElementById("starContainer");
  if (!container) return;
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>找不到相符的任務內容</p>";
    return;
  }

  data.forEach(task => {
    const card = document.createElement("div");
    card.className = "mission-card";

    // 獎勵欄位整合
    const rewardParts = [];
    if (task.process_exp)    rewardParts.push(`<strong>經驗：</strong>${task.process_exp} 點`);
    if (task.process_money)  rewardParts.push(`<strong>金錢：</strong>${task.process_money} 元`);
    if (task.process_renown) rewardParts.push(`<strong>名聲：</strong>${task.process_renown} 點`);
    if (task.process_item)   rewardParts.push(`<strong>物品：</strong>${task.process_item}`);
    if (task.process)        rewardParts.push(`${task.process.replace(/\n/g, "<br>")}`);

    let rewardHtml = rewardParts.length > 0 ? `
      <tr>
        <td style="vertical-align: top;"><strong>任務獎勵：</strong></td>
        <td>${rewardParts.join("<br>")}</td>
      </tr>` : "";

    let imageRow = task.image ? `
      <tr>
        <td><strong>任務參考圖：</strong></td>
        <td><img src="/mo_data/pic/quest/${task.image.toLowerCase()}" class="mission-img" onerror="this.closest('tr').style.display='none'"></td>
      </tr>` : "";

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
        ${rewardHtml}
        ${task.remark ? `<tr><td><strong>備註：</strong></td><td>${task.remark.replace(/\n/g, "<br>")}</td></tr>` : ""}
        ${imageRow}
      </table>
    `;
    container.appendChild(card);
  });
}