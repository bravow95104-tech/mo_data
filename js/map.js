// === 1. 全域變數 ===
let mapData = [];

// === 2. 核心初始化 ===
document.addEventListener("DOMContentLoaded", () => {
    // 載入 JSON 資料
    fetch("/mo_data/data/detailed_map.json")
        .then((res) => res.json())
        .then((json) => {
            mapData = Array.isArray(json) ? json : json.data;
            console.log("✅ 地圖資料載入完成");

            // [HTML1 邏輯] 如果頁面有表格，進行初次渲染
            if (document.querySelector("#heroes-table tbody")) {
                initTableSearch();
            }
        })
        .catch((err) => console.error("❌ 載入失敗：", err));

    // [HTML2 邏輯] Tab 切換與 Image Map 縮放
    initMapTabs();
    initImageMapResizer();
    
    // 綁定基礎 Modal 事件
    bindModalEvents();
});

// === 3. [HTML1 專屬] 表格與搜尋邏輯 ===
function initTableSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    // 初次渲染全資料
    renderTable(mapData);

    // 監聽輸入事件
    searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        const filtered = mapData.filter(item => {
            return (
                (item.mapid && item.mapid.toLowerCase().includes(keyword)) ||
                (item.drop_rubbish && item.drop_rubbish.includes(keyword)) ||
                (item.drop_hero && item.drop_hero.includes(keyword))
            );
        });
        renderTable(filtered);
    });
}

function renderTable(data) {
    const tbody = document.querySelector("#heroes-table tbody");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">找不到相符的地圖資料</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr onclick="openMapDetail('${item.mapid}')" style="cursor:pointer;">
            <td><strong>${item.mapid}</strong></td>
            <td>${item.drop_rubbish || "-"}</td>
            <td>${item.drop_equidcard || "-"}</td>
            <td>${item.drop_hero || "-"}</td>
            <td>${item.drop_glory_player || item.drop_glory_high || "-"}</td>
        </tr>
    `).join('');
}

// === 4. [HTML2 專屬] 地圖互動邏輯 ===
function initMapTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-button, .tab-content").forEach(el => el.classList.remove("active"));
            button.classList.add("active");
            const target = document.getElementById(button.dataset.tab);
            if (target) {
                target.classList.add("active");
                if (typeof imageMapResize === 'function') {
                    setTimeout(() => imageMapResize('map'), 150);
                }
            }
        });
    });
}

function initImageMapResizer() {
    try {
        if (typeof imageMapResize === 'function' && document.querySelector('map')) {
            imageMapResize('map');
        }
    } catch (e) { console.warn("Resizer skipped"); }
}

// === 5. 彈窗渲染邏輯 (共用) ===
window.openMapDetail = function(mapId) {
    const item = mapData.find(m => m.mapid === mapId);
    if (!item) return;

    const modalContent = document.getElementById("modalContent");
    const autoImagePath = `/mo_data/pic/map/${item.mapid}.jpg`;
    
    // 判斷邏輯
    const approachA = item.approach_a || "";
    const isTown = approachA.includes("城鎮");
    const showApproach = approachA.includes("要");
    const showExplain = approachA.includes("說明");

    // 掉落與戰鬥區塊 (條件隱藏)
    let combatAndDropHTML = '';
    if (!isTown) {
        const hasDrop = !!(item.drop_rubbish || item.drop_hero || item.drop_equidcard || item.drop_combo_old || item.drop_combo_new);
        combatAndDropHTML = `
            <div class="hero-defdodge section-gap">
                <p><strong>怪物等級：</strong>${item.maplv || "N/A"}</p>
                <p><strong>防禦：</strong>${item.def || "N/A"}　<strong>閃避：</strong>${item.dodge || "N/A"}</p>
            </div>
            ${hasDrop ? `
                <div class="hero-column-details">
                    <p><strong>掉落物品：</strong></p>
                    ${item.drop_rubbish ? `<p><strong>◢ 垃圾：</strong>${item.drop_rubbish}</p>` : ""}
                    ${item.drop_hero ? `<p><strong>◢ 英雄卡：</strong>${item.drop_hero}</p>` : ""}
                    ${item.drop_equidcard ? `<p><strong>◢裝備卡：</strong>${item.drop_equidcard}</p>` : ""}
                </div>` : ""
            }
            <div class="hero-column-details">
                <p><strong>光輝資訊：</strong></p>
                <p><strong>◢ 掉落較高：</strong>${item.drop_glory_high || "N/A"}</p>
                <p><strong>◢ 掉落較低：</strong>${item.drop_glory_low || "N/A"}</p>
                ${item.drop_glory_player ? `<p><strong>◢ 玩家提供：</strong>${item.drop_glory_player}</p>` : ""}
            </div>
        `;
    }

    modalContent.innerHTML = `
        <h2 class="hero-name">${item.mapid}</h2>
        <img src="${autoImagePath}" class="hero-image" onerror="this.style.display='none'" />
        <div class="hero-column-details">
        ${showApproach ? `<div class="section-gap"><p><strong>走法：</strong>${item.approach}</p></div>` : ""}
        ${showExplain ? `<div class="section-gap"><p><strong>說明：</strong>${item.illustrate}</p></div>` : ""}
        </div>
        ${combatAndDropHTML}
        
    `;

    showModal();
};

// === 6. Modal 基礎控制 ===
function showModal() {
    document.getElementById("modalOverlay").style.display = "block";
    document.getElementById("modalBox").style.display = "block";
}

function closeModal() {
    const box = document.getElementById("modalBox");
    box.style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
    box.classList.remove("modal-large-mode");
}

function bindModalEvents() {
    const overlay = document.getElementById("modalOverlay");
    const closeBtn = document.querySelector(".close-btn");
    if (overlay) overlay.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
}

// 世界地圖放大
window.zoomWorldMap = function(src) {
    const box = document.getElementById("modalBox");
    box.classList.add("modal-large-mode");
    document.getElementById("modalContent").innerHTML = `
        <h2 class="hero-name">世界地圖全圖</h2>
        <div class="world-map-zoom-container"><img src="${src}" class="world-map-large-img"></div>
    `;
    showModal();
};