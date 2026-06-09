import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

document.addEventListener("DOMContentLoaded", async () => {
  let heroesData = [];
  let lastFilteredData = [];
  let searchTimer = null; // ✅ 防抖動用變數
  let activeFilter = null; // ✅ 記錄目前的篩選條件

  const heroesTable = document.getElementById('heroes-table');
  const cardContainer = document.getElementById('hero-card-container');
  const searchInput = document.getElementById('searchInput');

  // === 響應式判斷 ===
  const isBelow768 = () => window.innerWidth <= 768;
  let resizeFlag = isBelow768();
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentFlag = isBelow768();
      if (currentFlag !== resizeFlag) {
        resizeFlag = currentFlag;
        applyLayout();
      }
    }, 150);
  });

  // === 載入資料 ===
  try {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .order('sort_id', { ascending: true });

    if (error) throw error;

    heroesData = data || [];
    applyFilters();
  } catch (error) {
    console.error('載入工作資料錯誤:', error);
    const tbody = document.querySelector('#heroes-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入工作資料</td></tr>';
  }

  // === 搜尋框（防抖動）===
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(), 200);
    });
  }

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.type;
      const value = btn.dataset.value;
      activeFilter = { type, value };

      applyFilters();
    });
  });

  // === 清除篩選 ===
  document.getElementById('clearFilters').addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeFilter = null;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    applyFilters();
  });

  // === 綜合篩選（搜尋 + 篩選）===
  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      // 🔹 搜尋條件
      const targetFields = [
        hero.type,
        hero.name,
        hero.area,
        hero.lv,
      ].join(' ').toLowerCase();
      const matchesKeyword = targetFields.includes(keyword);

      // 🔹 篩選條件
      const matchesFilter = !activeFilter || (
        activeFilter.type === "promotion" && hero.type === activeFilter.value
      );

      return matchesKeyword && matchesFilter;
    });

    lastFilteredData = filtered;
    applyLayout();
  }

  function applyLayout() {
    if (resizeFlag) {
      renderCards(lastFilteredData);
      if (heroesTable) heroesTable.style.display = 'none';
      if (cardContainer) cardContainer.style.display = 'flex';
    } else {
      renderTable(lastFilteredData);
      if (heroesTable) heroesTable.style.display = 'block';
      const table = document.getElementById("heroes-table");
      if (table) table.style.display = "table";
      if (cardContainer) cardContainer.style.display = 'none';
    }
  }

  // === 產生表格（電腦版）===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的工作</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => showProductionModal(hero));

      // === 圖片 ===
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';

      if (hero.name) {
        const safeName = hero.name.replace(/[\\\/:*?"<>|]/g, '');
        const extensions = ['.png', '.bmp', '.jpg'];
        let attempt = 0;

        const img = document.createElement('img');
        img.alt = hero.name;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.style.borderRadius = '4px';
        img.style.backgroundColor = '#f9f9f9';

        function tryLoad() {
          img.src = `/mo_data/pic/works/${safeName}${extensions[attempt]}`;
          img.onerror = () => {
            attempt++;
            if (attempt < extensions.length) {
              tryLoad();
            } else {
              imgTd.textContent = '—';
            }
          };
        }
        tryLoad();
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = '—';
      }
      tr.appendChild(imgTd);

      const fields = ['type', 'lv', 'name', 'area'];
      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] ? String(hero[field]) : '';
        const htmlValue = value.replace(/\n/g, '<br>');

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          td.innerHTML = htmlValue.replace(regex, '<span class="highlight">$1</span>');
        } else {
          td.innerHTML = htmlValue;
        }
        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === 產生卡片（手機版）===
  function renderCards(data) {
    if (!cardContainer) return;
    cardContainer.innerHTML = '';

    if (data.length === 0) {
      cardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #999;">找不到符合條件的工作</p>';
      return;
    }

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const fragment = document.createDocumentFragment();

    data.forEach(hero => {
      const card = document.createElement('div');
      card.className = 'card-item';
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => showProductionModal(hero));

      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      // ... (rest of card code)

      // 卡片標題區域 (含圖示)
      const cardHeader = document.createElement('div');
      cardHeader.style.display = 'flex';
      cardHeader.style.alignItems = 'center';
      cardHeader.style.gap = '10px';
      cardHeader.style.marginBottom = '10px';
      cardHeader.style.paddingBottom = '8px';
      cardHeader.style.borderBottom = '1px solid #eee'; // 新增分隔線

      const img = document.createElement('img');
      const safeName = hero.name ? hero.name.replace(/[\\\/:*?"<>|]/g, '') : '';
      const extensions = ['.png', '.bmp', '.jpg'];
      let attempt = 0;
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'contain';

      function tryLoadImg() {
        img.src = `/mo_data/pic/works/${safeName}${extensions[attempt]}`;
        img.onerror = () => {
          attempt++;
          if (attempt < extensions.length) {
            tryLoadImg();
          } else {
            img.style.display = 'none';
          }
        };
      }
      if (safeName) tryLoadImg();

      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.fontSize = '1.1rem';
      title.style.color = '#3399ff';
      title.style.borderBottom = 'none';
      title.style.textAlign = 'left';
      title.innerHTML = highlight(hero.name || '');

      cardHeader.appendChild(img);
      cardHeader.appendChild(title);

      const cardBody = document.createElement('div');
      cardBody.style.fontSize = '14px';
      cardBody.style.lineHeight = '1.6';
      cardBody.innerHTML = `
        <p><strong>種類：</strong>${highlight(hero.type || '')}</p>
        <p><strong>等級：</strong>${highlight(hero.lv || '')}</p>
        <p><strong>產地：</strong>${highlight(hero.area || '')}</p>
      `;

      card.appendChild(cardHeader);
      card.appendChild(cardBody);
      fragment.appendChild(card);
    });

    cardContainer.appendChild(fragment);
  }

  // === Modal 邏輯 ===
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.querySelector('.close-btn');

  async function showProductionModal(work) {
    if (!modalContent) return;
    
    modalContent.innerHTML = `
      <h2 style="color: var(--primary-blue); border-bottom: 2px solid var(--primary-blue); padding-bottom: 10px; margin-bottom: 20px;">
        ${work.name} - 製作清單
      </h2>
      <p style="text-align: center; padding: 20px;">正在檢索相關裝備...</p>
    `;
    openModal();

    try {
      // 同時檢索三個表，材料欄位 material1 ~ material11 包含該工作名稱
      const tableConfigs = [
        { name: 'weapons', label: '⚔️ 武器' },
        { name: 'equipment', label: '🛡️ 防具' },
        { name: 'accessories', label: '📿 飾品' }
      ];

      const results = await Promise.all(tableConfigs.map(async (cfg) => {
        // 使用 ilike 並加上 % 萬用字元，以匹配包含數量的字串（例如 "銅石" 匹配 "銅石5"）
        const orFilter = Array.from({length: 11}, (_, i) => `material${i+1}.ilike.%${work.name}%`).join(',');
        const { data, error } = await supabase
          .from(cfg.name)
          .select('item')
          .or(orFilter);
        
        return { label: cfg.label, items: data || [] };
      }));

      let html = `<h2 style="color: var(--primary-blue); border-bottom: 2px solid var(--primary-blue); padding-bottom: 10px; margin-bottom: 20px;">${work.name} - 製作清單</h2>`;
      
      let hasAny = false;
      results.forEach(res => {
        html += `<div class="production-category">
          <h3>${res.label}</h3>
          <div class="production-list">`;
        
        if (res.items.length > 0) {
          hasAny = true;
          html += res.items.map(i => `<div class="production-item">${i.item}</div>`).join('');
        } else {
          html += `<p class="no-data">目前無相關製作資料</p>`;
        }
        
        html += `</div></div>`;
      });

      if (!hasAny) {
        html = `<h2 style="color: var(--primary-blue); border-bottom: 2px solid var(--primary-blue); padding-bottom: 10px; margin-bottom: 20px;">${work.name}</h2>
                <p style="text-align: center; padding: 40px; color: var(--text-muted);">此材料目前沒有對應的裝備製作資料。</p>`;
      }

      modalContent.innerHTML = html;

    } catch (err) {
      console.error("檢索製作清單失敗:", err);
      modalContent.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">檢索失敗，請稍後再試。</p>`;
    }
  }

  function openModal() {
    modalOverlay.style.display = "block";
    modalBox.style.display = "block";
    modalBox.scrollTop = 0;
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalBox.style.display = "none";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBox.style.display === "block") {
      closeModal();
    }
  });

  // === Accordion 展開／收合 ===
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
