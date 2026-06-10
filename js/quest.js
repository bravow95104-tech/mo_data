import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let allQuestData = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. 從 Supabase 載入資料
    async function loadQuests() {
        try {
            const { data, error } = await supabase
                .from('quests')
                .select('*')
                .order('sort_id', { ascending: true });

            if (error) throw error;

            // 將 quest_id 映射回 id 以保持與現有程式碼相容
            allQuestData = data.map(item => ({
                ...item,
                id: item.quest_id 
            }));

            renderQuests(allQuestData);
        } catch (err) {
            console.error("❌ 載入失敗：", err);
            const container = document.getElementById("starContainer");
            if (container) container.innerHTML = "<div class='no-results'>無法載入任務資料，請稍後再試。</div>";
        }
    }

    loadQuests();

    // 2. 監聽搜尋與篩選邏輯 (保持不變)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // 加入簡單的防抖
            clearTimeout(window.searchTimer);
            window.searchTimer = setTimeout(applyFilters, 300);
        });
    }

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
 */
function formatContent(text) {
    if (!text) return "-";
    let formatted = text.replace(/\n/g, "<br>");
    return formatted.replace(/\^&(.*?)&\^/g, '<span class="quest-highlight">$1</span>');
}

/**
 * ✅ 核心：搜尋過濾
 */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeType = activeBtn ? activeBtn.dataset.type : null;
    const activeValue = activeBtn ? activeBtn.dataset.value : null;

    const filtered = allQuestData.filter(task => {
        const cleanId = (task.id || "").replace(/\^&|&\^/g, "");
        const cleanArea = (task.area || "").replace(/\^&|&\^/g, "");
        const cleanAward = (task.award || "").replace(/\^&|&\^/g, "");
        const cleanRestriction = (task.restriction || "").replace(/\^&|&\^/g, "");
        const cleanStart = (task.start || "").replace(/\^&|&\^/g, "");
        const cleanProcess = (task.process || "").replace(/\^&|&\^/g, "");
        const cleanRemark = (task.remark || "").replace(/\^&|&\^/g, "");
        
        const searchStr = [cleanId, cleanArea, cleanStart, cleanAward, cleanRestriction, cleanProcess, cleanRemark].join("|").toLowerCase();
        const matchKeyword = searchStr.includes(keyword);

        let matchButton = true;
        if (activeType === 'process_renown') {
            matchButton = String(task.process_renown || "") === activeValue;
        } else if (activeType === 'star') {
            // 這裡 task.star 可能是標籤或連續任務名稱
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

    const questWrapper = document.createElement("div");
    questWrapper.className = "quest-system-container";
    container.appendChild(questWrapper);

    data.forEach(task => {
        const card = document.createElement("div");
        card.className = "mission-card";

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
            // 處理可能是完整 URL 或檔名的情況
            const imgSrc = task.image.startsWith('http') ? task.image : `/mo_data/pic/quest/${task.image.toLowerCase()}`;
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
