// React 类型声明
declare module 'react' {
  interface CSSProperties {
    [key: string]: any;
  }
}

// 环境变量类型声明
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SITE_NAME: string;
    NEXT_PUBLIC_SITE_DESCRIPTION: string;
    NEXT_PUBLIC_ADMIN_URL: string;
    PORT: string;
    HOST: string;
  }
}

// PDF查看器类型声明
declare module 'react-pdf' {
  export const Document: any;
  export const Page: any;
  export const pdfjs: any;
}

// MUI类型声明
declare module '@mui/material' {
  export const Button: any;
  export const IconButton: any;
  export const Box: any;
  export const Typography: any;
  export const Tabs: any;
  export const Tab: any;
}

declare module '@mui/icons-material/Menu' {
  const MenuIcon: any;
  export default MenuIcon;
}

declare module '@mui/icons-material/Close' {
  const CloseIcon: any;
  export default CloseIcon;
}

declare module '@mui/icons-material/NavigateNext' {
  const NavigateNextIcon: any;
  export default NavigateNextIcon;
}

declare module '@mui/icons-material/NavigateBefore' {
  const NavigateBeforeIcon: any;
  export default NavigateBeforeIcon;
}

declare module '@mui/icons-material/ZoomIn' {
  const ZoomInIcon: any;
  export default ZoomInIcon;
}

declare module '@mui/icons-material/ZoomOut' {
  const ZoomOutIcon: any;
  export default ZoomOutIcon;
}

declare module '@mui/icons-material/Fullscreen' {
  const FullscreenIcon: any;
  export default FullscreenIcon;
}

declare module '@mui/icons-material/FullscreenExit' {
  const FullscreenExitIcon: any;
  export default FullscreenExitIcon;
} 