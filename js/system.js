// /mo_data/js/system.js

document.addEventListener("DOMContentLoaded", async () => {
    const sidebar = document.getElementById('system-sidebar');
    const sidebarTitle = sidebar.querySelector('h2');
    const menuContainer = document.getElementById('system-menu'); // 改拿外層 UL
    const contentDisplay = document.getElementById('dynamic-content');

    // 請確保這裡的 _supabase 實例已經在全域或此處正確初始化
    // 例如：const _supabase = supabase.createClient('URL', 'KEY');

    // 手機版：點擊標題切換展開/收合
    sidebarTitle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        }
    });

    // 載入內容的函式
    function loadSystemPage(fileName, titleText) {
        // 更新標題顯示 (手機版)
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
                // 捲動回內容頂部
                if (window.innerWidth <= 768) {
                    window.scrollTo({ top: sidebar.offsetTop, behavior: 'smooth' });
                }
            })
            .catch(error => {
                contentDisplay.innerHTML = `<h3 class="search-tip">錯誤：無法讀取內容 (${fileName})</h3>`;
            });
    }

    try {
        // 從 Supabase 撈取已啟用的系統清單，並依排序權重升冪排列
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

        // 清空原 HTML 內殘留的死資料（保險起見）
        menuContainer.innerHTML = '';

        // 動態產生選單 <li> 並綁定點擊事件
        gameSystems.forEach((item, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-file', item.file_name);
            li.innerText = item.title;
            
            // 預設高亮第一個項目
            if (index === 0) li.classList.add('active'); 

            // 選單點擊事件
            li.addEventListener('click', () => {
                // 1. 切換 active 樣式 (向父層選單內的 li 查尋來切換)
                menuContainer.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                li.classList.add('active');

                // 2. 執行載入
                loadSystemPage(item.file_name, item.title);
                document.title = `${item.title} | MoData`;

                // 3. 手機版點選後自動收合
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });

            menuContainer.appendChild(li);
        });

        // 初始載入第一項內容
        loadSystemPage(gameSystems[0].file_name, gameSystems[0].title);

    } catch (err) {
        console.error('資料載入失敗:', err);
        menuContainer.innerHTML = `<li style="color: red;">選單載入錯誤</li>`;
    }
});