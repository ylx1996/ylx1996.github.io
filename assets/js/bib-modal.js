document.addEventListener('DOMContentLoaded', function() {
  // 1. 动态创建 Popover 的 HTML 结构并插入到 Body 中
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
  
  // 如果页面上还没有 popover 元素，则添加
  if (!document.getElementById('bibPopover')) {
      document.body.insertAdjacentHTML('beforeend', popoverHTML);
  }

  const popover = document.getElementById('bibPopover');
  const codeBlock = popover.querySelector('.bib-popover-code');
  const copyBtn = document.getElementById('copyBibBtn');
  let currentButton = null; // 记录当前打开的是哪个按钮

  // 2. 绑定所有 Bib 按钮的点击事件
  document.querySelectorAll('.bib-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // 防止冒泡触发 window 点击关闭

      // 如果点击的是同一个按钮，则关闭气泡 (Toggle)
      if (currentButton === this && popover.style.display === 'block') {
          popover.style.display = 'none';
          currentButton = null;
          return;
      }

      currentButton = this;

      // 获取 BibTeX 数据并格式化
      let bib = this.getAttribute('data-bibtex') || '';
      bib = formatBibtex(bib);
      codeBlock.textContent = bib;
      
      // 重置复制按钮文字
      copyBtn.textContent = 'Copy';
      copyBtn.style.backgroundColor = '#2ea44f';

      // 3. 计算位置 (核心逻辑)
      // 获取按钮在页面中的位置
      const rect = this.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // 显示 Popover 以便计算其尺寸
      popover.style.display = 'block';
      
      // 计算 Top: 按钮底部 + 12px 间距
      let top = rect.bottom + scrollTop + 12;
      // 计算 Left: 按钮左侧 - 10px (让尖角对准按钮)
      let left = rect.left + scrollLeft - 10;

      // 防止气泡超出屏幕右边界
      const popoverWidth = popover.offsetWidth;
      const windowWidth = window.innerWidth;
      if (left + popoverWidth > windowWidth - 20) {
          left = windowWidth - popoverWidth - 20;
          // 如果气泡因为靠边移动了，这里可以通过修改 css 变量移动尖角的位置 (可选优化)
          // 简单起见，暂不移动尖角，通常按钮不会贴着最右边
      }

      popover.style.top = top + 'px';
      popover.style.left = left + 'px';
    });
  });

  // 4. 点击页面其他地方关闭气泡
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

  // 辅助函数：格式化 BibTeX
  function formatBibtex(bib) {
      bib = bib.trim().replace(/\\n/g, '\n').replace(/\\"/g, '"');
      
      // 简单的缩进美化
      bib = bib.replace(/@(\w+)\s*{/g, '@$1 {\n  ');
      bib = bib.replace(/,\s*([a-zA-Z0-9_-]+)\s*=/g, ',\n  $1 =');
      bib = bib.replace(/\s*}\s*$/g, '\n}');
      
      // 作者列表太长时换行
      bib = bib.replace(/author\s*=\s*{([^}]+)}/g, (match, authors) => {
           // 如果作者超过3个或者非常长，尝试格式化
           if(authors.length > 50) {
               return `author = {\n    ${authors.replace(/ and /g, ' and\n    ')}\n  }`;
           }
           return match;
      });
      
      // 清理可能产生的多余空行
      return bib.replace(/\n\s*\n/g, '\n');
  }
});