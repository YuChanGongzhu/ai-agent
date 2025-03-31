// 优化移动端PDF iframe行为的脚本
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
    
    // 阻止顶部下拉刷新
    const preventPullToRefresh = function(e) {
      // 只有在顶部下拉时才阻止默认行为
      if (document.scrollingElement && document.scrollingElement.scrollTop <= 0) {
        // 检查是否是向下拖动(下拉刷新手势)
        if (e.touches && e.touches[0].clientY > 10) {
          e.preventDefault();
        }
      }
    };
    
    // 阻止页面的缩放
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // 只监听document级别的touchmove，阻止下拉刷新
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    
    // 为iframe添加必要的样式
    window.addEventListener('load', function() {
      const pdfIframes = document.querySelectorAll('.pdf-container iframe');
      pdfIframes.forEach(function(iframe) {
        iframe.style.width = '100%';
        iframe.style.maxWidth = '100vw';
        iframe.style.display = 'block';
        iframe.style.border = 'none';
      });
    });
  }
})(); 