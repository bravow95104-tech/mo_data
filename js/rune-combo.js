import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const IMAGE_BASE_PATH = '/mo_data/pic/rune_combo/';
let activeReferences = [];
let activeReferenceIndex = 0;

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
    list.innerHTML = comboReferences.map((item, index) => {
      const imageUrl = getImageUrl(item);
      const title = item.image_title || item.image_name || '玩家數值參考';
      const meta = [item.provider_name, item.condition_text]
        .filter(Boolean)
        .map(escapeHtml)
        .join('｜');

      return `
        <figure class="player-reference-item">
          <button type="button" class="player-reference-trigger" data-reference-index="${index}" aria-label="查看${escapeHtml(title)}">
            <img class="player-reference-image"
                 src="${escapeHtml(imageUrl)}"
                 alt="${escapeHtml(title)}"
                 loading="lazy">
          </button>
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

    list.addEventListener('click', (event) => {
      const trigger = event.target.closest('.player-reference-trigger');
      if (!trigger) return;
      openLightbox(comboReferences, Number(trigger.dataset.referenceIndex));
    });
  });
}

function getImageUrl(item) {
  return item.image_url || `${IMAGE_BASE_PATH}${encodeURIComponent(item.image_name || '')}`;
}

function updateLightbox() {
  const overlay = document.getElementById('rune-reference-overlay');
  const image = document.getElementById('rune-reference-modal-image');
  const caption = document.getElementById('rune-reference-modal-caption');
  const counter = document.getElementById('rune-reference-modal-counter');
  if (!overlay || !image || !caption || !counter || !activeReferences.length) return;

  const item = activeReferences[activeReferenceIndex];
  const title = item.image_title || item.image_name || '玩家數值參考';
  const meta = [item.provider_name, item.condition_text]
    .filter(Boolean)
    .map(escapeHtml)
    .join('｜');

  image.src = getImageUrl(item);
  image.alt = title;
  caption.innerHTML = `<strong>${escapeHtml(title)}</strong>${meta ? `<span>${meta}</span>` : ''}`;
  counter.textContent = `${activeReferenceIndex + 1} / ${activeReferences.length}`;
}

function openLightbox(references, index) {
  activeReferences = references;
  activeReferenceIndex = index;
  updateLightbox();

  const overlay = document.getElementById('rune-reference-overlay');
  if (!overlay) return;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('rune-reference-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function moveLightbox(step) {
  if (!activeReferences.length) return;
  activeReferenceIndex = (activeReferenceIndex + step + activeReferences.length) % activeReferences.length;
  updateLightbox();
}

function initLightbox() {
  const overlay = document.getElementById('rune-reference-overlay');
  if (!overlay) return;

  overlay.querySelector('.rune-reference-close')?.addEventListener('click', closeLightbox);
  overlay.querySelector('.rune-reference-nav.prev')?.addEventListener('click', () => moveLightbox(-1));
  overlay.querySelector('.rune-reference-nav.next')?.addEventListener('click', () => moveLightbox(1));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initLightbox();

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
