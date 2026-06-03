import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data, error } = await supabase
      .from('equip_combo')
      .select('*')
      .order('sort_id', { ascending: true });

    if (error) throw error;
    initComboPage(data);
  } catch (err) {
    console.error("❌ Supabase 載入失敗：", err);
    const comboList = document.getElementById("comboList");
    if (comboList)
      comboList.innerHTML =
        "<p style='color:red;text-align:center;'>無法載入雲端資料</p>";
  }
});

function initComboPage(data) {
  const comboList = document.getElementById("comboList");
  const searchInput = document.getElementById("searchInput");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const clearBtn = document.getElementById("clearFilters");
  const filterAccordion = document.querySelector("#filterContainer");

  // ✅ 篩選陣列 (對應 HTML data-type)
  let activeFilters = { promotion: [], commonly: [], category: [], equipmenttype1: [] };

  function renderList() {
    const searchText = searchInput.value.trim().toLowerCase();
    const keywords = searchText.split(/\s+/).filter(k => k); // 支援多關鍵字 (空白分隔)

    const filtered = data.filter(item => {
      // 將欄位轉小寫
      const fieldsToSearch = [
        item.skillname,
        item.class,
        item.classskill,
        item.category,
        item.combinationmethod,
        item.equipmenttype1,
        item.equipmenttype2,
        item.description
      ].map(v => (v || "").toLowerCase());

      // 🔍 搜尋條件 (需匹配所有關鍵字)
      const matchSearch = keywords.length === 0 || keywords.every(kw => 
        fieldsToSearch.some(field => field.includes(kw))
      );

      const job = (item.class || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const equip1 = (item.equipmenttype1 || "").toLowerCase();
      const equip2 = (item.equipmenttype2 || "").toLowerCase();

      // 🧩 職業篩選
      const matchFilter =
        activeFilters.promotion.length === 0 ||
        activeFilters.promotion.some(f => job.includes(f.toLowerCase()) || job.includes("全職業"));

      // 📂 類別篩選
      const matchCategory =
        activeFilters.category.length === 0 ||
        activeFilters.category.some(f => cat.includes(f.toLowerCase()));

      // ⚙️ 裝備部位篩選
      const matchEquipType =
        activeFilters.equipmenttype1.length === 0 ||
        activeFilters.equipmenttype1.some(f =>
          equip1.includes(f.toLowerCase()) || equip2.includes(f.toLowerCase())
        );

      // ⭐ 常用篩選
      const matchCommonly =
        activeFilters.commonly.length === 0 ||
        (activeFilters.commonly.some(f => f.toLowerCase() === "true") &&
          String(item.commonly).toLowerCase() === "true");

      return matchSearch && matchFilter && matchCommonly && matchCategory && matchEquipType;
    });

    // 清空列表
    comboList.innerHTML = "";

    // 無結果
    if (filtered.length === 0) {
      comboList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--glass-bg); border-radius: 16px;">查無符合條件的組合</div>`;
      return;
    }

    // 渲染結果卡片
    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "combo-card";

      const equipDisplay = [item.equipmenttype1, item.equipmenttype2].filter(Boolean).join(" / ") || "—";

      // --- 高亮邏輯 ---
      const highlightFields = {
        skillName: item.skillname || "—",
        classSkill: item.classskill || "—",
        class: item.class || "—",
        equipDisplay: equipDisplay,
        combinationMethod: item.combinationmethod || "—",
        description: item.description || "—"
      };

      if (keywords.length > 0) {
        // 逃避特殊字元並建立 RegExp
        const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const regex = new RegExp(`(${escapedKeywords})`, "gi");
        
        Object.keys(highlightFields).forEach(key => {
          highlightFields[key] = String(highlightFields[key]).replace(regex, '<span class="highlight">$1</span>');
        });
      }

      card.innerHTML = `
        <div class="combo-title">${highlightFields.skillName}</div>
        <div class="combo-category"><strong>職業技能：</strong>${highlightFields.classSkill}</div>
        <div class="combo-details">
          <p><strong>職業：</strong>${highlightFields.class}</p>
          <p><strong>裝備部位：</strong>${highlightFields.equipDisplay}</p>
          <p><strong>文片組合：</strong>${highlightFields.combinationMethod}</p>
          <p><strong>說明：</strong>${highlightFields.description}</p>
        </div>
      `;
      comboList.appendChild(card);
    });
  }

  // 🔍 即時搜尋
  searchInput.addEventListener("input", renderList);

  // 🎯 篩選按鈕
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      btn.classList.toggle("active");

      if (btn.classList.contains("active")) {
        activeFilters[type].push(value);
      } else {
        activeFilters[type] = activeFilters[type].filter(f => f !== value);
      }
      renderList();
    });
  });

  // ❌ 清除篩選
  clearBtn.addEventListener("click", () => {
    activeFilters = { promotion: [], commonly: [], category: [], equipmenttype1: [] };
    filterBtns.forEach(btn => btn.classList.remove("active"));
    searchInput.value = "";
    renderList();
  });

  // 🪄 初始化渲染
  renderList();

  // 📂 Accordion 展開／收合
  if (filterAccordion) {
    const header = filterAccordion.querySelector(".accordion-header");
    header.addEventListener("click", () => {
      filterAccordion.classList.toggle("collapsed");
    });
  }
}
