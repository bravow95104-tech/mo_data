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
  if (!container) return;
  container.innerHTML = ""; // 清空舊內容

  // 1. 分組資料 (按 star 欄位)
  const grouped = {};
  data.forEach(task => {
    if (!grouped[task.star]) grouped[task.star] = [];
    grouped[task.star].push(task);
  });

  // 2. 建立分頁按鈕容器
  const tabBar = document.createElement("div");
  tabBar.className = "star-tabs";
  container.appendChild(tabBar);

  // 3. 建立內容容器
  const contentContainer = document.createElement("div");
  contentContainer.className = "tab-contents";
  container.appendChild(contentContainer);

  let firstTab = true;

  Object.keys(grouped).forEach((starName, index) => {
    const tabId = `tab-${index}`;

    // 4. 建立分頁按鈕
    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn";
    if (firstTab) tabBtn.classList.add("active");
    tabBtn.textContent = starName;
    tabBtn.dataset.target = tabId;
    tabBar.appendChild(tabBtn);

    // 5. 建立分頁內容
    const tabContent = document.createElement("div");
    tabContent.className = "tab-content";
    tabContent.id = tabId;
    if (firstTab) tabContent.classList.add("active");

    // 6. 遍歷該組別的任務卡片
    grouped[starName].forEach(task => {
      const card = document.createElement("div");
      card.className = "mission-card";

      let imageRow = "";
      if (task.image) {
        const imgSrc = `/mo_data/pic/quest/${task.image.toLowerCase()}`;
        imageRow = `
          <tr>
            <td><p><strong>任務參考圖：</strong></p></td>
            <td>
              <div class="mission-image-box">
                <img src="${imgSrc}" class="mission-img" alt="任務圖片" onerror="this.closest('tr').style.display='none'">
              </div>
            </td>
          </tr>
        `;
      }

      card.innerHTML = `
        <h3>${task.star_q}</h3>
        <table class="mission-table">
          <tr>
            <td style="width: 100px;"><p><strong>任務條件：</strong></p></td>
            <td>${task.restriction || "-"}</td>
          </tr>
          <tr>
            <td><p><strong>任務流程：</strong></p></td>
            <td>${(task.process || "").replace(/\n/g, "<br>")}</td>
          </tr>
          <tr>
            <td><p><strong>任務獎勵：</strong></p></td>
            <td>${(task.award || "-").replace(/\n/g, "<br>")}</td>
          </tr>
          ${task.remark ? `<tr><td><p><strong>備註：</strong></p></td><td>${task.remark}</td></tr>` : ""}
          ${imageRow} 
        </table>
      `;
      tabContent.appendChild(card);
    });

    contentContainer.appendChild(tabContent);
    firstTab = false;
  });

  // 7. 分頁切換邏輯
  tabBar.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      tabBar.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      contentContainer.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });
}