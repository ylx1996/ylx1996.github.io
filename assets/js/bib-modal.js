document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bibModal');
    const bibCode = document.getElementById('bibContent').querySelector('code');
    const copyBtn = document.getElementById('copyBib');
    const closeBtn = document.querySelector('.bib-close');
  
    document.querySelectorAll('.bib-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        let bib = this.getAttribute('data-bibtex') || '';
        bib = bib.trim().replace(/\\n/g, '\n').replace(/\\"/g, '"');
        
        // 增强美化
        bib = bib.replace(/@(\w+)\s*{/g, '@$1 {\n  ');
        bib = bib.replace(/}/g, '\n}');
        bib = bib.replace(/,\s*/g, ',\n  ');
        bib = bib.replace(/author\s*=\s*{([^}]+)}/g, (match, authors) => {
          let formatted = authors.trim().replace(/ and /g, ' and\n    ');
          return `author = {\n    ${formatted}\n  }`;
        });
        bib = bib.replace(/^(\s*)([a-zA-Z0-9_-]+)\s*=/gm, '$1$2 = ');
  
        // 清理多余空行
        bib = bib.replace(/\n\s*\n+/g, '\n');
  
        bibCode.textContent = bib;
        modal.style.display = 'flex';
      });
    });
  
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });
  
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(bibCode.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy to Clipboard', 2000);
      }).catch(() => alert('Copy failed'));
    });
  });