// /mo_data/js/system.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'
import { FLOOR_NAMES, findShortestPath } from '../js/map-data.js';

// 初始化你的 supabase 客戶端
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

document.addEventListener("DOMContentLoaded", async () => {
    const sidebar = document.getElementById('system-sidebar');
    const sidebarTitle = sidebar.querySelector('h2');
    const menuContainer = document.getElementById('system-menu');
    const contentDisplay = document.getElementById('dynamic-content');
    
    // 取得搜尋輸入框與清除按鈕節點
    const searchInput = document.getElementById('system-search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    // 手機版：點擊標題切換展開/收合
    sidebarTitle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        }
    });

    // === 載入內容頁面函式 ===
    function loadSystemPage(fileName, titleText) {
        if (window.innerWidth <= 768 && titleText) {
            sidebarTitle.innerHTML = `系統：${titleText}`;
        } else {
            sidebarTitle.innerHTML = "洞窟走法";
        }

        const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const fullFetchPath = currentDir + `description/${fileName}`;

        fetch(`./description/${fileName}`)
            .then(response => {
                if (!response.ok) throw new Error('找不到內容檔案');
                return response.text();
            })
            .then(html => {
                contentDisplay.innerHTML = html;
                if (window.innerWidth <= 768) {
                    window.scrollTo({ top: sidebar.offsetTop, behavior: 'smooth' });
                }
            })
            .catch(error => {
                contentDisplay.innerHTML = `<h3 class="search-tip" style="color:red;">錯誤：無法讀取內容<br>請求路徑：${fullFetchPath}<br>原因：${error.message}</h3>`;
            });
    }

    // ==========================================
    // 🛠️ 互動地圖傳點事件代理 (Event Delegation)
    // ==========================================
    
    // 1. 點擊傳點標籤：自動平滑捲動到目標樓層與對應傳點
    document.addEventListener('click', (e) => {
        const portal = e.target.closest('.portal-tag');
        if (!portal) return;

        const portalCode = portal.getAttribute('data-portal');
        const targetFloorId = portal.getAttribute('data-target-floor');

        if (targetFloorId) {
            const targetFloor = document.getElementById(targetFloorId);
            if (targetFloor) {
                // 平滑捲動到目標樓層
                targetFloor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 自動閃爍高亮目標傳點 2 秒
                const targetPortals = targetFloor.querySelectorAll(`[data-portal="${portalCode}"]`);
                targetPortals.forEach(el => el.classList.add('active'));
                setTimeout(() => {
                    targetPortals.forEach(el => el.classList.remove('active'));
                }, 2000);
            }
        }
    });

    // 2. 滑鼠懸停/移出：同步高亮對應傳點
    document.addEventListener('mouseover', (e) => {
        const portal = e.target.closest('.portal-tag');
        if (!portal) return;

        const portalCode = portal.getAttribute('data-portal');
        if (portalCode) {
            document.querySelectorAll(`[data-portal="${portalCode}"]`).forEach(el => {
                el.classList.add('active');
            });
        }
    });

    document.addEventListener('mouseout', (e) => {
        const portal = e.target.closest('.portal-tag');
        if (!portal) return;

        document.querySelectorAll('.portal-tag').forEach(el => {
            el.classList.remove('active');
        });
    });

    // ==========================================
    // 🛠️ 過濾選單項目的重用函式
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

    try {
        // 從 Supabase 撈取已啟用的系統清單
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

        // ==========================================
        // 🌟 即時搜尋過濾邏輯
        // ==========================================
        if (searchInput && clearBtn) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                
                if (keyword.length > 0) {
                    clearBtn.style.display = 'block';
                } else {
                    clearBtn.style.display = 'none';
                }

                filterMenuItems(keyword);
            });

            clearBtn.addEventListener('click', () => {
                searchInput.value = '';        
                clearBtn.style.display = 'none'; 
                filterMenuItems('');           
                searchInput.focus();           
            });
        }

    } catch (err) {
        console.error('資料載入失敗:', err);
        menuContainer.innerHTML = `<li style="color: red;">選單載入錯誤</li>`;
    }
});

// ==========================================
// 🛠️ 開發者自動取點助手 (點圖片直接輸出 style 程式碼)
// ==========================================
document.addEventListener('click', (e) => {
    // 檢查點擊的是不是地圖圖片
    if (e.target.classList.contains('system-img')) {
        const img = e.target;
        const rect = img.getBoundingClientRect();
        
        // 自動計算相對圖片的百分比位置
        const left = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
        const top = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
        
        // 直接印在 F12 主控台 (Console)
        console.log(`style="top: ${top}%; left: ${left}%;"`);
        
        // 畫面上跳出提示，方便直接複製！
        navigator.clipboard.writeText(`style="top: ${top}%; left: ${left}%;"`);
        alert(`已複製位置到剪貼簿！\nstyle="top: ${top}%; left: ${left}%;"`);
    }
});

// 全域事件代理或 DOMContentLoaded 中綁定尋路按鈕
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'search-route-btn') {
        const startSelect = document.getElementById('start-floor-select');
        const endSelect = document.getElementById('end-floor-select');
        const resultBox = document.getElementById('route-result');

        if (!startSelect || !endSelect || !resultBox) return;

        const startFloor = startSelect.value;
        const endFloor = endSelect.value;

        // 清除舊有高亮
        document.querySelectorAll('.portal-tag').forEach(el => el.classList.remove('active'));

        if (startFloor === endFloor) {
            resultBox.innerHTML = '⚠️ 起點與終點相同，無需移動！';
            return;
        }

        const path = findShortestPath(startFloor, endFloor);

        if (!path || path.length === 0) {
            resultBox.innerHTML = '❌ 找不到連通路線！';
            return;
        }

        // 組合路線說明文字
        let html = `<strong>💡 從「${FLOOR_NAMES[startFloor]}」前往「${FLOOR_NAMES[endFloor]}」的最快路線：</strong><br>`;
        path.forEach((step, index) => {
            html += `${index + 1}. 從 <b>${FLOOR_NAMES[step.from]}</b> 走傳點 [<span style="color:#e74c3c;">${step.label}</span>] ➔ 跳轉至 <b>${FLOOR_NAMES[step.to]}</b><br>`;

            // 自動高亮整條路徑上經過的所有傳點！
            document.querySelectorAll(`[data-portal="${step.via}"]`).forEach(el => {
                el.classList.add('active');
            });
        });

        resultBox.innerHTML = html;
    }
});