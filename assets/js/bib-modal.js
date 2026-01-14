document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bibModal');
    const bibCode = document.getElementById('bibContent').querySelector('code');
    const copyBtn = document.getElementById('copyBib');
    const closeBtn = document.querySelector('.bib-close');
  
    document.querySelectorAll('.bib-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        let bib = this.getAttribute('data-bibtex');
  
        // Step 1: 先还原可能的转义（如果之前有 \n 或 \"）
        bib = bib.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  
        // Step 2: 美化 BibTeX 显示（关键部分）
        // 把 , 后面加换行 + 两个空格缩进
        bib = bib.replace(/,\s*/g, ',\n  ');
        // 在 { 后加换行 + 缩进
        bib = bib.replace(/{/g, '{\n  ');
        // 在 } 前加换行
        bib = bib.replace(/}/g, '\n}');
        // 额外处理 @ 开头那一行（可选，让它单独一行）
        bib = bib.replace(/^@/, '@\n');
  
        // Step 3: 设置到 <code> 里
        bibCode.textContent = bib.trim();  // trim 去掉多余首尾空行
  
        modal.style.display = 'block';
      });
    });
  
    closeBtn.addEventListener('click', () => { 
      modal.style.display = 'none'; 
    });
  
    window.addEventListener('click', e => { 
      if (e.target === modal) modal.style.display = 'none'; 
    });
  
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(bibCode.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 2000);
      }).catch(() => alert('Copy failed'));
    });
  });