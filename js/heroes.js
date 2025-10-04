
document.addEventListener("DOMContentLoaded", () => {
  let heroesData = [];

  // 載入 JSON 資料
  fetch('/mo_data/data/heroes.json')
    .then(response => response.json())
    .then(data => {
      heroesData = data;
      renderTable(heroesData);
    })
    .catch(error => {
      console.error('載入英雄資料錯誤:', error);
      const tbody = document.querySelector('#heroes-table tbody');
      tbody.innerHTML = '<tr><td colspan="15">無法載入英雄資料</td></tr>';
    });

  // 搜尋框邏輯
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = heroesData.filter(hero => {
      const targetFields = [
        hero.name,
        hero.glory,
        hero.equipment_new,
        hero.equipment_old,
        hero.promotion,
        hero.personality,
        hero.traits
      ].join(' ').toLowerCase();

      return targetFields.includes(keyword);
    });

    renderTable(filtered);
  });

  // 產生表格函式（加上高亮與點擊事件）
  function renderTable(data) {
    const tbody = document.querySelector('#heroes-table tbody');
    tbody.innerHTML = '';

    const keyword = searchInput.value.trim().toLowerCase();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15">找不到符合條件的英雄</td></tr>';
      return;
    }

    data.forEach(hero => {
      const tr = document.createElement('tr');
      const fields = [
        'name', 'glory', 'promotion', 'initial', 'traits', 'personality', 'element',
        'str', 'int', 'vit', 'agi', 'luk',
        'aggression_before', 'equipment_new', 'equipment_old'
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

      // 加入點擊事件：點擊該列顯示詳細 Modal
      tr.addEventListener('click', () => {
        showDetailModal(hero);
      });

      tbody.appendChild(tr);
    });
  }

  // 顯示 Modal
  function showDetailModal(hero) {
    const overlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const contentDiv = document.getElementById('modalContent');

    let html = `
	<h2 class="hero-name">${hero.name}</h2>
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
    <p><strong>裝備卡(舊專)：</strong>${hero.equipment_old}</p>
    <p><strong>舊專數值：</strong>${hero.equipment_old_data}</p>
    <p class="section-gap"><strong>天生技：</strong>${hero.innate_skill}</p>
    <p><strong>生變技能：</strong>${hero.transformation_skill}</p>
  </div>
</div>
`;
    contentDiv.innerHTML = html;

    overlay.style.display = 'block';
    modalBox.style.display = 'block';
  }

  // 關閉 Modal
  const closeBtn = document.querySelector('#modalBox .close-btn');
  closeBtn.addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);

  function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBox').style.display = 'none';
  }

  // 回到頂部按鈕邏輯
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

// 快速搜尋事件（多選條件 + 交集篩選）
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;        // "promotion" / "personality" / "traits"
    const value = btn.dataset.value;

    // 切換這個按鈕的 active 狀態（點一下選、再點一次取消）
    btn.classList.toggle('active');

    // 收集目前每個分類被選到的條件（數組）
    const filters = {
      promotion: [],
      personality: [],
      traits: []
    };

    document.querySelectorAll('.filter-btn.active').forEach(activeBtn => {
      const t = activeBtn.dataset.type;
      const v = activeBtn.dataset.value;
      // 把 v 加到對應分類的陣列（避免重複）
      if (!filters[t].includes(v)) {
        filters[t].push(v);
      }
    });

    // 篩選：符合交集條件
    const filtered = heroesData.filter(hero => {
      // 如果該分類有選條件的話，要在該分類的條件陣列中有匹配
      const okPromotion = filters.promotion.length === 0 || filters.promotion.includes(hero.promotion);
      const okPersonality = filters.personality.length === 0 || filters.personality.includes(hero.personality);
      const okTraits = filters.traits.length === 0 || filters.traits.includes(String(hero.traits));

      return okPromotion && okPersonality && okTraits;
    });

    renderTable(filtered);
  });
});

// 清除所有篩選按鈕與搜尋框
document.getElementById('clearFilters').addEventListener('click', () => {
  renderTable(heroesData);
  searchInput.value = '';

  // 清除所有 active 樣式
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // 移除搜尋高亮（如果有用到）
// 這裡你原本有處理 highlight / highlight2，可以保留
  document.querySelectorAll('.highlight, .highlight2').forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
});

  // Accordion 展開／收合
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  });
});
});