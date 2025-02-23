import { DialogList } from './dialogList';
import { DialogPage } from './dialogPage';
import { ChatMemory } from './chatMemory';
import { MaterialBase } from './materialBase';
import { EmployeeStudy } from './employeeStudy';
import { sendChatMessageApi, getConversationsApi, getMessagesApi, parseStreamingEvent } from '../api/dify';
import { useEffect } from 'react';

export const Dialog = () => {
    const sendBlockingMessage = async () => {
        const res = await sendChatMessageApi({
            inputs: {},
            query: "有什么医美资料",
            response_mode: 'blocking',
            conversation_id: '',
            user: 'abc-123'
        })
        console.log('Blocking response:', res)
    }

    const sendStreamingMessage = async () => {
        const stream = await sendChatMessageApi({
            inputs: {},
            query: "What are the specs of the iPhone 13 Pro Max?",
            response_mode: 'streaming',
            conversation_id: '',
            user: 'abc-123',
            files: [
                {
                    type: 'image',
                    transfer_method: 'remote_url',
                    url: 'https://cloud.dify.ai/logo/logo-site.png'
                }
            ]
        }) as ReadableStream

        const reader = stream.getReader()
        const decoder = new TextDecoder()

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                // Process the stream data
                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.trim() === '') continue
                    const event = parseStreamingEvent(line)
                    if (event) {
                        console.log('Streaming event:', event)
                        // Handle different event types
                        switch (event.event) {
                            case 'message':
                                // Append text to UI
                                console.log('Message chunk:', event.answer)
                                break
                            case 'message_end':
                                // Show final metadata
                                console.log('Final metadata:', event.metadata)
                                break
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }
    const getConversations = async () => {
        const res = await getConversationsApi({ user: '45319021894@chatroom_thanks0' })
        console.log('Conversations:', res)
        if (res.data.length > 0) {
            // Get messages for the first conversation
            const messages = await getMessagesApi({
                user: '45319021894@chatroom_thanks0',
                conversation_id: res.data[0].id
            })
            console.log('Messages:', messages)
        }
    }

    useEffect(() => {
        // Test both modes
        // sendBlockingMessage()
        // sendStreamingMessage()
        getConversations()
    }, [])
    return (
        <div className="h-screen p-6 flex space-x-6">
            {/* Left Column - Chat List */}
            <div className="w-[240px] flex-shrink-0">
                <div className="h-full">
                    <DialogList />
                </div>
            </div>

            {/* Middle Column - Chat Window */}
            <div className="flex-1">
                <div className="h-full">
                    <DialogPage />
                </div>
            </div>

            {/* Right Column - Material and Study */}
            <div className="w-[300px] flex-shrink-0">
                <div className="h-full flex flex-col space-y-6">
                    {/* Material List */}
                    <div className="flex-shrink-0">
                        <MaterialBase />
                    </div>

                    {/* Today's Memory */}
                    <div className="flex-shrink-0">
                        <ChatMemory />
                    </div>

                    {/* Employee Study */}
                    <div className="flex-1">
                        <EmployeeStudy />
                    </div>
                </div>
            </div>
        </div>
    );
};