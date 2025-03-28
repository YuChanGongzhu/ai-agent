'use client'

import React, { useState } from 'react';
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

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, title, longPageMode = false }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [pages, setPages] = useState<number[]>([]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (longPageMode) {
      setPages(Array.from(new Array(numPages), (_, index) => index + 1));
    }
  };

  const changePage = (offset: number) => {
    if (numPages === null) return;
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages, newPageNumber));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prevScale => Math.min(2.5, prevScale + 0.1));
  const zoomOut = () => setScale(prevScale => Math.max(0.5, prevScale - 0.1));

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // 长图模式下的页面渲染
  const renderLongPageMode = () => (
    <div className="flex flex-col items-center space-y-1">
      {pages.map(pageNum => (
        <Page
          key={`page_${pageNum}`}
          pageNumber={pageNum}
          scale={scale}
          renderAnnotationLayer
          renderTextLayer
          loading={<div className="text-center py-1">加载页面中...</div>}
          className="mb-1 shadow-md"
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
      
      <div className={`flex justify-center ${longPageMode ? 'overflow-y-auto' : ''}`} 
           style={longPageMode ? { maxHeight: 'calc(100vh - 120px)' } : {}}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-center py-4">加载中...</div>}
          error={<div className="text-center text-red-500 py-4">无法加载PDF文件</div>}
        >
          {longPageMode ? renderLongPageMode() : renderPageMode()}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer; 