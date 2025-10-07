// 假設你的 JSON 在 /mo_data/data/star_quest.json
fetch("/mo_data/data/star_quest.json")
  .then(res => res.json())
  .then(data => initStarTasks(data))
  .catch(err => {
    console.error("❌ JSON 載入失敗：", err);
    document.getElementById("starContainer").innerHTML = "<p>無法載入任務資料</p>";
  });
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
function initStarTasks(data) {
  const container = document.getElementById("starContainer");

  // 依 "star" 分組
  const grouped = {};
  data.forEach(task => {
    if (!grouped[task.star]) grouped[task.star] = [];
    grouped[task.star].push(task);
  });

  // 建立每個主題區塊
  Object.keys(grouped).forEach(starName => {
    const section = document.createElement("div");
    section.className = "star-section";

    const header = document.createElement("div");
    header.className = "star-header";
    header.textContent = starName;

    const content = document.createElement("div");
    content.className = "star-content";

    // 每個主題內的小任務
    grouped[starName].forEach(task => {
      const card = document.createElement("div");
      card.className = "mission-card";
      card.innerHTML = `
        <h3>${task.star_q}</h3>
        <table class="mission-table">
          <tr><td><strong>任務地區：</strong></td><td>${task.strat || "-"}</td></tr>
          <tr><td><strong>任務條件：</strong></td><td>${task.restriction || "-"}</td></tr>
          <tr><td><strong>任務流程：</strong></td><td>${task.process.replace(/\n/g, "<br>")}</td></tr>
          <tr><td><strong>任務獎勵：</strong></td><td>${task.award || "-"}</td></tr>
          ${task.remark ? `<tr><td><strong>備註：</strong></td><td>${task.remark}</td></tr>` : ""}
        </table>
      `;
      content.appendChild(card);
    });

    // 點主題展開/收合
    header.addEventListener("click", () => {
      const open = content.style.display === "block";
      document.querySelectorAll(".star-content").forEach(c => (c.style.display = "none"));
      content.style.display = open ? "none" : "block";
    });

    section.appendChild(header);
    section.appendChild(content);
    container.appendChild(section);
  });
}