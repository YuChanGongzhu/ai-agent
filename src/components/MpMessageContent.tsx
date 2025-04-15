import React from 'react';

interface MpMessageContentProps {
    content: string;
    msgType: string;
}

interface ParsedContent {
    type: string;
    attributes?: Record<string, string>;
}

interface ImageMessageProps {
    attributes: Record<string, string>;
}

// 用于显示图片信息的组件
const ImageMessage: React.FC<ImageMessageProps> = ({ attributes }) => {
    // 从属性中提取图片URL
    const imageUrl = attributes.cdnthumburl || attributes.thumburl || '';
    const midImageUrl = attributes.cdnmidimgurl || attributes.midimgurl || '';

    return (
        <div className="message-image">
            {imageUrl && (
                <div className="mb-2">
                    <img
                        src={imageUrl}
                        alt="Thumbnail"
                        className="rounded-lg max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                            width: attributes.cdnthumbwidth ? `${attributes.cdnthumbwidth}px` : 'auto',
                            height: attributes.cdnthumbheight ? `${attributes.cdnthumbheight}px` : 'auto',
                        }}
                        onClick={() => {
                            // 如果有中等尺寸图片则在新标签页打开，否则打开缩略图
                            if (midImageUrl || imageUrl) {
                                window.open(midImageUrl || imageUrl, '_blank');
                            }
                        }}
                    />
                </div>
            )}
            <div className="image-details text-xs text-gray-500">
                <span>{attributes.length ? `${Math.round(parseInt(attributes.length) / 1024)}KB` : ''}</span>
            </div>
        </div>
    );
};

// 处理公众号图片路径的组件
const MpImageMessage: React.FC<{ content: string }> = ({ content }) => {
    // 添加预览状态
    const [showPreview, setShowPreview] = React.useState(false);
    
    // 获取COS图片的URL
    const getImageUrl = (): string => {
        try {
            const bucket = 'wx-mp-records-1347723456';
            const region = 'ap-guangzhou';
            const url = `https://${bucket}.cos.${region}.myqcloud.com/${encodeURIComponent(content)}`;
            return url;
        } catch (error) {
            console.error('构建图片URL时出错:', error);
            return '';
        }
    };
    
    const imageUrl = getImageUrl();
    
    // 打开预览
    const openPreview = () => {
        setShowPreview(true);
    };
    
    // 关闭预览
    const closePreview = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPreview(false);
    };
    
    if (!imageUrl) {
        return <span>[图片加载失败]</span>;
    }
    
    return (
        <div className="image-container relative">
            <img 
                src={imageUrl} 
                alt="图片消息" 
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '200px' }}
                onClick={openPreview}
            />
                            
            {/* 全屏预览模式 */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={closePreview}>
                    <div className="relative max-w-4xl max-h-full">
                        <img src={imageUrl} alt="原始图片" className="max-w-full max-h-[90vh] object-contain" />
                        <button className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-900 hover:bg-gray-200" onClick={closePreview}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 专门用于处理微信公众号消息的组件
export const MpMessageContent: React.FC<MpMessageContentProps> = ({ content, msgType }) => {
    // 如果 content 为 null 或 undefined，提供一个空字符串作为默认值
    const safeContent = content || '';
    
    // 检查是否是图片路径
    const isImagePath = safeContent.includes('/') && safeContent.includes('wx_image_');
    
    // 根据消息类型显示不同内容
    switch(msgType.toLowerCase()) {
        case 'text':
            return <span>{safeContent}</span>;
            
        case 'image':
            // 如果是图片路径，使用MpImageMessage组件
            if (isImagePath) {
                return <MpImageMessage content={safeContent} />;
            }
            return <span>[图片消息]</span>;
            
        case 'voice':
            return <span>[语音消息]</span>;
            
        case 'video':
            return <span>[视频消息]</span>;
            
        default:
            return <span>[未知类型: {msgType}]</span>;
    }
};
