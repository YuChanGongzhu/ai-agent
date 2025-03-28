'use client'

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button, IconButton, Box, Typography, CircularProgress } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// 设置PDF.js worker路径
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// 配置CORS策略，允许跨域加载PDF
const pdfjsOptions = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
};

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
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

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
    
    // 不再完全锁定body滚动，让PDF容器内部可以滚动
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setLoadError(null);
    if (longPageMode) {
      setPages(Array.from(new Array(numPages), (_, index) => index + 1));
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF加载错误:', error);
    setIsLoading(false);
    setLoadError(`无法加载PDF文件: ${error.message}`);
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

  // 修改触摸事件处理，允许正常滚动但防止下拉刷新
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartY) return;
    
    const container = e.currentTarget;
    const touchY = e.touches[0].clientY;
    const scrollTop = container.scrollTop;
    
    // 仅在顶部下拉时阻止默认行为，防止触发刷新
    if (scrollTop <= 0 && touchY > touchStartY) {
      e.preventDefault();
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
        className={`flex justify-center ${longPageMode ? 'overflow-y-auto overscroll-none w-full' : ''}`} 
        style={longPageMode ? { 
          maxHeight: 'calc(100vh - 120px)',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          position: 'relative',
          touchAction: 'pan-y'
        } : {}}
        onTouchStart={longPageMode ? handleTouchStart : undefined}
        onTouchMove={longPageMode ? handleTouchMove : undefined}
        onTouchEnd={longPageMode ? handleTouchEnd : undefined}
      >
        {isLoading && !loadError && (
          <div className="flex flex-col items-center justify-center py-8">
            <CircularProgress size={40} />
            <p className="mt-2 text-gray-600">加载PDF中，请稍候...</p>
          </div>
        )}
        
        {loadError && (
          <div className="text-center text-red-500 py-4 px-4">
            <p>无法加载PDF文件</p>
            <p className="text-sm mt-2">{loadError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              重新加载
            </button>
          </div>
        )}
        
        {!loadError && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="text-center py-4">加载中...</div>}
            error={<div className="text-center text-red-500 py-4">无法加载PDF文件</div>}
            className="w-full"
            options={pdfjsOptions}
          >
            {numPages > 0 && (longPageMode ? renderLongPageMode() : renderPageMode())}
          </Document>
        )}
      </div>
    </div>
  );
};

export default PDFViewer; 