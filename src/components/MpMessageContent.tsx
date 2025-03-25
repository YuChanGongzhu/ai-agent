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

// 专门用于处理微信公众号消息的组件
export const MpMessageContent: React.FC<MpMessageContentProps> = ({ content, msgType }) => {
    // 如果 content 为 null 或 undefined，提供一个空字符串作为默认值
    const safeContent = content || '';
    
    // 根据消息类型显示不同内容
    switch(msgType.toLowerCase()) {
        case 'text':
            return <span>{safeContent}</span>;
            
        case 'image':
            return <span>[图片消息]</span>;
            
        case 'voice':
            return <span>[语音消息]</span>;
            
        case 'video':
            return <span>[视频消息]</span>;
            
        default:
            return <span>[未知类型: {msgType}]</span>;
    }
};
