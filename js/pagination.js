// pagination.js
export class Pagination {
  /**
   * @param {Object} options
   * @param {number} options.pageSize - 每頁顯示筆數 (預設 20)
   * @param {string} options.containerId - 放置分頁按鈕 HTML 的 DOM ID
   * @param {Function} options.onPageChange - 頁碼改變時的回呼函式，傳入 (pagedData, currentPage)
   */
  constructor({ pageSize = 20, containerId = 'pagination-container', onPageChange }) {
    this.pageSize = pageSize;
    this.containerId = containerId;
    this.onPageChange = onPageChange;
    this.currentPage = 1;
    this.data = [];
  }

  // 設定並更新資料來源
  setData(data) {
    this.data = data || [];
    this.currentPage = 1; // 重新搜尋或篩選時重置回第 1 頁
    this.render();
  }

  // 取得總頁數
  getTotalPages() {
    return Math.max(1, Math.ceil(this.data.length / this.pageSize));
  }

  // 切換頁碼
  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.render();
    
    // 切換頁面時自動回到頂端
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 渲染分頁 UI 控制項並觸發更新視圖
  render() {
    const totalPages = this.getTotalPages();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedData = this.data.slice(startIndex, startIndex + this.pageSize);

    // 觸發外部的繪製表格/卡片邏輯
    if (typeof this.onPageChange === 'function') {
      this.onPageChange(pagedData, this.currentPage);
    }

    // 繪製分頁按鈕 UI
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.data.length === 0) {
      container.innerHTML = '';
      return;
    }

let html = `<div class="pagination">`;
html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">上一頁</button>`;
html += `<span class="page-info">第 ${this.currentPage} / ${totalPages} 頁 (共 ${this.data.length} 筆)</span>`;
html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">下一頁</button>`;
html += `</div>`;

    container.innerHTML = html;

    // 綁定按鈕點擊事件
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.getAttribute('data-page'), 10);
        if (!isNaN(page)) this.goToPage(page);
      });
    });
  }
}