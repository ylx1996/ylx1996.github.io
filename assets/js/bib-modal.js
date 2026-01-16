document.addEventListener('DOMContentLoaded', function() {
  // 1. 动态创建 Popover 的 HTML 结构
  const popoverHTML = `
    <div id="bibPopover">
      <div class="bib-popover-header">
        <span>BibTeX</span>
        <button id="copyBibBtn">Copy</button>
      </div>
      <div class="bib-popover-content">
        <pre class="bib-popover-code"></pre>
      </div>
    </div>
  `;
  
  if (!document.getElementById('bibPopover')) {
      document.body.insertAdjacentHTML('beforeend', popoverHTML);
  }

  const popover = document.getElementById('bibPopover');
  const codeBlock = popover.querySelector('.bib-popover-code');
  const copyBtn = document.getElementById('copyBibBtn');
  let currentButton = null;

  // 2. 绑定点击事件
  document.querySelectorAll('.bib-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); 

      if (currentButton === this && popover.style.display === 'block') {
          popover.style.display = 'none';
          currentButton = null;
          return;
      }

      currentButton = this;

      // --- 核心修改：格式化逻辑 ---
      let bib = this.getAttribute('data-bibtex') || '';
      bib = formatBibtex(bib);
      codeBlock.textContent = bib;
      // ---------------------------
      
      copyBtn.textContent = 'Copy';
      copyBtn.style.backgroundColor = '#2ea44f';

      // 3. 计算位置
      const rect = this.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      popover.style.display = 'block';
      
      let top = rect.bottom + scrollTop + 12;
      let left = rect.left + scrollLeft - 10;

      // 边界检查
      const popoverWidth = popover.offsetWidth;
      const windowWidth = window.innerWidth;
      if (left + popoverWidth > windowWidth - 20) {
          left = windowWidth - popoverWidth - 20;
      }

      popover.style.top = top + 'px';
      popover.style.left = left + 'px';
    });
  });

  // 4. 关闭事件
  window.addEventListener('click', (e) => {
      if (!popover.contains(e.target)) {
          popover.style.display = 'none';
          currentButton = null;
      }
  });

  // 5. 复制功能
  copyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.style.backgroundColor = '#555';
          setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.style.backgroundColor = '#2ea44f';
          }, 2000);
      }).catch(err => {
          alert('Copy failed');
      });
  });

  // ==========================================
  //  格式化函数 (Updated)
  // ==========================================
  function formatBibtex(bib) {
      // 1. 清理：去除多余空格和换行，先变成单行字符串
      bib = bib.trim().replace(/\s+/g, ' '); 

      // 2. 头部处理：@type{key, 
      // 确保 key 紧跟在 { 后面，并且在逗号后换行
      bib = bib.replace(/@(\w+)\s*\{\s*([^\s,]+)\s*,/g, '@$1{$2,\n  ');

      // 3. 字段处理：在每个 "key =" 前面换行
      // 逻辑：寻找 ", key =" 模式，替换为 ",\n  key ="
      bib = bib.replace(/,\s*([a-zA-Z0-9_-]+)\s*=/g, ',\n  $1 =');

      // 4. 收尾：处理结尾的大括号
      bib = bib.replace(/\s*\}\s*$/g, '\n}');
      
      return bib;
  }
});