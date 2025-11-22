// 全域變數：儲存 map 資料
let mapData = []; 

document.addEventListener("DOMContentLoaded", () => {
    // === 1. 載入詳細資料 JSON ===
    // 請確認這個 JSON 檔案路徑是否正確
    fetch("/mo_data/data/detailed_map.json")
        .then(res => {
            if (!res.ok) throw new Error("載入 detailed_map.json 失敗");
            return res.json();
        })
        .then(json => {
            // 相容處理：判斷 JSON 是直接陣列還是包在 data 物件裡
            mapData = Array.isArray(json) ? json : json.data;
            console.log("✅ 地圖詳細資料載入完成:", mapData.length, "筆");
        })
        .catch(err => {
            console.error("❌ 詳細資料 JSON 載入失敗：", err);
            // 可以在這裡把錯誤訊息顯示在頁面上，如果需要的話
        });

    // === 2. Tab 切換邏輯 ===
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按鈕和內容區塊的 active 狀態
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 為當前點擊的按鈕和對應的內容區塊添加 active 狀態
            button.classList.add('active');
            const targetTabId = button.dataset.tab;
            
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.add('active');
            } else {
                console.warn(`找不到 ID 為 ${targetTabId} 的內容區塊`);
            }
        });
    });

    // === 3. Modal 關閉邏輯 ===
      // === 關閉 Modal ===
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

    modalContent.innerHTML = `
        <h2 class="hero-name">${item.mapid || 'N/A'}</h2>
        <img src="${autoImagePath}" 
             alt="${item.mapid || '地圖圖片'}" 
             class="hero-image" 
   onerror="this.style.display='none'" />
        <div class="hero-column-details">
            <div style="width: 100%;">
                <p><strong>垃圾掉落:</strong> ${item.drop_rubbish || 'N/A'}</p>
                <div class="section-gap">
                <p><strong>光輝掉落(掉落較多)：</strong><span class="value">${item.drop_glory_high || 'N/A'}</span></p>
                </div>
                <div class="section-gap">
                <p><strong>光輝掉落(掉落較低)：</strong><span class="value">${item.drop_glory_low || 'N/A'}</span></p>
                </div>
                <div class="section-gap">
                <p><strong>光輝掉落(玩家提供)：</strong><span class="value">-</span></p>
                </div>
            </div>
        </div>
  `;
    
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
    const item = mapData.find(i => i.mapid === mapId);
    if (item) {
        showDetailModal(item);
    } else { 
    }
}