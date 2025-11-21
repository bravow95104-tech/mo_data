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
    const closeModal = () => {
        const overlay = document.getElementById("modalOverlay");
        const box = document.getElementById("modalBox");
        if(overlay) overlay.style.display = "none";
        if(box) box.style.display = "none";
    };
    
    const closeBtn = document.querySelector("#modalBox .close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    
    const overlay = document.getElementById("modalOverlay");
    if (overlay) overlay.addEventListener("click", closeModal);
});

// === 4. 彈窗內容填充函數 ===
function showDetailModal(item) {
    const modalContent = document.getElementById("modalContent");
    if (!modalContent) return;

    // 使用反引號 (`) 方便寫多行 HTML
    modalContent.innerHTML = `
        <h2 class="hero-name">${item.mapid || 'N/A'}</h2>
        <div class="hero-column-details">
            <div>
                <p><strong>等級:</strong> ${item.maplv || 'N/A'}</p>
                <p><strong>垃圾掉落:</strong> ${item.drop_rubbish || 'N/A'}</p>
                <p class="section-gap"><strong>光輝掉落(掉落較多)：</strong><span>${item.drop_glory_high || 'N/A'}</span></p>
                <p class="section-gap"><strong>光輝掉落(掉落較低)：</strong><span>${item.drop_glory_low || 'N/A'}</span></p>
                <p class="section-gap"><strong>光輝掉落(玩家提供)：</strong>-</p>
            </div>
            ${item.image ? `<img src="${item.image}" alt="${item.mapid}" class="hero-image" />` : ''}
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
        console.warn(`未找到 mapId: ${mapId} 的詳細資料。`);
        alert(`地圖區域 [${mapId}] 尚未有詳細資訊。`);
    }
}