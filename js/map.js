import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === 1. 全域變數與全域函數公開 ===
let mapData = [];
let resourceData = []; // 🚀 新增：儲存所有資源點位
let heroGloryMap = {}; 

// 定義所有可能的欄位
const ALL_COLUMNS = [
  { id: 'mapid', label: '地圖名稱', default: true },
  { id: 'drop_equidcard', label: '裝備卡', default: true },
  { id: 'drop_skillcard', label: '技能卡', default: true },
  { id: 'drop_rubbish', label: '垃圾', default: true },
  { id: 'drop_hero', label: '英雄卡', default: true },
  { id: 'drop_glory_high', label: '光輝(多)', default: true },
  { id: 'drop_glory_low', label: '光輝(少)', default: true },
  { id: 'maplv', label: '怪物等級', default: false },
  { id: 'def', label: '防禦', default: false },
  { id: 'dodge', label: '閃避', default: false },
  { id: 'drop_combo_old', label: '舊文片', default: false },
  { id: 'drop_combo_new', label: '新文片', default: false },
  { id: 'drop_othrt', label: '其他掉落', default: false }
];

let activeColumns = [];

// === 智慧格式化解析器 (支援全域共用) ===
const formatTieredContent = (text, isCompact = false, linkType = null) => {
  if (!text) return isCompact ? "" : "-";
  const str = String(text);
  
  // 智慧超連結處理函數 (支援 hero, equip, skill)
  const wrapLinks = (namesStr) => {
    if (!linkType) return namesStr;
    return namesStr.split('、').map(name => {
      const trimmedName = name.trim();
      if (!trimmedName) return "";
      
      let targetPage = "";
      let className = "hero-link"; // 複用英雄連結的虛線樣式
      
      if (linkType === 'hero') {
        targetPage = "../hero/heroes.html?hero=";
      } else if (linkType === 'equip') {
        targetPage = "../card/card-equip.html?card=";
      } else if (linkType === 'skill') {
        targetPage = "../card/card-active.html?card=";
      }
      
      return `<a href="${targetPage}${encodeURIComponent(trimmedName)}" class="${className}">${trimmedName}</a>`;
    }).join('、');
  };

  const tierRegex = /第\d+層[：:]/g;
  if (tierRegex.test(str)) {
    const lines = str.split(/\n|<br>/i);
    return lines.map(line => {
      const match = line.match(/(第\d+層)[：:](.*)/);
      if (match) {
        const tier = match[1];
        const names = wrapLinks(match[2].trim());
        if (isCompact) {
          const shortTier = tier.replace("第", "T").replace("層", "");
          return `<div class="table-tier-item"><span class="table-tier-badge">${shortTier}</span> ${names}</div>`;
        }
        return `<div class="tier-group"><div class="tier-header"><span class="tier-badge">${tier}</span></div><div class="tier-names">${names}</div></div>`;
      }
      const normalNames = wrapLinks(line.trim());
      return normalNames ? `<div>${normalNames}</div>` : "";
    }).join('');
  }
  
  const finalNames = wrapLinks(str);
  return isCompact ? finalNames : finalNames.replace(/\n/g, '<br>');
};

const formatGloryWithTooltip = (text) => {
  if (!text || text === "-") return "-";
  return text.split('、').map(glory => {
    const trimmed = glory.trim();
    if (!trimmed) return "";
    const heroes = heroGloryMap[trimmed] ? heroGloryMap[trimmed].join('、') : "目前無英雄對照";
    return `<span class="glory-tooltip" title="對應英雄：${heroes}">${trimmed}</span>`;
  }).join('、');
};

// === 自定義語法解析 (^&文字&^ -> 變色) ===
const parseCustomSyntax = (text) => {
  if (!text) return "";
  return String(text).replace(/\^&([\s\S]*?)&\^/g, '<span class="colored-text">$1</span>');
};

const formatDescription = (text) => {
  if (!text) return "-";
  return parseCustomSyntax(text).replace(/\n/g, '<br>');
};

window.zoomWorldMap = function (src) {
  const modalBox = document.getElementById("modalBox");
  if (!modalBox) return;
  modalBox.classList.add("modal-large-mode");
  document.getElementById("modalContent").innerHTML = `
        <h2 class="hero-name">世界地圖全圖</h2>
        <div class="world-map-zoom-container"><img src="${src}" class="world-map-large-img"></div>
    `;
  showModal();
};

// 🚀 核心功能：顯示資源標記
window.showResourceMarker = function(x, y, name, maxX, maxY) {
  const ping = document.getElementById('resource-ping');
  const img = document.querySelector('.map-image-relative-wrapper .hero-image');
  if (!ping || !img) return;

  // 💡 自動比例偵測邏輯
  const finalMaxX = (maxX && maxX > 1) ? maxX : img.naturalWidth;
  const finalMaxY = (maxY && maxY > 1) ? maxY : img.naturalHeight;

  // 計算百分比 (取小數點後兩位)
  const left = ((x / finalMaxX) * 100).toFixed(2);
  const top = ((y / finalMaxY) * 100).toFixed(2);

  // 🚀 自動切換格式：先試 PNG，失敗試 JPG，再失敗顯示預設紅點
  const pngPath = `/mo_data/pic/works/${name}.png`;
  const jpgPath = `/mo_data/pic/works/${name}.jpg`;
  const defaultPath = `/mo_data/pic/sys/marker.png`;

  ping.innerHTML = `
    <img src="${pngPath}" 
         style="width:100%; height:100%; object-fit:contain; filter: drop-shadow(0 0 5px #fff);" 
         onerror="if(this.src.includes('.png')){this.src='${jpgPath}';}else{this.src='${defaultPath}';this.onerror=null;}">
  `;

  ping.style.left = `${left}%`;
  ping.style.top = `${top}%`;
  ping.style.display = 'block';

  // 自動捲動到圖片位置
  const wrapper = document.querySelector('.map-image-relative-wrapper');
  if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const rubbishElement = document.getElementById('dynamic-drop-rubbish');
    if (rubbishElement && rubbishElement.getAttribute('data-default')) {
        rubbishElement.innerHTML = rubbishElement.getAttribute('data-default');
        rubbishElement.style.color = ""; // 還原原本的文字顏色
        rubbishElement.style.fontWeight = "";
    }
};

// 🚀 新增：在畫布上繪製不規則範圍的函數
window.showResourcePolyRange = function(points, maxX, maxY) {
    // 1. 先清除舊的範圍線
    if (typeof clearResourcePolyRange === "function") clearResourcePolyRange();

    // 2. 尋找地圖的實際圖片
    const mapImg = document.querySelector('.map-image-relative-wrapper .hero-image');
    const wrapper = document.querySelector('.map-image-relative-wrapper');
    
    if (!mapImg || !wrapper) {
        console.error("找不到地圖圖片或容器");
        return;
    }

    const currentWidth = mapImg.clientWidth;
    const currentHeight = mapImg.clientHeight;

    // 3. 建立滿版 SVG 畫布
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("id", "resource-polygon-svg");
    svg.style.position = "absolute";
    svg.style.left = mapImg.offsetLeft + "px"; 
    svg.style.top = mapImg.offsetTop + "px";
    svg.style.width = currentWidth + "px";     
    svg.style.height = currentHeight + "px";
    svg.style.pointerEvents = "none";

    // 🚀 核心升級：自動判定丟進來的是「單一區域點位」還是「多個區域點位的集合」
    // 如果 points[0][0] 還是個陣列，代表它是被分組過後的 [ [[x,y],[x,y]], [[x,y],[x,y]] ] 複合陣列
    const isMultiPolygon = Array.isArray(points[0]) && Array.isArray(points[0][0]);
    const polygonList = isMultiPolygon ? points : [points];

    // 🚀 4. 使用迴圈把清單內所有的多邊形碎塊通通畫在同一個畫布上
    polygonList.forEach(polyPoints => {
        if (!polyPoints || polyPoints.length === 0) return;

        // 將遊戲坐標換算成真實的像素坐標
        const convertedPoints = polyPoints.map(pt => {
            const pixelX = (pt[0] / maxX) * currentWidth;
            const pixelY = (pt[1] / maxY) * currentHeight;
            return `${pixelX},${pixelY}`; 
        }).join(" ");

        // 5. 建立 SVG 的 polygon 標籤
        const polygon = document.createElementNS(svgNamespace, "polygon");
        polygon.setAttribute("points", convertedPoints);
        
        // 🎨 設定紅線範圍的樣式（已改為超清爽 0.15 透明度）
        polygon.setAttribute("fill", "rgba(255, 77, 77, 0.15)");
        polygon.setAttribute("stroke", "#ff4d4d");
        polygon.setAttribute("stroke-width", "1.5");

        svg.appendChild(polygon);
    });

    // 6. 塞進畫面
    wrapper.appendChild(svg);
};

// 🚀 新增：清除紅線範圍的函數 (關閉 Modalbox 或點擊其他資源時呼叫)
window.clearResourcePolyRange = function() {
    const oldSvg = document.getElementById("resource-polygon-svg");
    if (oldSvg) oldSvg.remove();
};

// --- 💡 核心關鍵：當 Modalbox 顯示完成後，呼叫這個函數去 Supabase 撈資料 ---
// 🚀 請確保這裡的接收參數順序，跟你在 openMapDetail 傳進去的一模一樣！
async function loadModalZoneButtons(mapName, maxX, maxY, mainRubbish, mainProduct, mainHero, mainOther) {
  const zoneContainer = document.getElementById('modal-zone-list');
  const zoneSection = document.getElementById('zone-section');
  if (!zoneContainer || !zoneSection || !mapName) return;

  try {
    const [zonesRes, dropsRes] = await Promise.all([
      supabase.from('map_polygon_zones').select('zone_name, points').eq('map_name', mapName),
      supabase.from('map_zone_drops')
              .select('zone_name, drop_rubbish, drop_product, drop_heroes, drop_other')
              .eq('map_id', mapName)
              .order('sort_id', { ascending: true })
    ]);

    if (zonesRes.error) throw zonesRes.error;
    const zones = zonesRes.data || [];
    const drops = dropsRes.data || [];

    // 🚀 核心優化：過濾掉「全區」這筆資料後，再來判斷要不要顯示按鈕區塊
    const realZonesHasButtons = zones.filter(z => z.zone_name !== '全區');
    const realDropsHasButtons = drops.filter(d => d.zone_name !== '全區');

    if (realZonesHasButtons.length > 0 || realDropsHasButtons.length > 0) {
      zoneSection.style.display = 'block';
    } else {
      zoneSection.style.display = 'none';
    }

    // 2. 萬用工具：合併主表 + 分區表所有掉落（包含「全區」填寫的也會一起被合併進去去重！）
    function setupDynamicRow(elementId, rowId, mainValue, zoneValuesArray, isCardType, cardTypeParam) {
        const el = document.getElementById(elementId);
        const row = document.getElementById(rowId);
        if (!el || !row) return;

        let allItems = [];
        if (mainValue) allItems = allItems.concat(mainValue.split(/[,，、\s]+/));
        zoneValuesArray.forEach(val => {
            if (val) allItems = allItems.concat(val.split(/[,，、\s]+/));
        });

        const uniqueItems = Array.from(new Set(allItems)).filter(x => x);
        if (uniqueItems.length > 0) {
            const cleanRawStr = uniqueItems.join('、');
            if (isCardType) {
                el.innerHTML = formatTieredContent(cleanRawStr, false, cardTypeParam);
            } else {
                el.innerHTML = cleanRawStr;
            }
            row.style.display = ''; 
            el.setAttribute('data-default', cleanRawStr); 
        } else {
            row.style.display = 'none'; 
            el.setAttribute('data-default', '');
        }
    }

    setupDynamicRow('dynamic-drop-rubbish', 'dynamic-drop-rubbish-row', mainRubbish, drops.map(d => d.drop_rubbish).filter(x => x), false);
    setupDynamicRow('dynamic-drop-product', 'dynamic-drop-product-row', mainProduct, drops.map(d => d.drop_product).filter(x => x), false);
    setupDynamicRow('dynamic-drop-hero',    'dynamic-drop-hero-row',    mainHero,    drops.map(d => d.drop_heroes).filter(x => x),  true, 'hero');
    setupDynamicRow('dynamic-drop-othrt',    'dynamic-drop-othrt-row',    mainOther,   drops.map(d => d.drop_other).filter(x => x),   true);

    // 4. 動態生成區域按鈕
    if (zones.length > 0) {
        const groupedZones = {};
        zones.forEach(zone => {
          // 🚀 核心修正 1：如果有點位資料名字叫「全區」，直接跳過不加入分組，不給它做按鈕！
          if (zone.zone_name === '全區') return;
          
          if (!groupedZones[zone.zone_name]) { groupedZones[zone.zone_name] = []; }
          groupedZones[zone.zone_name].push(zone.points);
        });

        // 🚀 核心修正 2：先在 drops 裡把「全區」的那一包撈出來備用
        const globalDrop = drops.find(d => d.zone_name === '全區') || {};

        zoneContainer.innerHTML = Object.keys(groupedZones).map(zoneName => {
          const multiPointsStr = JSON.stringify(groupedZones[zoneName]);
          const d = drops.find(d => d.zone_name === zoneName) || {};

          // 🚀 核心修正 3：傳進 switchZoneDisplay 的時候，自動把「當前區域的掉落」跟「全區掉落」黏在一起！
          // 這樣點擊 A 區時，畫面就會呈現：A區掉落 + 全區掉落，而不會漏掉全區的東西
          const finalRubbish = [d.drop_rubbish, globalDrop.drop_rubbish].filter(x => x).join(',');
          const finalProduct = [d.drop_product, globalDrop.drop_product].filter(x => x).join(',');
          const finalHero    = [d.drop_heroes,  globalDrop.drop_heroes].filter(x => x).join(',');
          const finalOther   = [d.drop_other,   globalDrop.drop_other].filter(x => x).join(',');

          return `
            <button class="resource-btn zone-btn" style="border-color: #ff4d4d; color: #ff4d4d;"
                    onclick="switchZoneDisplay(${multiPointsStr}, ${maxX}, ${maxY}, 
                      '${finalRubbish}', 
                      '${finalProduct}', 
                      '${finalHero}', 
                      '${finalOther}')">
              ${zoneName}
            </button>
          `;
        }).join('');
    } else {
        zoneContainer.innerHTML = '';
    }

  } catch (err) {
    console.error("載入區域失敗:", err.message);
  }
}

window.switchZoneDisplay = function(points, maxX, maxY, zoneRubbish, zoneProduct, zoneHero, zoneOther) {
    if (typeof showResourcePolyRange === "function") {
        showResourcePolyRange(points, maxX, maxY);
    }

    function toggleRowValue(elementId, rowId, zoneValue, isCardType, cardTypeParam) {
        const el = document.getElementById(elementId);
        const row = document.getElementById(rowId);
        if (!el || !row) return;

        if (zoneValue) {
            // 🚀 核心修正：將「分區+全區」混合的資料進行去重處理，防止重複出現
            const uniqueItems = Array.from(new Set(zoneValue.split(/[,，、\s]+/))).filter(x => x);
            const cleanZoneValue = uniqueItems.join('、');

            if (uniqueItems.length > 0) {
                if (isCardType) {
                    el.innerHTML = formatTieredContent(cleanZoneValue, false, cardTypeParam);
                } else {
                    el.innerHTML = cleanZoneValue;
                }
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        } else {
            row.style.display = 'none';
        }
    }

    toggleRowValue('dynamic-drop-rubbish', 'dynamic-drop-rubbish-row', zoneRubbish, false);
    toggleRowValue('dynamic-drop-product', 'dynamic-drop-product-row', zoneProduct, false);
    toggleRowValue('dynamic-drop-hero',    'dynamic-drop-hero-row',    zoneHero,    true, 'hero');
    toggleRowValue('dynamic-drop-othrt',    'dynamic-drop-othrt-row',    zoneOther,   true);
};

window.openMapDetail = function (mapId) {
  const item = mapData.find(m => m.mapid === mapId);
  if (!item) return;

  const modalContent = document.getElementById("modalContent");
  const autoImagePath = `/mo_data/pic/map/${item.mapid}.jpg`;

  // 獲取該地圖的資源點位
  const resources = resourceData.filter(r => r.map_id === item.mapid);

  // 判斷邏輯
  const approachA = item.approach_a || "";
  const isTown = approachA.includes("城鎮");
  const showApproach = approachA.includes("要");
  const showExplain = approachA.includes("說明");
  
let resourceButtonsHTML = "";

// 只要有採集資源，或者是地圖物件存在，我們就初始化字串
if (resources.length > 0 || item) {
  resourceButtonsHTML = `
    ${resources.length > 0 ? `
      <div class="resource-group section-gap">
        <div class="resource-group-title"><i class="fas fa-hammer"></i> 採集資源點 (點擊查看位置)</div>
        <div class="resource-list">
          ${resources.map(r => `
            <button class="resource-btn" onclick="showResourceMarker(${r.x}, ${r.y}, '${r.resource_name}', ${item.game_max_x}, ${item.game_max_y})">
              ${r.resource_name} ${r.game_coords ? `(${r.game_coords})` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div id="zone-section" class="resource-group section-gap" style="display: none; margin-top: 10px;">
  
  <div class="zone-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
    <div class="zone-group-title" style="font-weight: bold; color: var(--text-color); margin-bottom: 0;">
      <i class="fas fa-layer-group"></i> 區域範圍顯示 (點擊查看範圍)
    </div>
    
    <button class="resource-btn" 
            style="margin: 0; padding: 2px 8px; font-size: 12px; border-color: #888; color: #888; background: transparent;"
            onclick="resetZoneSelection()">
      <i class="fas fa-eraser"></i> 清除範圍
    </button>
  </div>

  <div class="zone-list" id="modal-zone-list" style="margin-top: 5px;">
    </div>
</div>
  `;
}

  const detailsHTML = `
  ${showApproach ? `<p style="margin-bottom: 8px;"><strong>走法：</strong>${formatDescription(item.approach)}</p>` : ""}
  ${showExplain ? `<p style="margin-bottom: 0;"><strong>說明：</strong>${formatDescription(item.illustrate)}</p>` : ""}
`.trim();

  let combatAndDropHTML = '';
  if (!isTown) {
    const hasDrop = !!(item.drop_rubbish || item.drop_hero || item.drop_equidcard || item.drop_skillcard || item.drop_combo_old || item.drop_combo_new || item.drop_othrt);
    combatAndDropHTML = `
            <div class="hero-defdodge section-gap">
                <p><strong>怪物等級：</strong>${item.maplv || "-"}</p>
                <p><strong>防禦：</strong>${item.def || "-"}　<strong>閃避：</strong>${item.dodge || "-"}</p>
            </div>
            ${hasDrop ? `
              <div class="hero-column-details section-gap">
                    <p><strong>掉落物品：</strong></p>
                <p class="align-row" id="dynamic-drop-rubbish-row" style="display: none;">
            <strong>◢ 垃圾：</strong>
            <span id="dynamic-drop-rubbish"></span>
        </p>
        <p class="align-row" id="dynamic-drop-product-row" style="display: none;">
    <strong>◢ 產物：</strong>
    <span id="dynamic-drop-product"></span>
</p>
                    ${item.drop_equidcard ? `<p class="align-row"><strong>◢ 裝備卡：</strong><span>${formatTieredContent(item.drop_equidcard, false, 'equip')}</span></p>` : ""}
                    ${item.drop_skillcard ? `<p class="align-row"><strong>◢ 技能卡：</strong><span>${formatTieredContent(item.drop_skillcard, false, 'skill')}</span></p>` : ""}
                    <p class="align-row" id="dynamic-drop-hero-row" style="display: none;">
            <strong>◢ 英雄卡：</strong><span id="dynamic-drop-hero"></span>
        </p>
                    ${item.drop_combo_old ? `<p class="align-row"><strong>◢ 舊文片：</strong><span>${formatTieredContent(item.drop_combo_old)}</span></p>` : ""}
                    ${item.drop_combo_new ? `<p class="align-row"><strong>◢ 新文片：</strong><span>${formatTieredContent(item.drop_combo_new)}</span></p>` : ""}
                    <p class="align-row" id="dynamic-drop-othrt-row" style="display: none;">
            <strong>◢ 其他：</strong><span id="dynamic-drop-othrt"></span>
        </p>
                </div>` : ""
      }
            <div class="hero-column-details section-gap">
                <p><strong>光輝資訊：</strong></p>
                <p class="align-row"><strong>◢ 掉落較高：</strong><span>${formatGloryWithTooltip(item.drop_glory_high)}</span></p>
                <p class="align-row"><strong>◢ 掉落較低：</strong><span>${formatGloryWithTooltip(item.drop_glory_low)}</span></p>
                ${item.drop_glory_player ? `<p class="align-row"><strong>◢ 玩家提供：</strong><span>${item.drop_glory_player}</span></p>` : ""}
            </div>
        `;
  }

  modalContent.innerHTML = `
        <h2 class="hero-name">${item.mapid}</h2>
        <div class="map-image-wrapper">
          <div class="map-image-relative-wrapper">
            <img src="${autoImagePath}" class="hero-image" onerror="this.style.display='none'" />
            <div id="resource-ping" class="resource-ping">
              <img src="/mo_data/pic/sys/marker.png" style="width:100%;height:100%;object-fit:contain;">
            </div>
          </div>
        </div>
        ${resourceButtonsHTML}
        ${(showApproach || showExplain) ?
      `<div class="hero-column-details section-gap">${detailsHTML}</div>` :
      ""
    }
        ${combatAndDropHTML}
    `;

  showModal();
  setTimeout(() => {
    if (typeof loadModalZoneButtons === "function") {
        loadModalZoneButtons(
            item.mapid, 
            item.game_max_x, 
            item.game_max_y, 
            item.drop_rubbish || "",  // 第 4 個參數
            item.drop_product || "",   // 第 5 個參數 (🚀 新增)
            item.drop_hero || "",       // 參數 6 (🚀 新增)
            item.drop_othrt || ""       // 參數 9 (🚀 新增)
        );
    }
}, 50);
};

// === 2. 核心初始化 ===
document.addEventListener("DOMContentLoaded", () => {
  loadColumnSettings();
  loadData();
  initMapTabs();
  initImageMapResizer();
  bindModalEvents();
});

window.resetZoneSelection = function() {
    if (typeof clearResourcePolyRange === "function") {
        clearResourcePolyRange();
    }

    function restoreRow(elementId, rowId, isCardType, cardTypeParam) {
        const el = document.getElementById(elementId);
        const row = document.getElementById(rowId);
        if (!el || !row) return;

        const defRaw = el.getAttribute('data-default');
        if (defRaw) {
            if (isCardType) {
                // 🚀 核心修正：直接還原超連結
                el.innerHTML = formatTieredContent(defRaw, false, cardTypeParam);
            } else {
                el.innerHTML = defRaw;
            }
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }

    restoreRow('dynamic-drop-rubbish', 'dynamic-drop-rubbish-row', false);
    restoreRow('dynamic-drop-product', 'dynamic-drop-product-row', false);
    restoreRow('dynamic-drop-hero',    'dynamic-drop-hero-row',    true, 'hero');
    restoreRow('dynamic-drop-othrt',    'dynamic-drop-othrt-row',    true);
};

// === 3. 資料載入與對接 ===
async function loadData() {
  const [mapRes, gloryRes, playerRes, heroRes, resourceRes] = await Promise.all([
    supabase.from('detailed_map').select('*').order('sort_id', { ascending: true }),
    supabase.from('glory_drop').select('*'),
    supabase.from('glory_drop_player').select('*'),
    supabase.from('heroes').select('name, glory'),
    supabase.from('map_resources').select('*').order('sort_id', { ascending: true })
  ]);

  if (mapRes.error) {
    console.error('載入地圖資料錯誤:', mapRes.error);
    const tbody = document.querySelector('#heroes-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="15">無法載入地圖資料</td></tr>';
    return;
  }

  const rawMapData = mapRes.data;
  resourceData = resourceRes.data || [];
  const gloryDropData = gloryRes.data || [];
  const playerDropData = playerRes.data || [];
  const heroesData = heroRes.data || [];

  heroGloryMap = {};
  heroesData.forEach(h => {
    if (h.glory) {
      if (!heroGloryMap[h.glory]) heroGloryMap[h.glory] = [];
      heroGloryMap[h.glory].push(h.name);
    }
  });

  mapData = rawMapData.map(map => {
    const matchedGlory = gloryDropData.find(g => {
      if (!g.area) return false;
      const areas = g.area.split('、');
      return areas.includes(map.mapid);
    });

    const matchedPlayer = playerDropData.find(p => {
      if (!p.area) return false;
      const areas = p.area.split('、');
      return areas.includes(map.mapid);
    });

    let result = { ...map };

    if (matchedGlory) {
      result = {
        ...result,
        drop_glory_high: matchedGlory.more,
        drop_glory_low: matchedGlory.low,
        glory_area: matchedGlory.area
      };
    }

    if (matchedPlayer) {
      result = {
        ...result,
        drop_glory_player: matchedPlayer.drop_content
      };
    }

    return result;
  });

  if (document.querySelector("#heroes-table tbody")) {
    initTableSearch();
    initColumnSettings();
  }

  // 🚀 智慧連動邏輯：檢查網址參數是否有導航請求
  const urlParams = new URLSearchParams(window.location.search);
  const targetMap = urlParams.get('map');
  const targetResource = urlParams.get('resource');
  const targetX = urlParams.get('x');
  const targetY = urlParams.get('y');

  if (targetMap) {
    // 延遲一下下，確保資料已完全渲染
    setTimeout(() => {
      openMapDetail(targetMap);
      if (targetX && targetY && targetResource) {
        // 再次延遲確保 Modal 內容已載入
        setTimeout(() => {
          const item = mapData.find(m => m.mapid === targetMap);
          if (item) {
            window.showResourceMarker(
              parseFloat(targetX), 
              parseFloat(targetY), 
              targetResource, 
              item.game_max_x, 
              item.game_max_y
            );
          }
        }, 300);
      }
    }, 500);
  }
}

function initTableSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById('clearFilters');
  if (!searchInput) return;

  renderTable(mapData, "");

  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    applyFilters(keyword);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters("");
      searchInput.focus();
    });
  }
}

function applyFilters(keyword) {
  const filtered = mapData.filter(item => {
    return (
      (item.mapid && item.mapid.toLowerCase().includes(keyword)) ||
      (item.drop_rubbish && item.drop_rubbish.includes(keyword)) ||
      (item.drop_hero && item.drop_hero.includes(keyword)) ||
      (item.drop_equidcard && item.drop_equidcard.includes(keyword)) ||
      (item.drop_skillcard && item.drop_skillcard.includes(keyword)) ||
      (item.drop_combo_old && item.drop_combo_old.includes(keyword)) ||
      (item.drop_combo_new && item.drop_combo_new.includes(keyword)) ||
      (item.drop_glory_high && item.drop_glory_high.includes(keyword)) ||
      (item.maplv && String(item.maplv).includes(keyword))
    );
  });
  renderTable(filtered, keyword);
}

function renderTable(data, keyword = "") {
  const thead = document.querySelector("#heroes-table thead tr");
  const tbody = document.querySelector("#heroes-table tbody");
  const table = document.getElementById("heroes-table");
  if (!tbody || !thead) return;

  table.classList.add("rwd-card");
  thead.innerHTML = "";
  activeColumns.forEach(colId => {
    const colInfo = ALL_COLUMNS.find(c => c.id === colId);
    const th = document.createElement("th");
    th.className = "sortable";
    th.dataset.col = colId;
    th.textContent = colInfo ? colInfo.label : colId;
    thead.appendChild(th);
  });

  tbody.innerHTML = "";
  const fragment = document.createDocumentFragment();

  if (data.length === 0) {
    const emptyTr = document.createElement("tr");
    emptyTr.innerHTML = `<td colspan="${activeColumns.length}" style="text-align:center;">找不到相符的地圖資料</td>`;
    tbody.appendChild(emptyTr);
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.onclick = () => window.openMapDetail(item.mapid);

    activeColumns.forEach((colId, index) => {
      const td = document.createElement("td");
      if (colId === 'mapid') {
        td.classList.add('table-title-cell');
        td.style.textAlign = 'center';
      }
      const colInfo = ALL_COLUMNS.find(c => c.id === colId);
      td.setAttribute("data-label", colInfo ? colInfo.label : colId);

      let val = item[colId];
      const isDropCol = colId.startsWith('drop_');
      let content = formatTieredContent(val, isDropCol);

      if (keyword && content !== "-" && content.toLowerCase().includes(keyword.toLowerCase())) {
        const regex = new RegExp(`(${keyword})`, 'gi');
        content = content.replace(regex, '<span class="highlight">$1</span>');
      }

      if (colId === 'mapid') {
        td.innerHTML = `<strong>${content}</strong>`;
      } else if (colId === 'maplv' && val) {
        td.innerHTML = `<span class="lv-badge">${content}</span>`;
      } else {
        td.innerHTML = content;
      }
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);
}

function initColumnSettings() {
  const btn = document.getElementById("columnSettingsBtn");
  const menu = document.getElementById("columnSettingsMenu");
  const container = document.getElementById("columnCheckboxes");
  const saveBtn = document.getElementById("saveColumnSettings");
  const closeBtn = document.getElementById("closeColumnSettings");
  const resetBtn = document.getElementById("resetDefaultColumns");

  if (!btn || !menu || !container) return;

  const generateCheckboxes = () => {
    container.innerHTML = "";
    ALL_COLUMNS.forEach(col => {
      const label = document.createElement("label");
      label.className = "checkbox-item";
      const isChecked = activeColumns.includes(col.id) || col.id === 'mapid';
      const isDisabled = col.id === 'mapid';

      label.innerHTML = `
        <input type="checkbox" value="${col.id}" 
          ${isChecked ? 'checked' : ''} 
          ${isDisabled ? 'disabled' : ''}>
        ${col.label} ${isDisabled ? '(固定)' : ''}
      `;
      container.appendChild(label);
    });
  };

  generateCheckboxes();

  btn.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  };

  closeBtn.onclick = () => menu.classList.remove("active");

  resetBtn.onclick = () => {
    activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
    generateCheckboxes();
    saveBtn.click();
  };

  saveBtn.onclick = () => {
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    activeColumns = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    if (activeColumns.length === 0) activeColumns = ['mapid'];
    localStorage.setItem("mapActiveColumns", JSON.stringify(activeColumns));
    menu.classList.remove("active");
    const searchInput = document.getElementById("searchInput");
    renderTable(mapData, searchInput ? searchInput.value : "");
  };

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.classList.remove("active");
    }
  });
}

function loadColumnSettings() {
  const saved = localStorage.getItem("mapActiveColumns");
  if (saved) {
    try {
      activeColumns = JSON.parse(saved);
    } catch (e) {
      activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
    }
  } else {
    activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
  }
}

function initMapTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const scrollLeftBtn = document.getElementById("scroll-left");
  const scrollRightBtn = document.getElementById("scroll-right");
  const tabsScroll = document.getElementById("tabs-scroll");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button, .tab-content").forEach(el => el.classList.remove("active"));
      button.classList.add("active");
      const target = document.getElementById(button.dataset.tab);
      if (target) {
        target.classList.add("active");
        if (typeof imageMapResize === 'function') {
          setTimeout(() => imageMapResize('map'), 150);
        }
      }
    });
  });

  if (scrollLeftBtn && scrollRightBtn && tabsScroll) {
    scrollLeftBtn.addEventListener("click", () => tabsScroll.scrollBy({ left: -200, behavior: "smooth" }));
    scrollRightBtn.addEventListener("click", () => tabsScroll.scrollBy({ left: 200, behavior: "smooth" }));
    const updateArrows = () => {
      const scrollLeft = tabsScroll.scrollLeft;
      const maxScroll = tabsScroll.scrollWidth - tabsScroll.clientWidth;
      scrollLeftBtn.style.opacity = scrollLeft <= 0 ? "0.3" : "1";
      scrollLeftBtn.style.pointerEvents = scrollLeft <= 0 ? "none" : "auto";
      scrollRightBtn.style.opacity = scrollLeft >= maxScroll - 1 ? "0.3" : "1";
      scrollRightBtn.style.pointerEvents = scrollLeft >= maxScroll - 1 ? "none" : "auto";
    };
    tabsScroll.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }
}

function initImageMapResizer() {
  try {
    if (typeof imageMapResize === 'function' && document.querySelector('map')) {
      imageMapResize('map');
    }
  } catch (e) { console.warn("Resizer skipped"); }
}

function showModal() {
  const modalBox = document.getElementById("modalBox");
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.style.display = "block";
  if (modalBox) {
    modalBox.style.display = "block";
    modalBox.scrollTop = 0;
  }
}

function closeModal() {
  const box = document.getElementById("modalBox");
  const overlay = document.getElementById("modalOverlay");
  if (box) {
      box.style.display = "none";
      box.classList.remove("modal-large-mode");
  }
  if (overlay) overlay.style.display = "none";
}

function bindModalEvents() {
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.querySelector(".close-btn");
  if (overlay) overlay.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}
