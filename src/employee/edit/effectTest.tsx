import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessageApi, ChatMessageRequest, ChatMessageStreamEvent } from '../../api/dify';
import clsx from 'clsx';
import { WxAccount, updateWxAccountPromptApi, updateWxDifyReplyApi } from '../../api/airflow';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface EffectTestProps {
  wxAccount?: WxAccount;
  prompt: string;
  selectedConfig?: string;
}

export const EffectTest: React.FC<EffectTestProps> = ({ wxAccount, prompt, selectedConfig }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const currentMessageRef = useRef('');

  useEffect(()=>{
    console.log('Config changed:', selectedConfig);
    // Reset conversation when config changes
    setConversationId(undefined);
    setMessages([]);
  },[selectedConfig])

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, currentStreamedMessage]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !selectedConfig) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setCurrentStreamedMessage('');
    currentMessageRef.current = '';

    try {
      const userId = wxAccount ? `${wxAccount.name}_test_${wxAccount.wxid}` : 'user-123';
      
      const requestData: ChatMessageRequest = {
        query: inputText,
        response_mode: 'streaming',
        user: userId,
        inputs: {},
        ...(conversationId && { conversation_id: conversationId })
      };

      await sendChatMessageApi(requestData, (event: ChatMessageStreamEvent) => {
        if (event.event === 'message') {
          if (event.answer) {
            currentMessageRef.current += event.answer;
            setCurrentStreamedMessage(currentMessageRef.current);
            // console.log('Updated streamed message:', currentMessageRef.current);
          }
        } else if (event.event === 'message_end') {
          //   console.log('Message end event received');
          if (event.conversation_id) {
            setConversationId(event.conversation_id);
            // console.log('Set conversation ID:', event.conversation_id);
          }

          console.log('Final message content:', currentMessageRef.current);

          const assistantMessage: Message = {
            id: event.message_id || Date.now().toString(),
            content: currentMessageRef.current,
            isUser: false,
            timestamp: (event.created_at!) * 1000 || Date.now(),
          };

          setMessages(prev => [...prev, assistantMessage]);
          setCurrentStreamedMessage('');
          setIsLoading(false);
        } else if (event.event === 'error') {
          console.error('Error from API:', event.message);
          setIsLoading(false);
        }
      }, selectedConfig);  // 这里确保 selectedConfig 是有效的 app_id
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const savePrompt = async () => {
    setIsSaving(true);
    try {
      // await updateWxAccountPromptApi(wxAccount!.wxid, wxAccount!.name, prompt)
      await updateWxDifyReplyApi(wxAccount!.wxid, wxAccount!.name, selectedConfig)
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-[85vh] w-full bg-white rounded-lg shadow-lg overflow-hidden mt-4">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium text-black">{wxAccount?.name} 效果测试</h2>
        {isSaving ? (
          <button className="btn btn-square btn-sm">
            <span className="loading loading-spinner"></span>
          </button>
        ) : (
          <button className='btn btn-sm btn-outline text-[rgba(108,93,211,1)] border-[rgba(108,93,211,1)] hover:bg-[rgba(108,93,211,1)] hover:text-white' onClick={savePrompt}>保存效果</button>
        )}
      </div>

      <div
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'mb-4 max-w-[80%] rounded-lg p-3',
              message.isUser
                ? 'bg-gray-100 text-gray-800 self-start'
                : 'bg-[rgba(108,93,211,0.1)] text-gray-800 self-end ml-auto'
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            <span className="text-xs text-gray-500 mt-1 block text-right">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {currentStreamedMessage && (
          <div className="mb-4 max-w-[80%] rounded-lg p-3 bg-[rgba(108,93,211,0.1)] text-gray-800 self-end ml-auto">
            <p className="whitespace-pre-wrap break-words">{currentStreamedMessage}</p>
            <span className="text-xs text-gray-500 mt-1 block text-right">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {isLoading && !currentStreamedMessage && (
          <div className="flex justify-center items-center py-2">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-[rgba(108,93,211,1)] rounded-full"></div>
              <div className="h-2 w-2 bg-[rgba(108,93,211,1)] rounded-full"></div>
              <div className="h-2 w-2 bg-[rgba(108,93,211,1)] rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4 flex items-end mt-auto">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="开始聊天测试..."
          className={clsx(
            'flex-1 resize-none rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm/6 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,1)]'
          )}
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
          className={clsx(
            'ml-3 rounded-lg bg-[rgba(108,93,211,1)] px-3 py-2 text-white',
            'hover:bg-[rgba(108,93,211,0.9)] focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,1)]',
            (isLoading || !inputText.trim()) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EffectTest;