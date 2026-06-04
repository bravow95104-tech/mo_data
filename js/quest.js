let allQuestData = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. 載入資料
    fetch("/mo_data/data/quest.json")
        .then(res => res.json())
        .then(data => {
            allQuestData = data;
            renderQuests(allQuestData); // 初次渲染
        })
        .catch(err => console.error("❌ 載入失敗：", err));

    // 2. 監聽搜尋與篩選邏輯 (保持不變)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
            } else {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            applyFilters();
        });
    });

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            applyFilters();
        });
    }
});

/**
 * ✅ 核心：文字處理函式
 * 功能：處理換行、並將 ^&關鍵字&^ 轉換為 <span class="quest-highlight">關鍵字</span>
 */
function formatContent(text) {
    if (!text) return "-";
    // 1. 先處理換行
    let formatted = text.replace(/\n/g, "<br>");
    // 2. 正規表達式匹配 ^&...&^ 並替換
    // Regex 解釋: \^& 匹配符號起始，(.*?) 抓取中間文字，&\^ 匹配符號結尾
    return formatted.replace(/\^&(.*?)&\^/g, '<span class="quest-highlight">$1</span>');
}

/**
 * ✅ 核心：搜尋過濾
 * 修正：搜尋時必須將 JSON 裡的 ^& 和 &^ 拿掉，否則使用者搜尋不到被標記的字
 */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeType = activeBtn ? activeBtn.dataset.type : null;
    const activeValue = activeBtn ? activeBtn.dataset.value : null;

    const filtered = allQuestData.filter(task => {
        // 取得純文字（移除符號後再比對搜尋）
        const cleanId = (task.id || "").replace(/\^&|&\^/g, "");
        const cleanArea = (task.area || "").replace(/\^&|&\^/g, "");
        const cleanAward = (task.award || "").replace(/\^&|&\^/g, "");
        const cleanRestriction = (task.restriction || "").replace(/\^&|&\^/g, "");
        const cleanStart = (task.start || "").replace(/\^&|&\^/g, "");
        
        // 🔍 修改這裡：加入所有可搜尋欄位
        const searchStr = [cleanId, cleanArea, cleanStart, cleanAward, cleanRestriction].join("|").toLowerCase();
        const matchKeyword = searchStr.includes(keyword);

        let matchButton = true;
        if (activeType === 'process_renown') {
            matchButton = String(task.process_renown || "") === activeValue;
        } else if (activeType === 'star') {
            matchButton = String(task.star || "") === activeValue;
        }

        return matchKeyword && matchButton;
    });

    renderQuests(filtered);
}

// ✅ 渲染函式
function renderQuests(data) {
    const container = document.getElementById("starContainer");
    if (!container) return;
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<div class='no-results'>找不到相符的任務內容</div>";
        return;
    }

    // 建立隔離容器
    const questWrapper = document.createElement("div");
    questWrapper.className = "quest-system-container";
    container.appendChild(questWrapper);

    data.forEach(task => {
        const card = document.createElement("div");
        card.className = "mission-card";

        // 💰 獎勵處理 - 轉換為 Badge 模式
        const rewardBadges = [];
        if (task.process_exp)    rewardBadges.push(`<span class="q-badge q-badge-exp">經驗：${task.process_exp}</span>`);
        if (task.process_money)  rewardBadges.push(`<span class="q-badge q-badge-money">金錢：${task.process_money} 元</span>`);
        if (task.process_renown) rewardBadges.push(`<span class="q-badge q-badge-renown">名聲：${task.process_renown}</span>`);
        
        let rewardHtml = "";
        if (rewardBadges.length > 0 || task.process_item || task.process) {
            rewardHtml = `
                <div class="mission-section">
                    <div class="section-title">任務獎勵</div>
                    <div class="reward-content">
                        <div class="badge-list">${rewardBadges.join("")}</div>
                        ${task.process_item ? `<div class="item-reward"><strong>物品：</strong>${formatContent(task.process_item)}</div>` : ""}
                        ${task.process ? `<div class="reward-detail">${formatContent(task.process)}</div>` : ""}
                    </div>
                </div>`;
        }

        let imageSection = "";
        if (task.image) {
            const imgSrc = `/mo_data/pic/quest/${task.image.toLowerCase()}`;
            imageSection = `<div class="mission-section img-section"><div class="section-title">任務參考圖</div><img src="${imgSrc}" class="mission-img" onerror="this.closest('.img-section').style.display='none'"></div>`;
        }

        card.innerHTML = `
            <div class="mission-header">
                <div class="mission-tag">${task.star || "一般任務"}</div>
                <h3 class="mission-title">${task.id || "未命名任務"}</h3>
            </div>
            
            <div class="mission-body">
                <div class="info-grid">
                    <div class="info-item"><span class="label">任務地區</span><span class="value">${task.area || "-"}</span></div>
                    <div class="info-item"><span class="label">起始 NPC</span><span class="value">${formatContent(task.start)}</span></div>
                </div>

                <div class="mission-section">
                    <div class="section-title">任務條件</div>
                    <div class="section-text">${formatContent(task.restriction)}</div>
                </div>

                <div class="mission-section">
                    <div class="section-title">任務流程</div>
                    <div class="section-text">${formatContent(task.award)}</div>
                </div>

                ${rewardHtml}
                
                ${task.remark ? `
                <div class="mission-section remark-section">
                    <div class="section-title">備註</div>
                    <div class="section-text">${formatContent(task.remark)}</div>
                </div>` : ""}

                ${imageSection}
            </div>
        `;
        questWrapper.appendChild(card);
    });
}