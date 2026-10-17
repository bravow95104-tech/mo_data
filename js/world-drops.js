import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  await loadWorldDropsData();
});

async function loadWorldDropsData() {
  const quickLinksContainer = document.getElementById('quick-links-container');
  const wrapper = document.getElementById('world-drops-wrapper');
  if (!wrapper) return;

  try {
    // 從 Supabase 撈取世界掉落表，並依照 sort_id 或 min_lv 排序
    const { data, error } = await supabase
      .from('world_drop_tiers')
      .select('*')
      .order('sort_id', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      wrapper.innerHTML = '<p style="text-align:center; padding: 20px;">目前尚無世界掉落資料</p>';
      return;
    }

    let quickLinksHTML = '';
    let cardsHTML = '';

    data.forEach((tier, index) => {
      const tierId = `tier-${tier.id || index}`;
      const tierTitle = `等級 ${tier.min_lv} ~ ${tier.max_lv}`;

      // 1. 產生上方快速連結按鈕
      quickLinksHTML += `<a href="#${tierId}" class="quick-link-btn">${tierTitle}</a>`;

      // 2. 定義要顯示的各個掉落分類
      const categories = [
        { key: 'drop_transform', label: '變身劑 / 還我漂漂水' },
        { key: 'drop_card_equip', label: '裝備卡' },
        { key: 'drop_card_active', label: '主動技能卡' },
        { key: 'drop_card_passive', label: '被動技能卡' },
        { key: 'drop_card_hero', label: '英雄卡' },
        { key: 'drop_recipes', label: '配方書' },
        { key: 'drop_texts', label: '文片' },
        { key: 'drop_materials', label: '材料類' },
        { key: 'drop_other', label: '其他類' }
      ];

      // 3. 組裝該等級區間有內容的表格列
      let tableRows = '';
      categories.forEach(cat => {
        const val = tier[cat.key];
        if (val && val.trim() !== '') {
          tableRows += `
            <tr>
              <td data-label="掉落分類" style="width: 30%; font-weight: bold; color: #60a5fa;">${cat.label}</td>
              <td data-label="掉落物品" style="line-height: 1.6; word-break: break-all;">${val}</td>
            </tr>
          `;
        }
      });

      if (!tableRows) {
        tableRows = `<tr><td colspan="2" style="text-align:center; color: #94a3b8;">此區間尚無掉落物</td></tr>`;
      }

      // 4. 產生卡片區塊 (複用第一種 UI 風格)
      cardsHTML += `
        <div id="${tierId}" class="card-table-container card-ui open" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">${tierTitle}</span>
            <button class="card-toggle" aria-label="收合/展開">
              <span class="toggle-icon">▼</span>
            </button>
          </div>
          <div class="card-content">
            <table class="card-table rwd-card">
              <thead>
                <tr>
                  <th>掉落分類</th>
                  <th>掉落物品</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    quickLinksContainer.innerHTML = quickLinksHTML;
    wrapper.innerHTML = cardsHTML;

    // 綁定收合動畫事件（直接沿用你原本的邏輯）
    initCardToggleEvents();

  } catch (err) {
    console.error("載入世界掉落資料失敗:", err.message);
    wrapper.innerHTML = '<p style="text-align:center; color: #ff4d4d; padding: 20px;">載入資料發生錯誤</p>';
  }
}

// 卡片收合動畫繫結函式
function initCardToggleEvents() {
  document.querySelectorAll(".card-toggle").forEach(function (btn) {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      const card = btn.closest(".card-ui");
      const content = card.querySelector(".card-content");
      const icon = btn.querySelector(".toggle-icon");
      const isOpen = card.classList.contains("open");

      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + "px";
        content.offsetHeight; 
        content.style.maxHeight = "0px";
        content.style.overflow = "hidden";
        icon.style.transform = "rotate(0deg)";
        card.classList.remove("open");
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
        content.style.overflow = "hidden";
        icon.style.transform = "rotate(180deg)";
        card.classList.add("open");
        content.addEventListener("transitionend", function handler() {
          content.style.maxHeight = "none";
          content.style.overflow = "visible";
          content.removeEventListener("transitionend", handler);
        });
      }
    });
  });

  document.querySelectorAll(".card-ui.open .card-content").forEach(function (content) {
    content.style.maxHeight = "none";
    content.style.overflow = "visible";
  });
}