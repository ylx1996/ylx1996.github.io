document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bibModal');
    const bibCode = document.getElementById('bibContent').querySelector('code');
    const copyBtn = document.getElementById('copyBib');
    const closeBtn = document.querySelector('.bib-close');
  
    document.querySelectorAll('.bib-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        let bib = this.getAttribute('data-bibtex');
  
        // 1. 还原转义
        bib = bib.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
  
        // 2. 强力美化 BibTeX
        // 分割成字段
        bib = bib.replace(/,\s*/g, ',\n');          // 每个字段后换行
        bib = bib.replace(/{/g, '{\n  ');           // { 后换行 + 缩进
        bib = bib.replace(/}/g, '\n}');             // } 前换行
        bib = bib.replace(/author\s*=\s*{/g, 'author = {\n    '); // author 列表特殊处理
        bib = bib.replace(/and\s+/g, 'and\n    ');  // author 里的 and 换行缩进
  
        // 3. 字段名对齐（= 号对齐）
        bib = bib.replace(/^(\s*)([a-zA-Z-]+)\s*=\s*/gm, '$1$2 = ');
  
        // 4. 去多余空行
        bib = bib.replace(/\n\s*\n/g, '\n');
  
        bibCode.textContent = bib;
  
        modal.style.display = 'block';
      });
    });
  
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
  
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(bibCode.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 2000);
      }).catch(() => alert('Copy failed'));
    });
  });