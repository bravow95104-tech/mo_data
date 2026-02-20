// 全域變數
let mapData = [];

// 將關閉函式移到最外面，確保全域都能呼叫
function closeModal() {
  const modalBox = document.getElementById("modalBox");
  const modalOverlay = document.getElementById("modalOverlay");
  if (!modalBox || !modalOverlay) return;

  modalOverlay.style.display = "none";
  modalBox.style.display = "none";
  
  // 恢復 Modal 原始寬度設定（避免世界地圖的 75% 殘留）
  modalBox.style.maxWidth = "600px";
  modalBox.style.width = "90%";
}

document.addEventListener("DOMContentLoaded", () => {
  // === 1. 載入 JSON (維持原樣) ===
  fetch("/mo_data/data/detailed_map.json")
    .then((res) => res.json())
    .then((json) => {
      mapData = Array.isArray(json) ? json : json.data;
      console.log("✅ 地圖詳細資料載入完成");
    })
    .catch((err) => console.error("❌ 載入失敗：", err));

  // === 2. Tab 切換邏輯 (修正點) ===
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      const targetTabId = button.dataset.tab;
      const targetContent = document.getElementById(targetTabId);

      if (targetContent) {
        targetContent.classList.add("active");
        
        // 🚀 重要修正：切換 Tab 後，圖片顯示出來了，此時重新計算 Image Map 座標
        if (typeof imageMapResize === 'function') {
          // 給瀏覽器一點點渲染時間 (100ms) 再計算
          setTimeout(() => { imageMapResize(); }, 100);
        }
      }
    });
  })
  document.addEventListener("keydown", (e) => {
    // 檢查按下的是否為 Esc 鍵 (或是舊版瀏覽器的 'Escape')
    if (e.key === "Escape" || e.key === "Esc") {
        const modalBox = document.getElementById("modalBox");
        
        // 只有在 Modal 顯示的時候才執行關閉，避免多餘的操作
        if (modalBox && modalBox.style.display === "block") {
            closeModal();
        }
    }
  });

// === 3. 初始化 Image Map 縮放 ===
try {
  // 檢查插件是否存在，且確保只針對有效的 <map> 標籤執行
  const allMaps = document.querySelectorAll('map');
  if (typeof imageMapResize === 'function' && allMaps.length > 0) {
    // 傳入選擇器字串而非物件，這對插件來說比較安全
    imageMapResize('map'); 
    console.log("✅ Image Map 自動縮放已啟動");
  }
} catch (err) {
  console.error("❌ ImageMapResizer 執行異常:", err);
}

// 視窗改變時的監聽也加上判斷
window.addEventListener('resize', () => {
  if (typeof imageMapResize === 'function' && document.querySelectorAll('map').length > 0) {
    imageMapResize('map');
  }
});

  // === 4. 綁定關閉事件 ===
  const closeBtn = document.querySelector("#modalBox .close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", closeModal);
});

// === 5. 彈窗與世界地圖函式 (掛載到 window 確保 HTML 呼叫得到) ===
window.openMapDetail = function(mapId) {
  if (!mapData.length) return;
  const item = mapData.find((i) => i.mapid === mapId);
  if (item) showDetailModal(item);
};

// 修改後的世界地圖放大函式
// 🚀 修改後的世界地圖放大函式
window.zoomWorldMap = function(src) {
    const modalBox = document.getElementById("modalBox");
    const modalContent = document.getElementById("modalContent");
    const modalOverlay = document.getElementById("modalOverlay");
    
    if (!modalBox || !modalContent) return;

    // 先把之前 closeModal 留下的手動寬度清空，讓 CSS 接手
    modalBox.style.maxWidth = ""; 
    modalBox.style.width = "";

    // 加上 Class 讓 CSS 控制外觀
    modalBox.classList.add("modal-large-mode");

    modalContent.innerHTML = `
        <h2 class="hero-name">世界地圖全圖</h2>
        <div class="world-map-zoom-container">
            <img src="${src}" class="world-map-large-img" alt="世界地圖">
        </div>
    `;

    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    modalBox.scrollTop = 0;
};

// 🚀 核心修正：簡單乾淨的關閉函式
function closeModal() {
    const modalBox = document.getElementById("modalBox");
    const modalOverlay = document.getElementById("modalOverlay");
    
    if (!modalBox || !modalOverlay) return;

    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
    
    // 只移除 Class，不要去寫 style.maxWidth = "600px"！
    modalBox.classList.remove("modal-large-mode");
}

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
    ${(item.drop_rubbish || item.drop_hero || item.drop_equidcard || item.drop_combo_old || item.drop_combo_new) ? `
    <div class="hero-column-details">
    <div style="width: 100%;">
    ${item.drop_rubbish ? `<p><strong>垃圾:</strong> ${item.drop_rubbish}</p>`: ""}
    <div class="section-gap">
    ${item.drop_hero ? `<p><strong>英雄卡：</strong><span class="value">${item.drop_hero}</span></p>`: ""}
    </div>
    <div class="section-gap">
    ${item.drop_equidcard ? `<p><strong>裝備卡：</strong><span class="value">${item.drop_equidcard}</span></p>`: ""}
    </div>
    <div class="section-gap">
    ${item.drop_combo_old ? `<p><strong>舊文片：</strong><span class="value">${item.drop_combo_old}</span></p>`: ""}
    </div>
    <div class="section-gap">
    ${item.drop_combo_new ? `<p><strong>新文片：</strong><span class="value">${item.drop_combo_new}</span></p>`: ""}
    </div>
</div></div>` : ""}
<div class="hero-column-details">
    <div class="section-gap">
    <p><strong>光輝(掉落較多)：</strong><span class="value">${item.drop_glory_high || "N/A"}</span></p>
    </div>
    <div class="section-gap">
    <p><strong>光輝(掉落較低)：</strong><span class="value">${item.drop_glory_low || "N/A"}</span></p>
    </div>
    <div class="section-gap">
    ${item.drop_glory_player ? `<p><strong>光輝(玩家提供)：</strong><span class="value">${item.drop_glory_player}</span></p>`: ""}
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
