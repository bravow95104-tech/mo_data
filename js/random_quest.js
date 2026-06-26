import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allRandomQuestData = [];
let activeFilters = {
  location: null,
  quest_type: null,
  search: ""
};

// === 🚀 完美絲滑版：動態計算實際高度與收放 ===
window.toggleQuestCard = function(cardElement) {
  const cardBody = cardElement.querySelector('.quest-card-body');
  if (!cardBody) return;

  cardElement.classList.toggle('active');

  if (cardElement.classList.contains('active')) {
    // 展開時：計算真實內文總高度
    cardBody.style.maxHeight = cardBody.scrollHeight + "px";
  } else {
    // 收合時：確保從真實高度完美歸零
    cardBody.style.maxHeight = cardBody.scrollHeight + "px";
    cardBody.offsetHeight; // 強制刷新瀏覽器佈局
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
      .select('*')
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

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const type = this.getAttribute("data-type");
      const value = this.getAttribute("value" || "data-value");

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
    const rewardArray = q.rewards ? q.rewards.split(/[、,]/) : [];
    const rewardTagsHTML = rewardArray.map(item => 
      item.trim() ? `<span class="reward-item-tag">${item.trim()}</span>` : ''
    ).join('');

    return `
      <div class="random-quest-card" onclick="toggleQuestCard(this)">
        <div class="quest-card-header">
          <div class="quest-main-info">
            <div class="quest-title-row">
              <span class="quest-type-badge">${q.quest_type || '隨機'}</span>
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
                <span class="target-label"><i class="fa-solid fa-skull-crossbones"></i> 目標怪物</span>：
                <span class="target-value">${q.target_monster || '-'}</span>
              </div>
              <div class="target-item">
                <span class="target-label"><i class="fa-solid fa-box-open"></i> 蒐集道具</span>：
                <span class="target-value">${q.collect_item || '-'}</span>
              </div>
              <div class="target-item">
                <span class="target-label"><i class="fa-solid fa-calculator"></i> 所需數量</span>：
                <span class="target-value-num">${q.amount || '-'}</span>
              </div>
            </div>
            
            <div class="quest-reward-box">
              <div class="reward-title">🎁 任務結算獎勵</div>
              <div class="reward-row">
                <div class="reward-exp">經驗值：<span>${q.exp ? '+' + Number(q.exp).toLocaleString() : '-'}</span></div>
                <div class="reward-items">
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
  const header = document.querySelector(".accordion-header");
  const content = document.querySelector(".accordion-content");
  if (header && content) {
    header.addEventListener("click", () => {
      content.classList.toggle("active");
      header.classList.toggle("active");
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