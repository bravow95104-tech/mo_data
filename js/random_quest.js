import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allRandomQuestData = [];
let activeFilters = {
  location: null,
  quest_type: null,
  search: ""
};

// === 🚀 修正版：限定點擊標題列才觸發收放 ===
window.toggleQuestCard = function(headerElement) {
  // 透過 header 找到它的上一層，也就是大外殼 .random-quest-card
  const cardElement = headerElement.parentElement; 
  const cardBody = cardElement.querySelector('.quest-card-body');
  if (!cardBody) return;

  cardElement.classList.toggle('active');

  if (cardElement.classList.contains('active')) {
    // 展開
    cardBody.style.maxHeight = cardBody.scrollHeight + "px";
  } else {
    // 收合
    cardBody.style.maxHeight = cardBody.scrollHeight + "px";
    cardBody.offsetHeight; // 強制刷新
    cardBody.style.maxHeight = "0";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initAccordion();
  initBackToTop();
  loadRandomQuests();
  initSearchInput();
});

async function loadRandomQuests() {
  try {
    const { data, error } = await supabase
      .from('random_quest')
      .select('id, sort_id, quest_name, quest_type, quest_lv, location, target_monster, collect_item, amount, exp, rewards, map_id, zone_name')
      .order('sort_id', { ascending: true });

    if (error) throw error;
    allRandomQuestData = data || [];

    renderFilterButtons();
    renderQuestCards();
  } catch (err) {
    console.error("❌ 隨機任務載入失敗：", err);
    const container = document.getElementById("starContainer");
    if (container) container.innerHTML = "<div class='no-results'>無法載入隨機任務，請確認資料庫連線。</div>";
  }
}

// ─── 修正點：精準抓取 data-value 讓按鈕篩選發揮作用 ───
function renderFilterButtons() {
  const areaContainer = document.getElementById("areaFilterContainer");
  const typeContainer = document.getElementById("typeFilterContainer");

  const areas = [...new Set(allRandomQuestData.map(q => q.location).filter(Boolean))];
  const types = [...new Set(allRandomQuestData.map(q => q.quest_type).filter(Boolean))];

  if (areaContainer) {
    areaContainer.innerHTML = areas.map(area => 
      `<button class="filter-btn" data-type="location" data-value="${area}">${area}</button>`
    ).join('');
  }

  if (typeContainer) {
    typeContainer.innerHTML = types.map(type => 
      `<button class="filter-btn" data-type="quest_type" data-value="${type}">${type}</button>`
    ).join('');
  }

  // 修正：修正 getAttribute 確保點擊後能精準過濾
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const type = this.getAttribute("data-type");
      const value = this.getAttribute("data-value"); // ✨ 修正這一行

      if (this.classList.contains("active")) {
        this.classList.remove("active");
        activeFilters[type] = null;
      } else {
        this.parentElement.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        activeFilters[type] = value;
      }
      renderQuestCards();
    });
  });

  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      activeFilters.location = null;
      activeFilters.quest_type = null;
      activeFilters.search = "";
      document.getElementById("searchInput").value = "";
      renderQuestCards();
    });
  }
}

function initSearchInput() {
  const input = document.getElementById("searchInput");
  if (input) {
    input.addEventListener("input", (e) => {
      activeFilters.search = e.target.value.trim().toLowerCase();
      renderQuestCards();
    });
  }
}

// ─── 優化點：重整內容排版，使標籤與冒號貼合、寬度彈性不跳行 ───
function renderQuestCards() {
  const container = document.getElementById("starContainer");
  if (!container) return;

  const filteredData = allRandomQuestData.filter(q => {
    if (activeFilters.location && q.location !== activeFilters.location) return false;
    if (activeFilters.quest_type && q.quest_type !== activeFilters.quest_type) return false;
    if (activeFilters.search) {
      const s = activeFilters.search;
      return (
        q.quest_name?.toLowerCase().includes(s) ||
        q.location?.toLowerCase().includes(s) ||
        q.quest_type?.toLowerCase().includes(s) ||
        q.target_monster?.toLowerCase().includes(s) ||
        q.collect_item?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (filteredData.length === 0) {
    container.innerHTML = "<div class='no-results'>找不到符合條件的隨機任務。</div>";
    return;
  }

  container.innerHTML = filteredData.map(q => {
    const rewardArray = q.rewards ? q.rewards.split(/[,]/) : [];
    const rewardTagsHTML = rewardArray.map(item => 
      item.trim() ? `<span class="reward-item-tag">${item.trim()}</span>` : ''
    ).join('');

    return `
      <div class="random-quest-card">
        <div class="quest-card-header" onclick="toggleQuestCard(this)">
          <div class="quest-main-info">
            <div class="quest-title-row">
            
            <img src="${iconPath}" 
               class="quest-type-icon" 
               onerror="this.src='assets/items/default.png'" 
               alt="${q.collect_item}">

              <span class="quest-type-tag ${getTagClass(q.quest_type)}">${q.quest_type || '隨機'}</span>
              <h3 class="quest-title">${q.quest_name}</h3>
              <span class="quest-lv-tag">${q.quest_lv ? 'Lv.' + q.quest_lv : ''}</span>
            </div>
            <div class="quest-sub-row">
              <span><i class="fa-solid fa-map-location-dot"></i> 地點：${q.location || '-'}</span>
            </div>
          </div>
          
          <div class="quest-arrow">
            <i class="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div class="quest-card-body">
          <div class="quest-divider"></div>
          <div class="quest-detail-grid">
            <div class="quest-target-box">
              <div class="target-item">
                <span class="target-label"><i class="fa-solid fa-skull-crossbones"></i> 目標怪物：</span>
                <span class="target-value">${q.target_monster || '-'}</span>
              </div>
              <div class="target-item">
                <span class="target-label"><i class="fa-solid fa-box-open"></i> 蒐集道具：</span>
                <span class="target-value">${q.collect_item || '-'}</span>
              </div>
              <div class="target-item">
                <span class="target-label"><i class="fa-solid fa-calculator"></i> 所需數量：</span>
                <span class="target-value-num">${q.amount || '-'}</span>
              </div>
              
              ${q.map_id ? `
              <div class="target-item" style="margin-top: 12px;">
                <span class="target-label"><i class="fa-solid fa-compass"></i> 地圖位置：</span>
                <button class="map-location-btn" 
                        data-map-id="${q.map_id}" 
                        data-zone-name="${q.zone_name || ''}"
                        onclick="event.stopPropagation(); handleMapLocation(this);">
                  <i class="fa-solid fa-map-marked-alt"></i> 前往 ${q.zone_name || '查看地圖'}
                </button>
              </div>
              ` : ''}
            </div>
            
            <div class="quest-reward-box">
              <div class="reward-title">🎁 任務獎勵</div>
              <div class="reward-row">
                <div class="reward-exp">經驗值：<span>${q.exp ? '+' + Number(q.exp).toLocaleString() : '-'}</span></div>
                <div class="reward-items">物品：<span>
                  ${rewardTagsHTML || '<span class="text-secondary">-</span>'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof window.formatMapLinks === 'function') {
    window.formatMapLinks();
  }
}

function initAccordion() {
  const accordion = document.getElementById("filterContainer");
  const header = accordion ? accordion.querySelector(".accordion-header") : null;
  const content = accordion ? accordion.querySelector(".accordion-content") : null;
  
  if (accordion && header && content) {
    // 1. 預設先讓它閉合（加入 collapsed 類別）
    //accordion.classList.add("collapsed");

    // 2. 點擊標題列時切換 .collapsed 類別
    header.addEventListener("click", function() {
      accordion.classList.toggle("collapsed");
    });

    // 3. 防冒泡：點擊裡面的按鈕時，不要觸發到最外層的閉合事件
    content.addEventListener("click", function(e) {
      e.stopPropagation(); 
    });
  }
}

function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 300 ? "block" : "none";
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
// 🎯 放自 random_quest.js 最下方的處理函式：
window.handleMapLocation = function(button) {
  const mapId = button.getAttribute("data-map-id");
  const zoneName = button.getAttribute("data-zone-name");
  
  if (mapId) {
    // 跳轉到地圖頁面，並透過網址參數帶過去 (例如 map.html?mapId=1&zone=妖邪洞一層)
    window.location.href = `/mo_data/map/detailed_map.html?mapId=${mapId}&zone=${encodeURIComponent(zoneName)}`;
  }
  
};
// 確保它在檔案中是獨立存在的函式，不要放在別的函式內
function getTagClass(type) {
    if (!type) return 'tag-common';
    if (type.includes('一般')) return 'tag-common';
    if (type.includes('稀有')) return 'tag-rare';
    if (type.includes('菁英')) return 'tag-elite';
    return 'tag-common'; 
}
