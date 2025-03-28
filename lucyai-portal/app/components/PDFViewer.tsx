'use client'

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button, IconButton, Box, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// 设置PDF.js worker路径
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
  longPageMode?: boolean; // 添加长图模式选项
}

const PDFViewer = ({ pdfUrl, title, longPageMode = false }: PDFViewerProps) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [scale, setScale] = React.useState<number>(1);
  const [fullscreen, setFullscreen] = React.useState<boolean>(false);
  const [pages, setPages] = React.useState<number[]>([]);
  const [touchStartY, setTouchStartY] = React.useState<number | null>(null);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  // 检测是否为移动设备
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      
      // 如果是移动设备，自动调整缩放比例以适应屏幕宽度
      if (window.innerWidth <= 768) {
        // 移动设备上使用更合适的缩放比例
        setScale(window.innerWidth / 1000); // 根据移动设备屏幕宽度自动计算缩放比例
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 阻止移动设备上的弹性滚动行为
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      // 组件卸载时恢复正常滚动行为
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (longPageMode) {
      setPages(Array.from(new Array(numPages), (_, index) => index + 1));
    }
  };

  const changePage = (offset: number) => {
    if (numPages === null) return;
    setPageNumber((prevPageNumber: number) => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages, newPageNumber));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale((prevScale: number) => Math.min(2.5, prevScale + 0.1));
  const zoomOut = () => setScale((prevScale: number) => Math.max(0.5, prevScale - 0.1));

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // 增强的触摸事件处理，彻底阻止下拉刷新
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // 始终阻止默认行为，防止任何可能的刷新
    e.preventDefault();
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // 彻底阻止默认行为，防止触发下拉刷新
    e.preventDefault();
    
    if (!touchStartY) return;
    
    const container = e.currentTarget;
    const touchY = e.touches[0].clientY;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // 计算并手动控制滚动
    if (touchY < touchStartY && scrollTop < scrollHeight - clientHeight) {
      // 向上滑动且未到达底部
      container.scrollTop = scrollTop + (touchStartY - touchY) * 0.5;
    } else if (touchY > touchStartY && scrollTop > 0) {
      // 向下滑动且未到达顶部
      container.scrollTop = scrollTop - (touchY - touchStartY) * 0.5;
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  // 长图模式下的页面渲染
  const renderLongPageMode = () => (
    <div className="flex flex-col items-center space-y-1 w-full">
      {pages.map((pageNum: number) => (
        <Page
          key={`page_${pageNum}`}
          pageNumber={pageNum}
          scale={scale}
          renderAnnotationLayer
          renderTextLayer
          loading={<div className="text-center py-1">加载页面中...</div>}
          className="mb-1 shadow-md w-full"
          width={isMobile ? window.innerWidth - 20 : undefined}
        />
      ))}
    </div>
  );

  // 普通翻页模式的页面渲染
  const renderPageMode = () => (
    <>
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderAnnotationLayer
        renderTextLayer
        loading={<div className="text-center py-10">加载页面中...</div>}
        width={isMobile ? window.innerWidth - 20 : undefined}
      />
      
      {numPages && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
          <IconButton
            onClick={previousPage}
            disabled={pageNumber <= 1}
            aria-label="上一页"
            size="small"
          >
            <NavigateBeforeIcon />
          </IconButton>
          <Typography sx={{ mx: 1 }} variant="body2">
            {pageNumber} / {numPages}
          </Typography>
          <IconButton
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            aria-label="下一页"
            size="small"
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>
      )}
    </>
  );

  // 控制栏渲染
  const renderControls = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }} className="pdf-controls">
      <IconButton onClick={zoomOut} aria-label="缩小" size="small" sx={{ p: 0.5 }}>
        <ZoomOutIcon fontSize="small" />
      </IconButton>
      <Typography sx={{ mx: 0.5, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }} variant="body2">
        {Math.round(scale * 100)}%
      </Typography>
      <IconButton onClick={zoomIn} aria-label="放大" size="small" sx={{ p: 0.5 }}>
        <ZoomInIcon fontSize="small" />
      </IconButton>
      <IconButton onClick={toggleFullscreen} aria-label="全屏切换" size="small" sx={{ p: 0.5, ml: 0.5 }}>
        {fullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
      </IconButton>
    </Box>
  );

  return (
    <div className={`pdf-viewer ${fullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-1' : ''}`}>
      {title && title.length > 0 && (
        <Typography variant="h6" component="h2" className="mb-1 text-center">
          {title}
        </Typography>
      )}
      
      {renderControls()}
      
      <div 
        className={`flex justify-center ${longPageMode ? 'overflow-y-auto overscroll-none touch-none w-full' : ''}`} 
        style={longPageMode ? { 
          maxHeight: 'calc(100vh - 120px)',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          position: 'relative',
          touchAction: 'none'
        } : {}}
        onTouchStart={longPageMode ? handleTouchStart : undefined}
        onTouchMove={longPageMode ? handleTouchMove : undefined}
        onTouchEnd={longPageMode ? handleTouchEnd : undefined}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-center py-4">加载中...</div>}
          error={<div className="text-center text-red-500 py-4">无法加载PDF文件</div>}
          className="w-full"
        >
          {longPageMode ? renderLongPageMode() : renderPageMode()}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer; 