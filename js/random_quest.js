import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
    import { SUPABASE_URL, SUPABASE_KEY } from './js/supabase-config.js'

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // 全域變數放所有的撈取到的原始資料
    let allRandomQuestData = [];
    // 記錄當前使用者點選的篩選器狀態
    let activeFilters = {
      location: null,
      quest_type: null,
      search: ""
    };

    // 掛載點擊折疊展開事件至全域
    window.toggleQuestCard = function(cardElement) {
      cardElement.classList.toggle('active');
    };

    document.addEventListener("DOMContentLoaded", () => {
      // 1. 初始化手風琴折疊控制
      initAccordion();
      // 2. 初始化回到頂部按鈕
      initBackToTop();
      // 3. 從 Supabase 載入數據
      loadRandomQuests();
      // 4. 綁定搜尋輸入框監聽
      initSearchInput();
    });

    // ─── 核心功能：從 Supabase 撈取資料 ───
    async function loadRandomQuests() {
      try {
        const { data, error } = await supabase
          .from('random_quest')
          .select('*')
          .order('sort_id', { ascending: true });

        if (error) throw error;

        allRandomQuestData = data || [];

        // 動態生成「地區」與「種類」的按鈕清單
        renderFilterButtons();
        // 渲染主體卡片
        renderQuestCards();

      } catch (err) {
        console.error("❌ 隨機任務載入失敗：", err);
        const container = document.getElementById("starContainer");
        if (container) container.innerHTML = "<div class='no-results'>無法載入隨機任務，請確認資料庫連線。</div>";
      }
    }

    // ─── 篩選按鈕動態生成 ───
    function renderFilterButtons() {
      const areaContainer = document.getElementById("areaFilterContainer");
      const typeContainer = document.getElementById("typeFilterContainer");

      // 提取不重複的地區與種類
      const areas = [...new Set(allRandomQuestData.map(q => q.location).filter(Boolean))];
      const types = [...new Set(allRandomQuestData.map(q => q.quest_type).filter(Boolean))];

      // 生成地區按鈕
      if (areaContainer) {
        areaContainer.innerHTML = areas.map(area => 
          `<button class="filter-btn" data-type="location" data-value="${area}">${area}</button>`
        ).join('');
      }

      // 生成種類按鈕
      if (typeContainer) {
        typeContainer.innerHTML = types.map(type => 
          `<button class="filter-btn" data-type="quest_type" data-value="${type}">${type}</button>`
        ).join('');
      }

      // 綁定按鈕點擊事件
      document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          const type = this.getAttribute("data-type");
          const value = this.getAttribute("data-value");

          if (this.classList.contains("active")) {
            this.classList.remove("active");
            activeFilters[type] = null;
          } else {
            // 同一組篩選器，先把別人的 active 拔掉 (單選邏輯)
            this.parentElement.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            activeFilters[type] = value;
          }
          renderQuestCards();
        });
      });

      // 清除按鈕點擊事件
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

    // ─── 監聽快速搜尋框 ───
    function initSearchInput() {
      const input = document.getElementById("searchInput");
      if (input) {
        input.addEventListener("input", (e) => {
          activeFilters.search = e.target.value.trim().toLowerCase();
          renderQuestCards();
        });
      }
    }

    // ─── 核心渲染：過濾並組裝卡片 HTML ───
    function renderQuestCards() {
      const container = document.getElementById("starContainer");
      if (!container) return;

      // 執行複合式篩選過濾
      const filteredData = allRandomQuestData.filter(q => {
        // 1. 地區過濾
        if (activeFilters.location && q.location !== activeFilters.location) return false;
        // 2. 種類過濾
        if (activeFilters.quest_type && q.quest_type !== activeFilters.quest_type) return false;
        // 3. 關鍵字快速搜尋
        if (activeFilters.search) {
          const s = activeFilters.search;
          const matchName    = q.quest_name?.toLowerCase().includes(s);
          const matchLoc     = q.location?.toLowerCase().includes(s);
          const matchType    = q.quest_type?.toLowerCase().includes(s);
          const matchMonster = q.target_monster?.toLowerCase().includes(s);
          const matchItem    = q.collect_item?.toLowerCase().includes(s);
          if (!(matchName || matchLoc || matchType || matchMonster || matchItem)) return false;
        }
        return true;
      });

      if (filteredData.length === 0) {
        container.innerHTML = "<div class='no-results'>找不到符合條件的隨機任務。</div>";
        return;
      }

      // 生成橫式折疊小卡片 HTML
      container.innerHTML = filteredData.map(q => {
        // 圖片處理邏輯
        const imgName = q.collect_item ? encodeURIComponent(q.collect_item) : '';
        const imgSrc = imgName ? `/mo_data/pic/garbage/${imgName}.bmp` : '';

        // 獎勵多標籤處理
        const rewardArray = q.rewards ? q.rewards.split(/[、,]/) : [];
        const rewardTagsHTML = rewardArray.map(item => 
          item.trim() ? `<span class="reward-item-tag">${item.trim()}</span>` : ''
        ).join('');

        return `
          <div class="random-quest-card" onclick="toggleQuestCard(this)">
            <div class="quest-card-header">
              <div class="quest-main-pic">
                ${imgSrc ? 
                  `<img src="${imgSrc}" alt="${q.collect_item}" class="quest-img-thumb" onerror="this.parentElement.innerHTML='<i class=\"fa-solid fa-scroll\" style=\"color:#a855f7; font-size: 20px;\"></i>';">` 
                  : `<i class="fa-solid fa-scroll" style="color:#a855f7; font-size: 20px;"></i>`
                }
              </div>
              
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

      // 🚀 反查連結自動同步連動
      if (typeof window.formatMapLinks === 'function') {
        window.formatMapLinks();
      }
    }

    // ─── 輔助：手風琴折疊控制 (沿用你 quest.html 的設計) ───
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

    // ─── 輔助：回到頂部按鈕功能 ───
    function initBackToTop() {
      const btn = document.getElementById("backToTop");
      if (!btn) return;
      window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
          btn.style.display = "block";
        } else {
          btn.style.display = "none";
        }
      });
      btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }