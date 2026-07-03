// /mo_data/js/system.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

document.addEventListener("DOMContentLoaded", async () => {
    const sidebar = document.getElementById('system-sidebar');
    const sidebarTitle = sidebar.querySelector('h2');
    const menuContainer = document.getElementById('system-menu');
    const contentDisplay = document.getElementById('dynamic-content');

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

    try {
        // 從 Supabase 撈取已啟用的系統清單
        let { data: gameSystems, error } = await _supabase
            .from('game_systems')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        
        if (!gameSystems || gameSystems.length === 0) {
            menuContainer.innerHTML = '<li>目前沒有可用的系統介紹</li>';
            return;
        }

        menuContainer.innerHTML = '';

        gameSystems.forEach((item, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-file', item.file_name);
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

        loadSystemPage(gameSystems[0].file_name, gameSystems[0].title);

    } catch (err) {
        console.error('資料載入失敗:', err);
        menuContainer.innerHTML = `<li style="color: red;">選單載入錯誤</li>`;
    }
});