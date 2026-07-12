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

    // 載入內容的函式
    function loadSystemPage(fileName, titleText) {
        if (window.innerWidth <= 768 && titleText) {
            sidebarTitle.innerHTML = `系統：${titleText}`;
        } else {
            sidebarTitle.innerHTML = "遊戲系統";
        }

        fetch(`/mo_data/sys/${fileName}`)
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
                contentDisplay.innerHTML = `<h3 class="search-tip">錯誤：無法讀取內容 (${fileName})</h3>`;
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

        gameSystems.forEach((item, index) => {
    const li = document.createElement('li');
    li.setAttribute('data-file', item.file_name);
    
    // ==========================================
    // 🛠️ 確保這裡是這樣寫：因為已經是純文字，直接塞入字串即可
    // ==========================================
    li.setAttribute('data-aliases', item.aliases || ''); 

    li.innerText = item.title;
    
    if (index === 0) li.classList.add('active'); 

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

        // 初始載入第一項內容
        loadSystemPage(gameSystems[0].file_name, gameSystems[0].title);

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