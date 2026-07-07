import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

document.addEventListener("DOMContentLoaded", async () => {
  let heroesData = [];
  let lastFilteredData = [];
  let searchTimer = null; 
  let activeFilter = null; 
  let resourceMapping = {}; // 🚀 存放 資源名稱 -> [{map_id, game_coords, x, y}, ...]

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
    const [worksRes, resourceRes] = await Promise.all([
      supabase.from('works').select('*').order('sort_id', { ascending: true }),
      supabase.from('map_resources').select('resource_name, map_id, game_coords, x, y')
    ]);

    if (worksRes.error) throw worksRes.error;
    
    heroesData = worksRes.data || [];
    
    // 🚀 建立資源與地點的映射
    if (resourceRes.data) {
      resourceRes.data.forEach(r => {
        if (!resourceMapping[r.resource_name]) resourceMapping[r.resource_name] = [];
        resourceMapping[r.resource_name].push({
          map_id: r.map_id,
          game_coords: r.game_coords,
          x: r.x,
          y: r.y
        });
      });
    }

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
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        activeFilter = null;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        applyFilters();
    });
  }

  // === 綜合篩選（搜尋 + 篩選）===
  function applyFilters() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = heroesData.filter(hero => {
      const targetFields = [
        hero.type,
        hero.name,
        hero.area,
        hero.lv,
      ].join(' ').toLowerCase();
      const matchesKeyword = targetFields.includes(keyword);

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
      
      const imgTd = document.createElement('td');
      imgTd.style.width = '50px';
      imgTd.style.height = '50px';
      imgTd.style.textAlign = 'center';
      imgTd.style.verticalAlign = 'middle';
      imgTd.style.cursor = 'pointer';
      imgTd.onclick = () => showProductionModal(hero);

      if (hero.name) {
        const safeName = hero.name.replace(/[\\\/:*?"<>|]/g, '');
        const extensions = ['.png'];
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

      const fields = ['name','type', 'lv', 'area'];
      fields.forEach(field => {
        const td = document.createElement('td');
        if (field === 'name') {
            td.classList.add('table-title-cell');
            td.style.cursor = 'pointer';
            td.onclick = () => showProductionModal(hero);
        }
        
        let value = hero[field] ? String(hero[field]) : '';
        let isLink = false;
        
        // 🚀 智慧產地處理：產生連結
        if (field === 'area') {
          const dynamicLocs = resourceMapping[hero.name];
          if (dynamicLocs && dynamicLocs.length > 0) {
            isLink = true;
            td.innerHTML = dynamicLocs.map(loc => {
              const url = `../map/detailed_map.html?map=${encodeURIComponent(loc.map_id)}&resource=${encodeURIComponent(hero.name)}&x=${loc.x}&y=${loc.y}`;
              return `<a href="${url}" class="hero-link" title="在地圖上標記位置">${loc.map_id}${loc.game_coords ? `(${loc.game_coords})` : ''}</a>`;
            }).join('、');
          }
        }

        if (!isLink) {
          const htmlValue = value.replace(/\n/g, '<br>');
          if (keyword && value.toLowerCase().includes(keyword)) {
            const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            td.innerHTML = htmlValue.replace(regex, '<span class="highlight">$1</span>');
          } else {
            td.innerHTML = htmlValue;
          }
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

      const highlight = (text) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
      };

      const cardHeader = document.createElement('div');
      cardHeader.style.display = 'flex';
      cardHeader.style.alignItems = 'center';
      cardHeader.style.gap = '10px';
      cardHeader.style.marginBottom = '10px';
      cardHeader.style.paddingBottom = '8px';
      cardHeader.style.borderBottom = '1px solid #eee'; 
      cardHeader.style.cursor = 'pointer';
      cardHeader.onclick = () => showProductionModal(hero);

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
      
      // 🚀 手機版產地連結處理
      let originHtml = highlight(hero.area || '');
      const dynamicLocs = resourceMapping[hero.name];
      if (dynamicLocs && dynamicLocs.length > 0) {
        originHtml = dynamicLocs.map(loc => {
          const url = `../map/detailed_map.html?map=${encodeURIComponent(loc.map_id)}&resource=${encodeURIComponent(hero.name)}&x=${loc.x}&y=${loc.y}`;
          return `<a href="${url}" class="hero-link" style="display:inline-block; margin-right:5px;">${loc.map_id}${loc.game_coords ? `(${loc.game_coords})` : ''}</a>`;
        }).join('');
      }

      cardBody.innerHTML = `
        <p><strong>種類：</strong>${highlight(hero.type || '')}</p>
        <p><strong>等級：</strong>${highlight(hero.lv || '')}</p>
        <p><strong>產地：</strong>${originHtml}</p>
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

  // 輔助函式：建立具備回退機制的圖片
  function createImageWithFallbacks(basePath, altText) {
    const img = document.createElement("img");
    img.alt = altText;
    img.src = basePath + ".png";
    img.onerror = () => {
      const extensions = ['.bmp', '.jpg'];
      let attempt = 0;
      const tryNext = () => {
        if (attempt < extensions.length) {
          img.src = basePath + extensions[attempt];
          attempt++;
        } else {
          img.style.display = "none";
        }
      };
      img.onerror = tryNext;
      tryNext();
    };
    return img;
  }

  async function showProductionModal(work) {
    if (!modalContent) return;
    
    modalBox.scrollTop = 0;
    modalContent.innerHTML = `
      <h2 class="hero-name" id="modal-title">${work.name} - 製作清單</h2>
      <p style="text-align: center; padding: 20px; color: var(--text-muted);">正在檢索相關裝備...</p>
    `;
    openModal();

    try {
      const tableConfigs = [
        { name: 'weapons', label: '⚔️ 武器', link: 'weapons.html', maxMat: 11 },
        { name: 'equipment', label: '🛡️ 防具', link: 'equipment.html', maxMat: 11 },
        { name: 'accessories', label: '📿 飾品', link: 'accessories.html', maxMat: 5 },
        { name: 'medicine', label: '🧪 藥品', link: 'medicine.html', maxMat: 5 }
      ];

      const results = await Promise.all(tableConfigs.map(async (cfg) => {
        const orFilter = Array.from({length: cfg.maxMat}, (_, i) => `material${i+1}.ilike.%${work.name}%`).join(',');
        const { data, error } = await supabase
          .from(cfg.name)
          .select('item, lv')
          .or(orFilter);
        
        return { label: cfg.label, link: cfg.link, items: data || [] };
      }));

      // 重置內容
      modalContent.innerHTML = `<h2 class="hero-name" id="modal-title">${work.name} - 製作清單</h2>`;
      
      // 顯示圖片
      const safeName = work.name ? work.name.replace(/[\\\/:*?"<>|]/g, '') : '';
      if (safeName) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "hero-images";
        imgContainer.appendChild(createImageWithFallbacks(`/mo_data/pic/works/${safeName}`, work.name));
        modalContent.appendChild(imgContainer);
      }

      let categoriesHtml = "";
      let hasAny = false;
      results.forEach(res => {
        categoriesHtml += `<div class="production-category">
          <h3>${res.label}</h3>`;
        
        if (res.items.length > 0) {
          hasAny = true;
          // 按等級分組
          const groups = {};
          res.items.forEach(i => {
            const lv = i.lv || '未知';
            if (!groups[lv]) groups[lv] = new Set();
            groups[lv].add(i.item);
          });

          // 排序等級（由小到大）
          const sortedLvs = Object.keys(groups).sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
          });

          categoriesHtml += `<div class="production-grouped-list">`;
          sortedLvs.forEach(lv => {
            const itemsHtml = Array.from(groups[lv]).map(itemName => `
              <a href="${res.link}?search=${encodeURIComponent(itemName)}" class="hero-link">
                ${itemName}
              </a>
            `).join('、');
            
            categoriesHtml += `
              <div style="margin-bottom: 12px; display: flex; align-items: baseline; gap: 10px;">
                <span style="color: var(--highlight-yellow); font-weight: bold; min-width: 50px; font-size: 14px;">[Lv.${lv}]</span>
                <div style="line-height: 1.8;">${itemsHtml}</div>
              </div>
            `;
          });
          categoriesHtml += `</div>`;
        } else {
          categoriesHtml += `<p class="no-data">目前無相關製作資料</p>`;
        }
        
        categoriesHtml += `</div>`;
      });

      if (!hasAny) {
        categoriesHtml = `
                <p style="text-align: center; padding: 40px; color: var(--text-muted);">此材料目前沒有對應的裝備製作資料。</p>`;
      }

      modalContent.insertAdjacentHTML("beforeend", categoriesHtml);

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
    if (e.key === "Escape") closeModal();
  });

  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
