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

// 3. 監聽篩選按鈕 (全域單選：點擊任何一個，其他所有按鈕都取消)
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // 1. 如果點擊的按鈕本來就是選中狀態，就取消它（變回顯示全部）
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
    } else {
      // 2. 核心邏輯：先移除「全頁面」所有按鈕的 active 狀態
      document.querySelectorAll('.filter-btn').forEach(allBtn => {
        allBtn.classList.remove('active');
      });
      // 3. 只幫當前點擊的這個按鈕加上 active
      btn.classList.add('active');
    }

    // 4. 重新執行篩選
    applyFilters();
  });
});

  // 4. 清除所有篩選按鈕 (修正後的邏輯)
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // (1) 清空文字框
      if (searchInput) searchInput.value = '';
      
      // (2) 取消所有按鈕的 active 狀態
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // (3) 重新執行篩選 (此時條件皆空，會渲染全部)
      applyFilters();
    });
  }

  // 5. Accordion 展開／收合
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});

// ✅ 核心功能：連動篩選邏輯 (搜尋框 + 全域單選按鈕)
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  
  // 取得目前唯一啟用的按鈕 (因為現在是全域單選，畫面最多只有一個 active)
  const activeBtn = document.querySelector('.filter-btn.active');
  const activeType = activeBtn ? activeBtn.dataset.type : null;
  const activeValue = activeBtn ? activeBtn.dataset.value : null;

  const filtered = allQuestData.filter(task => {
    // A. 處理文字搜尋 (id, area, start)
    const searchStr = [task.id, task.area, task.start].join("|").toLowerCase();
    const matchKeyword = searchStr.includes(keyword);

    // B. 處理按鈕篩選 (判斷是哪種類型的按鈕)
    let matchButton = true;
    if (activeType === 'process_renown') {
      matchButton = String(task.process_renown || "") === activeValue;
    } else if (activeType === 'star') {
      matchButton = String(task.star || "") === activeValue;
    }

    return matchKeyword && matchButton; // 同時符合關鍵字與按鈕條件
  });

  renderQuests(filtered);
}

// ✅ 渲染函式：將資料轉為 HTML 卡片
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

    // 💰 獎勵欄位整合
    const rewardParts = [];
    if (task.process_exp)    rewardParts.push(`<strong>經驗：</strong>${task.process_exp} 點`);
    if (task.process_money)  rewardParts.push(`<strong>金錢：</strong>${task.process_money} 元`);
    if (task.process_renown) rewardParts.push(`<strong>名聲：</strong>${task.process_renown} 點`);
    if (task.process_item)   rewardParts.push(`<strong>物品：</strong>${task.process_item}`);
    // 流程描述 (支援換行)
    if (task.process)        rewardParts.push(`<strong>獎勵細節：</strong><br>${task.process.replace(/\n/g, "<br>")}`);

    let rewardHtml = rewardParts.length > 0 ? `
      <tr>
        <td style="vertical-align: top;"><strong>任務獎勵：</strong></td>
        <td>${rewardParts.join("<br>")}</td>
      </tr>` : "";

    // 🖼️ 圖片處理
    let imageRow = "";
    if (task.image) {
      const imgSrc = `/mo_data/pic/quest/${task.image.toLowerCase()}`;
      imageRow = `
        <tr>
          <td><strong>任務參考圖：</strong></td>
          <td><img src="${imgSrc}" class="mission-img" onerror="this.closest('tr').style.display='none'"></td>
        </tr>`;
    }

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