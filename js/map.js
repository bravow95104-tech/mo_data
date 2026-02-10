// 全域變數：儲存 map 資料
let mapData = [];

document.addEventListener("DOMContentLoaded", () => {
  // === 1. 載入詳細資料 JSON ===
  // 請確認這個 JSON 檔案路徑是否正確
  fetch("/mo_data/data/detailed_map.json")
    .then((res) => {
      if (!res.ok) throw new Error("載入 detailed_map.json 失敗");
      return res.json();
    })
    .then((json) => {
      // 相容處理：判斷 JSON 是直接陣列還是包在 data 物件裡
      mapData = Array.isArray(json) ? json : json.data;
      console.log("✅ 地圖詳細資料載入完成:", mapData.length, "筆");
    })
    .catch((err) => {
      console.error("❌ 詳細資料 JSON 載入失敗：", err);
      // 可以在這裡把錯誤訊息顯示在頁面上，如果需要的話
    });

  // === 2. Tab 切換邏輯 ===
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 移除所有按鈕和內容區塊的 active 狀態
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // 為當前點擊的按鈕和對應的內容區塊添加 active 狀態
      button.classList.add("active");
      const targetTabId = button.dataset.tab;

      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add("active");
      } else {
        console.warn(`找不到 ID 為 ${targetTabId} 的內容區塊`);
      }
    });
  });

  // === 3. Modal 關閉邏輯 ===
  function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("modalBox").style.display = "none";
  }

  const closeBtn = document.querySelector("#modalBox .close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", closeModal);
});

// === 4. 彈窗內容填充函數 ===
function showDetailModal(item) {
    const modalContent = document.getElementById("modalContent");
    if (!modalContent) return;

    const autoImagePath = `/mo_data/pic/map/${item.mapid}.jpg`;
    
    // 檢查 item.approach_a 是否存在，並轉為大寫以進行彈性判斷（可選，但推薦）
    const approachA = item.approach_a || ""; // 如果沒有值，設為空字串避免錯誤
    
    // 🚀 關鍵修改：使用 includes() 允許複合字串，並設定邏輯標籤
    // 隱藏功能優先：只要包含「城鎮」就隱藏戰鬥和掉落資訊
    const shouldHideCombatAndDrop = approachA.includes("城鎮"); 
    
    // 顯示邏輯：判斷是否包含 "要" 或 "說明"
    const shouldShowCaveApproach = approachA.includes("要"); 
    const shouldShowExplain = approachA.includes("說明"); 
    
    // ----------------------------------------
    // 1. 構建 走法/說明 HTML 區塊
    // ----------------------------------------
    let utilityHTML = "";

    // 確保走法和說明只顯示一個 (走法優先於說明)
    if (shouldShowCaveApproach) {
    // 當 approach_a 包含 "要" 時，顯示走法
    utilityHTML = `
    <div class="hero-approach section-gap">
    <p class="approach-line-wrap">
    <span class="approach-label">走法：</span>
    <span class="approach-content pre-formatted-text">${item.approach || "無資料"}</span>
    </p>
    </div>
    `;
    } else if (shouldShowExplain) {
    // 當 approach_a 包含 "說明" 且不包含 "要" 時，顯示說明
    utilityHTML = `
    <div class="hero-explain section-gap">
    <p class="explain-line-wrap">
    <span class="explain-label">說明：</span>
    <span class="explain-content pre-formatted-text">${item.illustrate || "無資料"}</span>
    </p>
    </div>
    `;
    }
    
    // ----------------------------------------
    // 2. 構建 防禦/掉落 HTML 區塊 (隱藏功能優先)
    // ----------------------------------------
    let combatAndDropHTML = '';
    if (!shouldHideCombatAndDrop) { // 只要不包含「城鎮」，就顯示
    combatAndDropHTML = `
    <div class="hero-defdodge section-gap">
    <p><strong>怪物等級：</strong>${item.maplv || "N/A"}</p>
    <p><strong>防禦：</strong>${item.def || "N/A"}<strong>　　閃避：</strong>${item.dodge || "N/A"}</p>
    </div>
    
    <div class="hero-column-details">
    <div style="width: 100%;">
    <p><strong>垃圾掉落:</strong> ${item.drop_rubbish || "N/A"}</p>
    <div class="section-gap">
    <p><strong>光輝掉落(掉落較多)：</strong><span class="value">${item.drop_glory_high || "N/A"}</span></p>
    </div>
    <div class="section-gap">
    <p><strong>光輝掉落(掉落較低)：</strong><span class="value">${item.drop_glory_low || "N/A"}</span></p>
    </div>
    <div class="section-gap">
    <p><strong>光輝掉落(玩家提供)：</strong><span class="value">-</span></p>
    </div>
    </div>
    </div>
    `;
    }
    
    // ----------------------------------------
    // 3. 組合最終 HTML
    // ----------------------------------------
    modalContent.innerHTML = `
    <h2 class="hero-name">${item.mapid || "N/A"}</h2>
    <img src="${autoImagePath}" 
    alt="${item.mapid || "地圖圖片"}" 
    class="hero-image" 
    onerror="this.style.display='none'" />
    ${utilityHTML}
    ${combatAndDropHTML}`;

    document.getElementById("modalOverlay").style.display = "block";
    document.getElementById("modalBox").style.display = "block";
}

// === 5. Image Map 點擊觸發函數 (全域函數，供 HTML onclick 調用) ===
function openMapDetail(mapId) {
  if (!mapData || mapData.length === 0) {
    console.error("地圖資料 (mapData) 尚未載入。");
    alert("資料尚未準備好，請稍候再試。");
    return;
  }
  const item = mapData.find((i) => i.mapid === mapId);
  if (item) {
    showDetailModal(item);
  } else {
    // Handle case where item is not found if needed
  }
}

// 專屬：世界地圖放大功能
function zoomWorldMap(src) {
    const modalContent = document.getElementById("modalContent");
    const modalBox = document.getElementById("modalBox");
    if (!modalContent || !modalBox) return;

    // 🚀 重點：針對大圖片調整 Modal 寬度
    // 將 max-width 設為視窗寬度的 85% (這樣圖片就能呈現約原圖 75%~85% 的視覺大小)
    modalBox.style.maxWidth = "75%"; 
    modalBox.style.width = "auto";   // 讓寬度隨內容撐開

    modalContent.innerHTML = `
        <h2 class="hero-name">世界地圖 (原始尺寸縮放)</h2>
        <div class="world-map-zoom-container">
            <img src="${src}" class="world-map-large-img" />
        </div>
    `;

    document.getElementById("modalOverlay").style.display = "block";
    modalBox.style.display = "block";
}

// 🚀 修改原本的 closeModal 函式
// 確保下次打開普通地圖時，寬度會變回原本的 600px
function closeModal() {
    const modalBox = document.getElementById("modalBox");
    document.getElementById("modalOverlay").style.display = "none";
    modalBox.style.display = "none";
    
    // 恢復原始設定
    modalBox.style.maxWidth = "600px";
    modalBox.style.width = "90%";
}