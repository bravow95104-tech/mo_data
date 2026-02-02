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
        
        const searchStr = [cleanId, cleanArea, task.start, cleanAward].join("|").toLowerCase();
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
        container.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>找不到相符的任務內容</p>";
        return;
    }

    data.forEach(task => {
        const card = document.createElement("div");
        card.className = "mission-card";

        // 💰 獎勵處理
        const rewardParts = [];
        if (task.process_exp)    rewardParts.push(`<strong>經驗：</strong>${task.process_exp} 點`);
        if (task.process_money)  rewardParts.push(`<strong>金錢：</strong>${task.process_money} 元`);
        if (task.process_renown) rewardParts.push(`<strong>名聲：</strong>${task.process_renown} 點`);
        if (task.process_item)   rewardParts.push(`<strong>物品：</strong>${formatContent(task.process_item)}`);
        if (task.process)        rewardParts.push(`<strong>獎勵細節：</strong><br>${formatContent(task.process)}`);

        let rewardHtml = rewardParts.length > 0 ? `
            <tr>
                <td style="vertical-align: top;"><strong>任務獎勵：</strong></td>
                <td>${rewardParts.join("<br>")}</td>
            </tr>` : "";

        let imageRow = "";
        if (task.image) {
            const imgSrc = `/mo_data/pic/quest/${task.image.toLowerCase()}`;
            imageRow = `<tr><td><strong>任務參考圖：</strong></td><td><img src="${imgSrc}" class="mission-img" onerror="this.closest('tr').style.display='none'"></td></tr>`;
        }

        card.innerHTML = `
            <div class="mission-badge" style="float:right; background:#3399ff; color:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">
                ${task.star || "一般任務"}
            </div>
            <h3 style="color: #3399ff; margin-bottom:10px;">${task.id || "未命名任務"}</h3>
            <table class="mission-table">
                <tr><td style="width: 120px;"><strong>任務地區：</strong></td><td>${task.area || "-"}</td></tr>
                <tr><td><strong>起始 NPC：</strong></td><td>${formatContent(task.start)}</td></tr>
                <tr><td><strong>任務條件：</strong></td><td>${formatContent(task.restriction)}</td></tr>
                <tr><td><strong>任務流程：</strong></td><td>${formatContent(task.award)}</td></tr>
                ${rewardHtml}
                ${task.remark ? `<tr><td><strong>備註：</strong></td><td>${formatContent(task.remark)}</td></tr>` : ""}
                ${imageRow}
            </table>
        `;
        container.appendChild(card);
    });
}