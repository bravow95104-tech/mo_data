document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];

  // 載入 JSON 資料
  fetch('/mo_data/data/awakening.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data;
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入覺醒資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入覺醒資料</td></tr>';
    });

  // 搜尋框邏輯
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      const targetFields = [
        hero.skill_name,
        hero.heros
      ].join(' ').toLowerCase();

      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  });

  // 產生表格函式
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的覺醒</td></tr>';
      return;
    }

    data.forEach(hero => {
      const tr = document.createElement('tr');
      const fields = [
        'skill_name', 'probability', 'heros'
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

      // 點擊列 → 顯示詳細視窗
      tr.addEventListener('click', () => {
        showDetailModal(hero);
      });

      tbody.appendChild(tr);
    });
  }


  // === 回到頂部按鈕 ===
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // === 篩選按鈕 ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;
      btn.classList.toggle('active');

      const filters = {
        promotion: [],
        personality: [],
        traits: [],
        new_multiplier: []
      };

      document.querySelectorAll('.filter-btn.active').forEach(activeBtn => {
        const t = activeBtn.dataset.type;
        const v = activeBtn.dataset.value;
        if (!filters[t].includes(v)) filters[t].push(v);
      });

      const filtered = heroesData.filter(hero => {
        const okPromotion = filters.promotion.length === 0 || filters.promotion.includes(hero.promotion);
        const okPersonality = filters.personality.length === 0 || filters.personality.includes(hero.personality);
        const okTraits = filters.traits.length === 0 || filters.traits.includes(String(hero.traits));
        const oknew_multiplier = filters.new_multiplier.length === 0 || filters.new_multiplier.includes(hero.new_multiplier);
        return okPromotion && okPersonality && okTraits && oknew_multiplier;
      });

      renderTable(filtered);
    });
  });

  // 清除篩選
  document.getElementById('clearFilters').addEventListener('click', () => {
    renderTable(heroesData);
    searchInput.value = '';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

    // 移除搜尋高亮
    document.querySelectorAll('.highlight, .highlight2').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  });

  // Accordion 展開／收合
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      accordion.classList.toggle('collapsed');
    });
  });
});
