import React from 'react';

interface ImageAttributes {
    aeskey: string;
    cdnthumburl: string;
    cdnthumblength: string;
    cdnthumbheight: string;
    cdnthumbwidth: string;
    cdnmidimgurl: string;
    length: string;
    md5: string;
}

interface MessageContentProps {
    content: string;
    msgType: number;
}

interface ParsedContent {
    type: 'image' | 'unknown' | 'error';
    attributes?: Partial<ImageAttributes>;
    content?: string;
}

const parseXmlToJson = (xmlString: string): ParsedContent => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        // For image messages
        const imgElement = xmlDoc.getElementsByTagName('img')[0];
        if (imgElement) {
            const attributes: Partial<ImageAttributes> = {};
            for (const attr of Array.from(imgElement.attributes)) {
                attributes[attr.name as keyof ImageAttributes] = attr.value;
            }
            return {
                type: 'image',
                attributes
            };
        }
        
        return {
            type: 'unknown',
            content: xmlString
        };
    } catch (error) {
        console.error('Error parsing XML:', error);
        return {
            type: 'error',
            content: xmlString
        };
    }
};

const ImageMessage: React.FC<{ attributes: Partial<ImageAttributes> }> = ({ attributes }) => {
    const getImageUrl = (base64Url: string) => {
        try {
            // Convert base64 to binary string
            const binaryStr = atob(base64Url);
            // Convert binary string to byte array
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            // Create blob from byte array
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error creating image URL:', error);
            return '';
        }
    };

    const imageUrl = attributes.cdnthumburl ? getImageUrl(attributes.cdnthumburl) : '';
    const midImageUrl = attributes.cdnmidimgurl ? getImageUrl(attributes.cdnmidimgurl) : '';

    return (
        <div className="image-message">
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
                            // Open mid image in new tab if available, otherwise open thumbnail
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

export const MessageContent: React.FC<MessageContentProps> = ({ content, msgType }) => {
    // Handle text messages directly
    if (msgType === 1) {
        return <span>{content}</span>;
    }

    // For messages that might contain XML
    if (content.startsWith('<?xml')) {
        const parsedContent = parseXmlToJson(content);
        
        switch (parsedContent.type) {
            case 'image':
                return parsedContent.attributes ? 
                    <ImageMessage attributes={parsedContent.attributes} /> : 
                    <span className="text-red-500">[图片信息不完整]</span>;
            case 'error':
                return <span className="text-red-500">[消息解析失败]</span>;
            default:
                return <span>[未知消息类型]</span>;
        }
    }

    // Default fallback
    return <span>{content}</span>;
};
