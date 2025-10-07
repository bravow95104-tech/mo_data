// ✅ 載入任務資料
fetch("/mo_data/data/star_quest.json")
  .then(res => res.json())
  .then(data => initStarTasks(data))
  .catch(err => {
    console.error("❌ JSON 載入失敗：", err);
    document.getElementById("starContainer").innerHTML = "<p>無法載入任務資料</p>";
  });

// ✅ 初始化任務資料與分頁
function initStarTasks(data) {
  const container = document.getElementById("starContainer");

  // 建立分頁按鈕容器
  const tabBar = document.createElement("div");
  tabBar.className = "star-tabs";
  container.appendChild(tabBar);

  // 分組任務
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

    // 分頁按鈕
    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn";
    if (firstTab) tabBtn.classList.add("active");
    tabBtn.textContent = starName;
    tabBtn.dataset.target = tabId;
    tabBar.appendChild(tabBtn);

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
          <tr><td><p><strong>任務地區：</strong></p></td><td>${task.strat || "-"}</td></tr>
          <tr><td><p><strong>準備道具：</strong></p></td><td>${task.material || "-"}</td></tr>
          <tr><td><p><strong>任務條件：</strong></p></td><td>${task.restriction || "-"}</td></tr>
          <tr><td><p><strong>任務流程：</strong></p></td><td>${(task.process || "").replace(/\n/g, "<br>")}</td></tr>
          <tr><td><p><strong>任務獎勵：</strong></p></td><td>${task.award || "-"}.replace(/\n/g, "<br>")}</td></tr>
          ${task.remark ? `<tr><td><p><strong>備註：</strong></p></td><td>${task.remark}</td></tr>` : ""}
        </table>
      `;
      tabContent.appendChild(card);
    });

    contentContainer.appendChild(tabContent);
    firstTab = false;
  });

  // 分頁切換邏輯
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;

      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
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
