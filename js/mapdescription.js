// \js\mapdescription.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

document.addEventListener("DOMContentLoaded", async () => {
    const sidebar = document.getElementById('system-sidebar');
    const sidebarTitle = sidebar.querySelector('h2');
    const menuContainer = document.getElementById('system-menu');
    const contentDisplay = document.getElementById('dynamic-content');
    
    const searchInput = document.getElementById('system-search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    // 全域變數：儲存當前讀取到的地圖 JS 資料模組
    let currentMapModule = null;

    sidebarTitle?.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        }
    });

    // === 動態更新傳點下拉選單選項 ===
    function updatePortalOptions(floorSelectId, portalSelectId) {
        if (!currentMapModule) return;

        const floorSelect = document.getElementById(floorSelectId);
        const portalSelect = document.getElementById(portalSelectId);
        if (!floorSelect || !portalSelect) return;

        const floor = floorSelect.value;
        const isStart = floorSelectId === 'start-floor-select';
        
        portalSelect.innerHTML = '';

        // 讀取當前地圖模組的資料
        const connections = currentMapModule.INTERNAL_CONNECTIONS || {}; //[cite: 5, 6]
        const portalLabels = currentMapModule.PORTAL_LABELS || {};       // 🌟 皇陵沒有這項也不會錯[cite: 5, 6]
        const floorPortalLabels = portalLabels[floor] || {};
        const portals = Object.keys(connections[floor] || {});          //[cite: 5, 6, 7]

        // 判斷是否包含預設起點 (green-start)
        const hasGreenStart = portals.includes('green-start');          //[cite: 5, 6]

        if (isStart && hasGreenStart) {
            portalSelect.innerHTML += '<option value="green-start" selected>🟢 綠色入口 (預設)</option>'; //
        } else if (!isStart) {
            portalSelect.innerHTML += '<option value="" selected>✨ 任意門 (到達即可)</option>'; //
        }

        portals.forEach(p => {
            if (p !== 'green-start') {
                // 🌟 核心技巧：有中文顯示中文 (修羅洞)，沒中文顯示原始 Code (皇陵)
                const labelText = floorPortalLabels[p] || p; 
                portalSelect.innerHTML += `<option value="${p}">${labelText}</option>`;
            }
        });
    }

    // === 載入內容頁面函式 ===
    async function loadSystemPage(fileName, titleText) {
        if (window.innerWidth <= 768 && titleText) {
            sidebarTitle.innerHTML = `走法：${titleText}`;
        } else {
            sidebarTitle.innerHTML = "洞窟走法";
        }

        try {
            // 1. 讀取 HTML 描述檔
            const response = await fetch(`./description/${fileName}`);
            if (!response.ok) throw new Error(`找不到內容檔案 (HTTP ${response.status})`);
            const html = await response.text();
            contentDisplay.innerHTML = html;

            // 2. 🌟 關鍵：動態 import 對應的地圖資料 JS 檔
            // 例：'imperialmausoleum.html' 轉為 'imperialmausoleum'
            const mapKey = fileName.replace('.html', ''); 
            
            try {
                // 從 /js/map-data/ 資料夾載入對應檔名的 JS
                currentMapModule = await import(`../js/map-data/${mapKey}.js`);
                console.log(`✅ 成功動態載入地圖模組: ${mapKey}.js`);
            } catch (jsErr) {
                console.warn(`⚠️ 該地圖 (${mapKey}) 沒有獨立的 JS 尋路資料檔，或路徑有誤。`, jsErr);
                currentMapModule = null;
            }

            // 3. 初始化傳點選單
            updatePortalOptions('start-floor-select', 'start-portal-select');
            updatePortalOptions('end-floor-select', 'end-portal-select');

            if (window.innerWidth <= 768) {
                window.scrollTo({ top: sidebar.offsetTop, behavior: 'smooth' });
            }

        } catch (error) {
            console.error("載入失敗:", error);
            contentDisplay.innerHTML = `<h3 style="color:red;">錯誤：無法讀取內容<br>原因：${error.message}</h3>`;
        }
    }

    // ==========================================
    // 🛠️ 互動地圖傳點事件代理 (點擊 & Hover 高亮)
    // ==========================================
    document.addEventListener('click', (e) => {
        const portal = e.target.closest('.portal-tag');
        if (!portal) return;

        const portalCode = portal.getAttribute('data-portal');
        const targetFloorId = portal.getAttribute('data-target-floor');

        if (targetFloorId) {
            const targetFloor = document.getElementById(targetFloorId);
            if (targetFloor) {
                targetFloor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                const targetPortals = targetFloor.querySelectorAll(`[data-portal="${portalCode}"]`);
                targetPortals.forEach(el => el.classList.add('active'));
                setTimeout(() => {
                    targetPortals.forEach(el => el.classList.remove('active'));
                }, 2000);
            }
        }
    });

    document.addEventListener('mouseover', (e) => {
        const portal = e.target.closest('.portal-tag');
        if (!portal) return;

        const portalCode = portal.getAttribute('data-portal');
        if (portalCode) {
            document.querySelectorAll(`[data-portal="${portalCode}"]`).forEach(el => el.classList.add('active'));
        }
    });

    document.addEventListener('mouseout', (e) => {
        const portal = e.target.closest('.portal-tag');
        if (!portal) return;

        document.querySelectorAll('.portal-tag').forEach(el => el.classList.remove('active'));
    });

    // ==========================================
    // 🛠️ 下拉選單連動事件代理
    // ==========================================
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'start-floor-select') {
            updatePortalOptions('start-floor-select', 'start-portal-select');
        }
        if (e.target && e.target.id === 'end-floor-select') {
            updatePortalOptions('end-floor-select', 'end-portal-select');
        }
    });

    // ==========================================
    // 🛠️ 尋路搜尋按鈕觸發事件代理
    // ==========================================
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'search-route-btn') {
            if (!currentMapModule) {
                alert("此地圖尚未設定尋路資料檔！");
                return;
            }

            const startSelect = document.getElementById('start-floor-select');
            const endSelect = document.getElementById('end-floor-select');
            const startPortalSelect = document.getElementById('start-portal-select');
            const endPortalSelect = document.getElementById('end-portal-select');
            const resultBox = document.getElementById('route-result');

            if (!startSelect || !endSelect || !resultBox) return;

            const startFloor = startSelect.value;
            const endFloor = endSelect.value;
            const startPortal = startPortalSelect?.value || 'green-start';
            const endPortal = endPortalSelect?.value || null;

            document.querySelectorAll('.portal-tag').forEach(el => el.classList.remove('active'));

            if (startFloor === endFloor && startPortal === endPortal) {
                resultBox.innerHTML = '⚠️ 起點與終點完全相同，無需移動！';
                return;
            }

            // 🌟 呼叫動態載入的模組演算法
            const path = currentMapModule.findRealShortestPath(startFloor, endFloor, startPortal, endPortal);

            if (!path || path.length === 0) {
                resultBox.innerHTML = '❌ 找不到連通路線！';
                return;
            }

            const floorNames = currentMapModule.FLOOR_NAMES || {};
            const portalLabels = currentMapModule.PORTAL_LABELS || {}; // 🌟 新增這行：讀取傳點中文表

            let html = `<strong>💡 從「${floorNames[startFloor] || startFloor}」前往「${floorNames[endFloor] || endFloor}」的最佳走法：</strong><br>`; //[cite: 7]
            
            path.forEach((step, index) => {
                const fromName = floorNames[step.fromFloor] || step.fromFloor; 
                const toName = floorNames[step.toFloor] || step.toFloor; 
                
                // 🌟 取得傳點顯示名稱 (有中文用中文，無中文用 key)
                const portalText = portalLabels[step.fromFloor]?.[step.walkToPortal] || step.walkToPortal;

                if (step.isFinalWalk) {
                    html += `${index + 1}. 在 <b>${fromName}</b> 走至傳點 [<span style="color:#e74c3c; font-weight:bold;">${portalText}</span>] 抵達終點<br>`;
                } else {
                    html += `${index + 1}. 在 <b>${fromName}</b> 走向傳點 [<span style="color:#e74c3c; font-weight:bold;">${portalText}</span>] ➔ 進入 <b>${toName}</b><br>`;
                }

                document.querySelectorAll(`[data-portal="${step.walkToPortal}"]`).forEach(el => {
                    el.classList.add('active');
                });
            });

            resultBox.innerHTML = html;
        }
    });

    // ==========================================
    // 🛠️ 選單搜尋過濾函式
    // ==========================================
    function filterMenuItems(keyword) {
        const listItems = menuContainer.querySelectorAll('li');
        listItems.forEach(li => {
            const text = li.innerText.toLowerCase(); 
            const aliases = (li.getAttribute('data-aliases') || '').toLowerCase(); 
            
            if (text.includes(keyword) || aliases.includes(keyword)) {
                li.style.display = ''; 
            } else {
                li.style.display = 'none'; 
            }
        });
    }

    // ==========================================
    // 🛠️ Supabase 讀取側邊欄選單
    // ==========================================
    // ==========================================
    // 🛠️ Supabase 讀取側邊欄選單
    // ==========================================
    try {
        let { data: gameSystems, error } = await supabase
            .from('mapdescription')
            .select('*')
            .eq('is_active', true)
            .order('sort_id', { ascending: false });

        if (error) throw error;
        
        if (!gameSystems || gameSystems.length === 0) {
            menuContainer.innerHTML = '<li>目前沒有可用的洞窟介紹</li>';
            return;
        }

        menuContainer.innerHTML = '';

        const urlParams = new URLSearchParams(window.location.search);
        const targetSysFile = urlParams.get('sys'); 
        
        // 🚀 抓取網址中的 search 關鍵字 (例如 ?search=鬼煞洞)
        const searchKeyword = urlParams.get('search'); 

        const matchedSystem = gameSystems.find(item => item.file_name === targetSysFile);

        gameSystems.forEach((item, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-file', item.file_name);
            li.setAttribute('data-aliases', item.aliases || ''); 
            li.innerText = item.title;
            
            if (matchedSystem) {
                if (item.file_name === matchedSystem.file_name) li.classList.add('active');
            } else {
                if (index === 0) li.classList.add('active');
            }

            li.addEventListener('click', () => {
                menuContainer.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                li.classList.add('active');

                loadSystemPage(item.file_name, item.title);
                document.title = `${item.title} | MoData`;

                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });

            menuContainer.appendChild(li);
        });

        if (matchedSystem) {
            loadSystemPage(matchedSystem.file_name, matchedSystem.title);
            document.title = `${matchedSystem.title} | MoData`;
        } else {
            loadSystemPage(gameSystems[0].file_name, gameSystems[0].title);
        }

        // 🚀 初始化搜尋框事件與 URL 關鍵字自動過濾
        if (searchInput && clearBtn) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                clearBtn.style.display = keyword.length > 0 ? 'block' : 'none';
                filterMenuItems(keyword);
            });

            clearBtn.addEventListener('click', () => {
                searchInput.value = '';        
                clearBtn.style.display = 'none'; 
                filterMenuItems('');           
                searchInput.focus();           
            });

            // ✨ 如果網址帶有 ?search=xxx 參數，自動填入搜尋框並過濾清單
            if (searchKeyword) {
                searchInput.value = searchKeyword;
                clearBtn.style.display = 'block';
                filterMenuItems(searchKeyword.toLowerCase().trim());
            }
        }

    } catch (err) {
        console.error('資料載入失敗:', err);
        menuContainer.innerHTML = `<li style="color: red;">選單載入錯誤</li>`;
    }
});

// ==========================================
// 🛠️ 開發者自動取點助手 (點圖片直接輸出 style 程式碼)
// 💡 完成所有座標填寫後，可將此段註解掉
// ==========================================
/*
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('system-img')) {
        const img = e.target;
        const rect = img.getBoundingClientRect();
        
        const left = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
        const top = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
        
        console.log(`style="top: ${top}%; left: ${left}%;"`);
        navigator.clipboard.writeText(`style="top: ${top}%; left: ${left}%;"`);
        alert(`已複製位置到剪貼簿！\nstyle="top: ${top}%; left: ${left}%;"`);
    }
});
*/
