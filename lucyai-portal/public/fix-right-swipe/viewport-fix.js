// 修复移动端右滑空白和下拉刷新问题的脚本
(function() {
  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 设置视口宽度等于设备宽度，防止右侧出现空白
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(newViewport);
    }
    
    // 阻止整个文档的触摸滚动，但允许PDF容器内部滚动
    const preventPull = function(e) {
      // 允许在指定的滚动容器内部滚动
      if (e.target.closest('.overflow-y-auto') || 
          e.target.closest('.react-pdf__Document') || 
          e.target.closest('.react-pdf__Page') ||
          e.target.closest('.pdf-viewer')) {
        return; // 不阻止，允许滚动
      }
      
      // 其他区域阻止默认滚动行为
      e.preventDefault();
    };
    
    // 修复iOS的橡皮筋效果
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // 阻止页面的缩放
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // 阻止页面的滚动，除非在PDF相关容器内
    document.addEventListener('touchmove', preventPull, { passive: false });
    
    // 对所有PDF容器设置更严格的样式
    const applyPdfStyles = function() {
      // 为PDF容器添加严格的样式，确保内容居中显示
      const pdfContainers = document.querySelectorAll('.pdf-container, .pdf-viewer, .react-pdf__Document, .react-pdf__Page');
      pdfContainers.forEach(function(container) {
        container.style.width = '100%';
        container.style.maxWidth = '100vw';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.overflowX = 'hidden';
      });
      
      // 确保PDF页面画布居中显示
      const canvases = document.querySelectorAll('.react-pdf__Page__canvas');
      canvases.forEach(function(canvas) {
        canvas.style.margin = '0 auto';
        canvas.style.maxWidth = '100%';
      });
      
      // 允许PDF容器内部滚动
      const scrollContainers = document.querySelectorAll('.overflow-y-auto');
      scrollContainers.forEach(function(container) {
        container.style.overflowY = 'auto';
        container.style.touchAction = 'pan-y';
        container.style.webkitOverflowScrolling = 'touch';
      });
    };
    
    // 页面加载后应用样式
    window.addEventListener('load', applyPdfStyles);
    
    // 每当文档发生变化时重新应用样式
    const observer = new MutationObserver(applyPdfStyles);
    observer.observe(document.body, { childList: true, subtree: true });
  }
})(); 