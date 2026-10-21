import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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

let worldDropsData = [];

document.addEventListener('DOMContentLoaded', loadWorldDropsData);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function highlightText(value, keyword) {
  const text = escapeHtml(value);
  if (!keyword) return text;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escapedKeyword})`, 'gi'), '<span class="world-drop-highlight">$1</span>');
}

async function loadWorldDropsData() {
  const wrapper = document.getElementById('world-drops-wrapper');
  const searchInput = document.getElementById('world-search-input');
  if (!wrapper) return;

  try {
    const { data, error } = await supabase
      .from('world_drop_tiers')
      .select('*')
      .order('sort_id', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      wrapper.innerHTML = '<p style="text-align:center; padding: 20px;">目前尚無世界掉落資料</p>';
      return;
    }

    worldDropsData = data;
    renderWorldDrops('');

    if (searchInput) {
      let searchDebounceTimer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => renderWorldDrops(searchInput.value.trim()), 250);
      });
    }
  } catch (err) {
    console.error('載入世界掉落資料失敗:', err.message);
    wrapper.innerHTML = '<p style="text-align:center; color: #ff4d4d; padding: 20px;">載入資料發生錯誤</p>';
  }
}

function renderWorldDrops(rawKeyword) {
  const quickLinksContainer = document.getElementById('quick-links-container');
  const wrapper = document.getElementById('world-drops-wrapper');
  if (!quickLinksContainer || !wrapper) return;

  const keyword = String(rawKeyword || '').toLowerCase();
  let quickLinksHTML = '';
  let cardsHTML = '';

  worldDropsData.forEach((tier, index) => {
    const tierId = `tier-${tier.id || index}`;
    const tierTitle = `等級 ${tier.min_lv} ~ ${tier.max_lv}`;
    const tierMatches = tierTitle.toLowerCase().includes(keyword);
    const visibleCategories = categories.filter(cat => {
      const value = String(tier[cat.key] ?? '').trim();
      if (!value) return false;
      return !keyword || tierMatches || cat.label.toLowerCase().includes(keyword) || value.toLowerCase().includes(keyword);
    });

    if (keyword && visibleCategories.length === 0) return;

    quickLinksHTML += `<a href="#${tierId}" class="quick-link-btn">${highlightText(tierTitle, keyword)}</a>`;
    const tableRows = visibleCategories.length
      ? visibleCategories.map(cat => {
          const value = String(tier[cat.key] ?? '').trim();
          return `<tr>
              <td data-label="掉落分類" style="width: 30%; font-weight: bold; color: #60a5fa;">${highlightText(cat.label, keyword)}</td>
              <td data-label="掉落物品" style="line-height: 1.6; word-break: break-all;">${highlightText(value, keyword)}</td>
            </tr>`;
        }).join('')
      : '<tr><td colspan="2" style="text-align:center; color: #94a3b8;">此區間尚無掉落物</td></tr>';

    cardsHTML += `<div id="${tierId}" class="card-table-container card-ui open" style="margin-bottom: 20px;">
        <div class="card-header">
          <span class="card-title">${highlightText(tierTitle, keyword)}</span>
          <button class="card-toggle" aria-label="收合/展開"><span class="toggle-icon">▼</span></button>
        </div>
        <div class="card-content">
          <table class="card-table rwd-card">
            <thead><tr><th>掉落分類</th><th>掉落物品</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>`;
  });

  quickLinksContainer.innerHTML = quickLinksHTML;
  wrapper.innerHTML = cardsHTML || '<p style="text-align:center; padding: 20px;">找不到符合條件的世界掉落資料</p>';
  initCardToggleEvents();
}

function initCardToggleEvents() {
  document.querySelectorAll('.card-toggle').forEach(btn => {
    btn.addEventListener('mousedown', event => {
      event.preventDefault();
      const card = btn.closest('.card-ui');
      const content = card.querySelector('.card-content');
      const icon = btn.querySelector('.toggle-icon');
      const isOpen = card.classList.contains('open');

      if (isOpen) {
        content.style.maxHeight = `${content.scrollHeight}px`;
        content.offsetHeight;
        content.style.maxHeight = '0px';
        content.style.overflow = 'hidden';
        icon.style.transform = 'rotate(0deg)';
        card.classList.remove('open');
      } else {
        content.style.maxHeight = `${content.scrollHeight}px`;
        content.style.overflow = 'hidden';
        icon.style.transform = 'rotate(180deg)';
        card.classList.add('open');
        content.addEventListener('transitionend', function handler() {
          content.style.maxHeight = 'none';
          content.style.overflow = 'visible';
          content.removeEventListener('transitionend', handler);
        });
      }
    });
  });

  document.querySelectorAll('.card-ui.open .card-content').forEach(content => {
    content.style.maxHeight = 'none';
    content.style.overflow = 'visible';
  });
}
