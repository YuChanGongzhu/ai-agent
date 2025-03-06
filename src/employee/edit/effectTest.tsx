import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessageApi, ChatMessageRequest, ChatMessageStreamEvent } from '../../api/dify';
import clsx from 'clsx';
import { WxAccount,updateWxAccountPromptApi } from '../../api/airflow';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface EffectTestProps {
  wxAccount?: WxAccount;
  prompt: string;
}

export const EffectTest: React.FC<EffectTestProps> = ({ wxAccount, prompt }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const currentMessageRef = useRef('');

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, currentStreamedMessage]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Add user message to the chat
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
      // Create user ID from wxAccount
      const userId = wxAccount ? `${wxAccount.name}_test_${wxAccount.wxid}` : 'user-123';
      
      // Prepare request data
      const requestData: ChatMessageRequest = {
        query: inputText,
        response_mode: 'streaming',
        user: userId,
        inputs: {
          ui_input_prompt: prompt
        },
        conversation_id: conversationId
      };

      // Handle streaming response
      await sendChatMessageApi(requestData, (event: ChatMessageStreamEvent) => {
        // console.log('Received event:', event);
        
        if (event.event === 'message') {
        //   console.log('Message content:', event.answer);
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
            timestamp:  (event.created_at!)*1000 || Date.now(),
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setCurrentStreamedMessage('');
          setIsLoading(false);
        } else if (event.event === 'error') {
          console.error('Error from API:', event.message);
          setIsLoading(false);
        }
      });
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

  const savePrompt=async()=>{
    setIsSaving(true);
    try {
      await updateWxAccountPromptApi(wxAccount!.wxid,wxAccount!.name,prompt)
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium text-black">效果测试 {wxAccount?.name}</h2>
        {isSaving ? (
          <button className="btn btn-square btn-sm">
            <span className="loading loading-spinner"></span>
          </button>
        ) : (
          <button className='btn btn-primary btn-sm' onClick={savePrompt}>保存</button>
        )}
      </div>
      
      <div 
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto"
        style={{ maxHeight: '500px' }}
      >
        {messages.map((message) => (
          <div 
            key={message.id}
            className={clsx(
              'mb-4 max-w-[80%] rounded-lg p-3',
              message.isUser 
                ? 'bg-gray-100 text-gray-800 self-start' 
                : 'bg-purple-100 text-gray-800 self-end ml-auto'
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            <span className="text-xs text-gray-500 mt-1 block text-right">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        
        {currentStreamedMessage && (
          <div className="mb-4 max-w-[80%] rounded-lg p-3 bg-purple-100 text-gray-800 self-end ml-auto">
            <p className="whitespace-pre-wrap break-words">{currentStreamedMessage}</p>
            <span className="text-xs text-gray-500 mt-1 block text-right">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        {isLoading && !currentStreamedMessage && (
          <div className="flex justify-center items-center py-2">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
              <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
              <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 p-4 flex items-end">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么吧..."
          className={clsx(
            'flex-1 resize-none rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm/6 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-purple-500'
          )}
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
          className={clsx(
            'ml-3 rounded-lg bg-purple-600 px-3 py-2 text-white',
            'hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500',
            (isLoading || !inputText.trim()) && 'opacity-50 cursor-not-allowed'
          )}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default EffectTest;