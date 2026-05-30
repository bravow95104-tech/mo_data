/**
 * DataTable.js - 通用的資料表格模組
 * 用於統一處理：資料載入、搜尋、篩選、排序、高亮與彈窗邏輯
 */

class DataTable {
    constructor(options) {
        // 預設設定
        const defaultOptions = {
            dataUrl: '',
            tableSelector: '#heroes-table',
            searchInputSelector: '#searchInput',
            clearFiltersSelector: '#clearFilters',
            filterBtnSelector: '.filter-btn',
            modalSelectors: {
                overlay: '#modalOverlay',
                box: '#modalBox',
                content: '#modalContent',
                closeBtn: '.close-btn'
            },
            columns: [], // 欄位定義
            imageConfig: null, // { basePath: '', key: '', extensions: [] }
            rowClickable: true,
            // 鉤子函式 (Hooks)
            onDataLoaded: (data) => data, // 資料載入後的初次過濾
            onFilter: (item, filters, keyword) => true, // 自定義過濾邏輯
            renderModal: (item) => '', // 自定義彈窗內容
            onRendered: () => {} // 渲染完成後的觸發
        };

        this.options = { ...defaultOptions, ...options };
        this.rawData = [];
        this.filteredData = [];
        this.activeFilters = {};
        this.sortConfig = { key: null, direction: 'asc' };
        this.searchTimer = null;

        // 快取 DOM 元素
        this.elements = {
            table: document.querySelector(this.options.tableSelector),
            tbody: document.querySelector(`${this.options.tableSelector} tbody`),
            searchInput: document.querySelector(this.options.searchInputSelector),
            clearFilters: document.querySelector(this.options.clearFiltersSelector),
            modal: {
                overlay: document.getElementById(this.options.modalSelectors.overlay.replace('#', '')),
                box: document.getElementById(this.options.modalSelectors.box.replace('#', '')),
                content: document.getElementById(this.options.modalSelectors.content.replace('#', '')),
                closeBtn: document.querySelector(this.options.modalSelectors.closeBtn)
            }
        };

        this.init();
    }

    async init() {
        this.bindEvents();
        this.initSortableHeaders();
        await this.loadData();
    }

    // === 事件綁定 ===
    bindEvents() {
        // 搜尋輸入 (防抖動)
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimer);
                this.searchTimer = setTimeout(() => this.applyFilters(), 200);
            });
        }

        // 清除按鈕
        if (this.elements.clearFilters) {
            this.elements.clearFilters.addEventListener('click', () => {
                if (this.elements.searchInput) this.elements.searchInput.value = '';
                this.activeFilters = {};
                document.querySelectorAll(this.options.filterBtnSelector).forEach(btn => btn.classList.remove('active'));
                this.applyFilters();
            });
        }

        // 篩選按鈕
        document.addEventListener('click', (e) => {
            const btn = e.target.closest(this.options.filterBtnSelector);
            if (!btn) return;

            const type = btn.dataset.type;
            const value = btn.dataset.value;

            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                delete this.activeFilters[type];
            } else {
                // 同類型的按鈕互斥
                document.querySelectorAll(`${this.options.filterBtnSelector}[data-type="${type}"]`)
                    .forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilters[type] = value;
            }
            this.applyFilters();
        });

        // 彈窗關閉事件
        const { modal } = this.elements;
        const closeActions = () => this.closeModal();
        if (modal.closeBtn) modal.closeBtn.addEventListener('click', closeActions);
        if (modal.overlay) modal.overlay.addEventListener('click', closeActions);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeActions();
        });
    }

    // === 資料載入 ===
    async loadData() {
        try {
            const response = await fetch(this.options.dataUrl);
            const data = await response.json();
            this.rawData = this.options.onDataLoaded(data);
            this.applyFilters();
        } catch (error) {
            console.error('Data loading error:', error);
            if (this.elements.tbody) {
                this.elements.tbody.innerHTML = `<tr><td colspan="100">無法載入資料 (${error.message})</td></tr>`;
            }
        }
    }

    // === 核心過濾邏輯 ===
    applyFilters() {
        const keyword = this.elements.searchInput ? this.elements.searchInput.value.trim().toLowerCase() : '';

        this.filteredData = this.rawData.filter(item => {
            return this.options.onFilter(item, this.activeFilters, keyword);
        });

        this.applySort();
        this.renderTable();
    }

    // === 排序邏輯 ===
    initSortableHeaders() {
        if (!this.elements.table) return;
        this.elements.table.querySelectorAll('th.sortable').forEach(th => {
            // 防止重複執行，並注入箭頭 HTML
            if (!th.querySelector('.th-flex-container')) {
                const text = th.textContent;
                th.innerHTML = `
                    <div class="th-flex-container">
                        <span class="th-text-wrapper">${text}</span>
                        <span class="sort-caret-container">
                            <span class="caret-up">▲</span>
                            <span class="caret-down">▼</span>
                        </span>
                    </div>
                `;
            }

            th.addEventListener('click', () => {
                const key = th.dataset.sort;
                
                // 清除其他欄位的排序樣式
                this.elements.table.querySelectorAll('th.sortable').forEach(otherTh => {
                    if (otherTh !== th) {
                        otherTh.classList.remove('sort-asc', 'sort-desc');
                    }
                });

                if (this.sortConfig.key === key) {
                    this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortConfig.key = key;
                    this.sortConfig.direction = 'asc';
                }

                // 更新樣式
                th.classList.toggle('sort-asc', this.sortConfig.direction === 'asc');
                th.classList.toggle('sort-desc', this.sortConfig.direction === 'desc');

                this.applyFilters();
            });
        });
    }

    applySort() {
        if (!this.sortConfig.key) return;

        const { key, direction } = this.sortConfig;
        this.filteredData.sort((a, b) => {
            let valA = a[key] ?? '';
            let valB = b[key] ?? '';

            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                valA = numA;
                valB = numB;
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // === 渲染表格 ===
    renderTable() {
        const { tbody } = this.elements;
        if (!tbody) return;

        tbody.innerHTML = '';
        if (this.filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding: 20px;">找不到符合條件的資料</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        const keyword = this.elements.searchInput ? this.elements.searchInput.value.trim().toLowerCase() : '';

        this.filteredData.forEach(item => {
            const tr = document.createElement('tr');
            if (this.options.rowClickable) {
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', (e) => {
                    // 如果點擊的是 .keyword-link，不觸發整行彈窗
                    if (e.target.classList.contains('keyword-link')) return;
                    this.showDetailModal(item);
                });
            }

            // 渲染圖片欄 (如果有設定)
            if (this.options.imageConfig) {
                const td = document.createElement('td');
                td.className = 'td-image';
                this.renderImage(td, item);
                tr.appendChild(td);
            }

            // 渲染定義的欄位
            this.options.columns.forEach(col => {
                const td = document.createElement('td');
                let value = item[col.key] ?? '';
                
                if (col.render) {
                    td.innerHTML = col.render(value, item, keyword);
                } else {
                    td.innerHTML = this.highlightText(String(value), keyword);
                }
                tr.appendChild(td);
            });

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
        this.options.onRendered();
    }

    // === 圖片渲染助手 (含回退邏輯) ===
    renderImage(container, item) {
        const { basePath, key, extensions = ['.png', '.bmp', '.jpg'] } = this.options.imageConfig;
        const fileName = item[key];
        if (!fileName) {
            container.textContent = '—';
            return;
        }

        const img = document.createElement('img');
        let attempt = 0;
        const fullPath = (ext) => `${basePath}${fileName}${ext}`;

        img.src = fullPath(extensions[attempt]);
        img.className = 'table-img';
        img.onerror = () => {
            attempt++;
            if (attempt < extensions.length) {
                img.src = fullPath(extensions[attempt]);
            } else {
                container.innerHTML = '—';
            }
        };
        container.appendChild(img);
    }

    // === 高亮文字助手 ===
    highlightText(text, keyword) {
        if (!keyword) return text.replace(/\n/g, '<br>');
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<span class="highlight2">$1</span>').replace(/\n/g, '<br>');
    }

    // === 彈窗控制 ===
    showDetailModal(item) {
        const { modal } = this.elements;
        if (!modal.content) return;

        modal.content.innerHTML = this.options.renderModal(item);
        modal.overlay.style.display = 'block';
        modal.box.style.display = 'block';
        modal.box.scrollTop = 0;
    }

    closeModal() {
        const { modal } = this.elements;
        if (modal.overlay) modal.overlay.style.display = 'none';
        if (modal.box) modal.box.style.display = 'none';
    }
}

// 導出模組 (如果環境不支援，則掛在 window 上)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTable;
} else {
    window.DataTable = DataTable;
}
