/**
 * 微信公众号消息类型处理工具
 * 用于格式化和解析不同类型的公众号消息
 */

// 获取公众号消息内容的文本表示
export const getMpMessageContent = (msgType: string, content: string): string => {
    switch(msgType.toLowerCase()) {
        case 'text':
            return content;
        case 'image':
            return '[图片消息]';
        case 'voice':
            return '[语音消息]';
        case 'video':
            return '[视频消息]';
        case 'news':
            return '[图文消息]';
        case 'music':
            return '[音乐消息]';
        case 'location':
            return '[位置信息]';
        case 'link':
            return '[链接消息]';
        case 'event':
            return '[事件通知]';
        default:
            return `[${msgType || '未知类型'}]`;
    }
};
