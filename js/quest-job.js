// ✅ 載入任務資料
fetch("/mo_data/data/quest-job.json")
  .then(res => res.json())
  .then(data => initStarTasks(data))
  .catch(err => {
    console.error("❌ JSON 載入失敗：", err);
    document.getElementById("starContainer").innerHTML = "<p>無法載入任務資料</p>";
  });

// ✅ 初始化任務資料與分頁
function initStarTasks(data) {
  const container = document.getElementById("starContainer");
  
  // ✅ 先分組
  const grouped = {};
  data.forEach(task => {
    if (!grouped[task.star]) grouped[task.star] = [];
    grouped[task.star].push(task);
  });
  // 內容容器
  const contentContainer = document.createElement("div");
  contentContainer.className = "tab-contents";
  container.appendChild(contentContainer);

  let firstTab = true;

  Object.keys(grouped).forEach((starName, index) => {
    const tabId = `tab-${index}`;


    // 任務內容區塊
    const tabContent = document.createElement("div");
    tabContent.className = "tab-content";
    tabContent.id = tabId;
    if (firstTab) tabContent.classList.add("active");

    // 小任務卡片
    grouped[starName].forEach(task => {
      const card = document.createElement("div");
      card.className = "mission-card";
      card.innerHTML = `
        <h3>${task.star_q}</h3>
        <table class="mission-table">
          <tr><td><p><strong>任務條件：</strong></p></td><td>${task.restriction || "-"}</td></tr>
          <tr><td><p><strong>任務流程：</strong></p></td><td>${(task.process || "").replace(/\n/g, "<br>")}</td></tr>
          <tr><td><p><strong>任務獎勵：</strong></p></td><td>${(task.award || "-").replace(/\n/g, "<br>")}</td></tr>
          ${task.remark ? `<tr><td><p><strong>備註：</strong></p></td><td>${task.remark}</td></tr>` : ""}
        </table>
      `;
      tabContent.appendChild(card);
    });

    contentContainer.appendChild(tabContent);
    firstTab = false;
  });
}

  // 回到頂部按鈕邏輯
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
