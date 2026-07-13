// /mo_data/js/system.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

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

    // === 請在 system.js 中找到這段並修改 ===
function loadSystemPage(fileName, titleText) {
    if (window.innerWidth <= 768 && titleText) {
        sidebarTitle.innerHTML = `系統：${titleText}`;
    } else {
        sidebarTitle.innerHTML = "遊戲系統";
    }

    // 取得當前 system.html 所在的絕對目錄路徑，與 fileName 結合
    const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const fullFetchPath = currentDir + fileName;

    // 🌟 修正：因為 system.html 本身就在 sys 資料夾裡了，
    // 這裡直接 fetch 子網頁的檔案名稱 (fileName) 即可，不需要再加前綴！
    fetch(`${fileName}`) 
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
    // 🛠️ 修正：過濾選單項目的重用函式（同時比對名稱與隱藏別名）
    // ==========================================
    function filterMenuItems(keyword) {
        const listItems = menuContainer.querySelectorAll('li');
        listItems.forEach(li => {
            const text = li.innerText.toLowerCase(); // 原本顯示的標題
            const aliases = (li.getAttribute('data-aliases') || '').toLowerCase(); // 讀取隱藏的別名字串
            
            // 只要標題本身包含關鍵字，或是隱藏別名包含關鍵字，就顯示出來
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
            .from('game_systems')
            .select('*')
            .eq('is_active', true)
            .order('sort_id', { ascending: false });

        if (error) throw error;
        
        if (!gameSystems || gameSystems.length === 0) {
            menuContainer.innerHTML = '<li>目前沒有可用的系統介紹</li>';
            return;
        }

        menuContainer.innerHTML = '';

        // 🌟 修正點 1：先獲取網址參數，以便在渲染清單時就知道哪一個該亮起 active
        const urlParams = new URLSearchParams(window.location.search);
        const targetSysFile = urlParams.get('sys'); 
        // 檢查撈出的清單有沒有符合這個網址參數的項目
        const matchedSystem = gameSystems.find(item => item.file_name === targetSysFile);

        gameSystems.forEach((item, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-file', item.file_name);
            li.setAttribute('data-aliases', item.aliases || ''); 
            li.innerText = item.title;
            
            // 🌟 修正點 2：active 樣式判斷。如果網址參數有對應到，就亮對應項；否則預設亮第一項
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

                // 當手動點選選單時，清除網址上的 Query 參數，讓網址列保持乾淨（選填，體驗較佳）
                //const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                //window.history.pushState({ path: newUrl }, '', newUrl);

                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });

            menuContainer.appendChild(li);
        });

        // 🌟 修正點 3：移除重複的 loadSystemPage，統一由這段邏輯決定初始載入哪一頁
        if (matchedSystem) {
            loadSystemPage(matchedSystem.file_name, matchedSystem.title);
            document.title = `${matchedSystem.title} | MoData`;
        } else {
            loadSystemPage(gameSystems[0].file_name, gameSystems[0].title);
        }

        // ==========================================
        // 🌟 新增：包含清除按鈕的即時搜尋過濾邏輯
        // ==========================================
        if (searchInput && clearBtn) {
            // 監聽輸入框變化
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                
                // 如果有輸入文字就顯示 X，沒有就隱藏
                if (keyword.length > 0) {
                    clearBtn.style.display = 'block';
                } else {
                    clearBtn.style.display = 'none';
                }

                // 執行過濾
                filterMenuItems(keyword);
            });

            // 監聽 X 按鈕點擊事件
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';        // 清空輸入框文字
                clearBtn.style.display = 'none'; // 隱藏 X 按鈕
                filterMenuItems('');           // 恢復還原所有選單項目
                searchInput.focus();           // 讓游標自動點回輸入框
            });
        }

    } catch (err) {
        console.error('資料載入失敗:', err);
        menuContainer.innerHTML = `<li style="color: red;">選單載入錯誤</li>`;
    }
});