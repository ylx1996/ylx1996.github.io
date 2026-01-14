document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bibModal');
    const bibCode = document.getElementById('bibContent').querySelector('code');
    const copyBtn = document.getElementById('copyBib');
    const closeBtn = document.querySelector('.bib-close');
  
    document.querySelectorAll('.bib-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        let bib = this.getAttribute('data-bibtex');
        // 如果 BibTeX 有 \n 被转义，简单替换回换行（可选）
        bib = bib.replace(/\\n/g, '\n').replace(/\\"/g, '"');
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