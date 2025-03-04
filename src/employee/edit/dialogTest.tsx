import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export const DialogTest: React.FC = () => {
    const chatbotUrl=process.env.REACT_APP_DIFY_CHATBOT_ID
    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">效果测试</h3>
            </div>

            <iframe
                src={chatbotUrl}
                allow="microphone"
                style={{ width: '100%', height: '100%', minHeight: '700px' }}
            ></iframe>

            {/* <div className="p-4 border-t">
                <div className="flex items-end space-x-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="说点什么..."
                        className="flex-1 resize-none rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px] max-h-[120px]"
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        className={clsx(
                            'rounded-lg p-2 transition-colors',
                            newMessage.trim() 
                                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                                : 'bg-gray-100 text-gray-400'
                        )}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                            />
                        </svg>
                    </button>
                </div>
            </div> */}
        </div>
    );
};
