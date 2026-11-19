import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const IMAGE_BASE_PATH = '/mo_data/pic/rune_combo/';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function renderReferences(references) {
  document.querySelectorAll('[data-combo-key]').forEach((card) => {
    const comboKey = card.dataset.comboKey;
    const section = card.querySelector('.player-reference-section');
    if (!section) return;

    const emptyState = section.querySelector('.player-reference-empty');
    const comboReferences = references.filter(item => item.combo_key === comboKey);

    if (comboReferences.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    const list = document.createElement('div');
    list.className = 'player-reference-list';
    list.innerHTML = comboReferences.map((item) => {
      const imageUrl = item.image_url || `${IMAGE_BASE_PATH}${encodeURIComponent(item.image_name || '')}`;
      const title = item.image_title || item.image_name || '玩家數值參考';
      const meta = [item.provider_name, item.condition_text]
        .filter(Boolean)
        .map(escapeHtml)
        .join('｜');

      return `
        <figure class="player-reference-item">
          <a href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener">
            <img class="player-reference-image"
                 src="${escapeHtml(imageUrl)}"
                 alt="${escapeHtml(title)}"
                 loading="lazy">
          </a>
          <figcaption class="player-reference-caption">
            <strong>${escapeHtml(title)}</strong>
            ${meta ? `<span>${meta}</span>` : ''}
          </figcaption>
          ${item.note ? `<p class="player-reference-note">${escapeHtml(item.note)}</p>` : ''}
        </figure>
      `;
    }).join('');

    section.querySelector('.player-reference-list')?.remove();
    section.appendChild(list);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const { data, error } = await supabase
    .from('rune_combo_references')
    .select('combo_key, image_name, image_url, image_title, provider_name, condition_text, note, sort_id')
    .eq('status', 'approved')
    .order('sort_id', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ 玩家數值參考載入失敗：', error);
    return;
  }

  renderReferences(data || []);
});
