document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    const icon = document.getElementById('theme-icon');
    const html = document.documentElement;
  
    // 图标切换函数
    const setIcon = (theme) => {
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    };
  
    // 应用主题
    const setTheme = (theme) => {
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      setIcon(theme);
    };
  
    // 初始化
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  
    // 点击切换
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
      });
    }
  
    // 监听系统主题变化（可选）
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {  // 只在没手动设置时跟随系统
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  });