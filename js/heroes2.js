document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];
  let sortConfig = { key: null, direction: 'asc' }; // 記錄排序狀態

  // === 1. 載入 JSON 資料 ===
  fetch('/mo_data/data/heroes.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data;
      applyFilters(); // 初始渲染
    })
    .catch(error => {
      console.error('載入英雄資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入英雄資料</td></tr>';
    });

  const searchInput = document.getElementById('searchInput');

  // === 2. 核心邏輯：套用 搜尋 + 篩選 + 排序 ===
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();

    // A. 取得目前按鈕選取的條件
    const filters = {
      promotion: [],
      personality: [],
      traits: [],
      new_multiplier: []
    };
    document.querySelectorAll('.filter-btn.active').forEach(btn => {
      const type = btn.dataset.type;
      const val = btn.dataset.value;
      if (filters[type]) filters[type].push(val);
    });

    // B. 過濾資料 (搜尋框 + 篩選按鈕)
    let filtered = heroesData.filter(hero => {
      // 搜尋框條件
      const targetFields = [
        hero.name, hero.glory, hero.equipment_new, hero.equipment_old,
        hero.promotion, hero.personality, hero.traits
      ].join(' ').toLowerCase();
      const matchSearch = targetFields.includes(keyword);

      // 按鈕條件 (多選邏輯：同組選多個為 OR, 不同組之間為 AND)
      const okPromotion = filters.promotion.length === 0 || filters.promotion.includes(hero.promotion);
      const okPersonality = filters.personality.length === 0 || filters.personality.includes(hero.personality);
      const okTraits = filters.traits.length === 0 || filters.traits.includes(String(hero.traits));
      const okNewMult = filters.new_multiplier.length === 0 || filters.new_multiplier.includes(hero.new_multiplier);

      return matchSearch && okPromotion && okPersonality && okTraits && okNewMult;
    });

    // C. 排序資料
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // 數值欄位轉換 (力量、智慧、積極度等)
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          valA = numA;
          valB = numB;
        } else {
          valA = String(valA || "").toLowerCase();
          valB = String(valB || "").toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    renderTable(filtered);
  }

  // === 3. 渲染表格 ===
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的英雄</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(hero => {
      const tr = document.createElement('tr');
      const fields = [
        'name', 'glory', 'promotion', 'initial', 'traits', 'personality', 'element',
        'str', 'int', 'vit', 'agi', 'luk', 'aggression_before', 'equipment_new', 'equipment_old'
      ];

      fields.forEach(field => {
        const td = document.createElement('td');
        const value = hero[field] !== undefined ? String(hero[field]) : '';

        if (keyword && value.toLowerCase().includes(keyword)) {
          const regex = new RegExp(`(${keyword})`, 'gi');
          td.innerHTML = value.replace(regex, '<span class="highlight2">$1</span>');
        } else {
          td.textContent = value;
        }
        tr.appendChild(td);
      });

      tr.addEventListener('click', () => showDetailModal(hero));
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // === 4. 事件監聽 (搜尋、按鈕、排序) ===

  // 搜尋框
  searchInput.addEventListener('input', applyFilters);

  // 篩選按鈕
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      applyFilters();
    });
  });

  // 表頭排序點擊
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortConfig.key === col) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = col;
        sortConfig.direction = 'asc';
      }

      // 更新 UI 箭頭
      document.querySelectorAll('th.sortable').forEach(el => {
        el.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc');

      applyFilters();
    });
  });

  // 清除篩選
  document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    sortConfig = { key: null, direction: 'asc' };
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('th.sortable').forEach(el => el.classList.remove('sort-asc', 'sort-desc'));
    applyFilters();
  });

  // === 5. Modal 詳細視窗 ===
  function showDetailModal(hero) {
    const overlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const contentDiv = document.getElementById('modalContent');

    const safeName = hero.name.replace(/[^\w\u4e00-\u9fa5]/g, '');

    function createImageWithFallbacks(basePath, altText) {
      const img = document.createElement('img');
      img.alt = altText;
      img.style.maxWidth = '100%';
      img.src = basePath + '.png';
      img.onerror = () => img.style.display = 'none';
      return img;
    }

    contentDiv.innerHTML = `<h2 class="hero-name">${hero.name}</h2>`;
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'hero-images';
    imgContainer.style.display = 'flex';
    imgContainer.style.gap = '10px';
    imgContainer.style.marginBottom = '20px';
    imgContainer.appendChild(createImageWithFallbacks(`/mo_data/pic/heroes/${safeName}_正`, '正面'));
    imgContainer.appendChild(createImageWithFallbacks(`/mo_data/pic/heroes/${safeName}_反`, '反面'));
    contentDiv.appendChild(imgContainer);

    const detailHTML = `
      <div class="hero-details-container">
        <div class="hero-column left">
          <p><strong>對應光輝：</strong>${hero.glory}</p>
          <p><strong>拜官：</strong>${hero.promotion}</p>
          <p><strong>初始：</strong>${hero.initial}</p>
          <p><strong>素質：</strong>${hero.traits}</p>
          <p><strong>個性：</strong>${hero.personality}</p>
          <p><strong>屬性：</strong>${hero.element}</p>
          <p class="section-gap"><strong>力量：</strong>${hero.str}</p>
          <p><strong>智慧：</strong>${hero.int}</p>
          <p><strong>體質：</strong>${hero.vit}</p>
          <p><strong>敏捷：</strong>${hero.agi}</p>
          <p><strong>運氣：</strong>${hero.luk}</p>
        </div>
        <div class="hero-column right">
          <p><strong>積極度(生變前)：</strong>${hero.aggression_before}</p>
          <p><strong>積極度(生變後)：</strong>${hero.aggression_after}</p>
          <p class="section-gap"><strong>裝備卡(新專)：</strong>${hero.equipment_new}</p>
          <p><strong>新專數值：</strong>${hero.equipment_new_data}</p>
          <p><strong>新專倍率：</strong>${hero.new_multiplier}</p>
          <p class="section-gap"><strong>裝備卡(舊專)：</strong>${hero.equipment_old}</p>
          <p><strong>舊專數值：</strong>${hero.equipment_old_data}</p>
          <p class="section-gap"><strong>天生技：</strong>${hero.innate_skill}</p>
          <p><strong>生變技能：</strong>${hero.transformation_skill}</p>
        </div>
        <div class="hero-column-details">
          <p><strong>光輝掉落(掉落較多)：</strong>${hero.fall_high}</p>
          <p><strong>光輝掉落(掉落較低)：</strong>${hero.fall_low}</p>
          <p><strong>光輝掉落(玩家提供)：</strong>${hero.player}</p>
        </div>
      </div>
    `;
    contentDiv.insertAdjacentHTML('beforeend', detailHTML);

    overlay.style.display = 'block';
    modalBox.style.display = 'block';
  }

  // 關閉 Modal
  const closeBtn = document.querySelector('#modalBox .close-btn');
  const overlay = document.getElementById('modalOverlay');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBox').style.display = 'none';
  }

  // Accordion
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});