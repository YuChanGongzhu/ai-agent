import { DialogList } from './dialogList';
import { DialogPage } from './dialogPage';
import { ChatMemory } from './chatMemory';
import { MaterialBase } from './materialBase';
import { EmployeeStudy } from './employeeStudy';
import {  getConversationsApi } from '../api/dify';
import { useEffect, useState } from 'react';
import { Conversation } from '../api/dify';

export const Dialog = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    const getConversations = async () => {
        try {
            const res = await getConversationsApi({ 
                user: 'zacks',
                sort_by: '-updated_at'
            });
            setConversations(res.data);
            console.log('Conversations loaded:', res.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    useEffect(() => {
        getConversations()
    }, [])
    return (
        <div className="h-screen p-6 flex space-x-6">
            {/* Left Column - Chat List */}
            <div className="w-[240px] flex-shrink-0">
                <div className="h-full">
                    <DialogList 
                        dialogs={conversations}
                        onSelectDialog={setSelectedConversation}
                    />
                </div>
            </div>

            {/* Middle Column - Chat Window */}
            <div className="flex-1">
                <div className="h-full">
                    <DialogPage 
                        conversation={selectedConversation}
                    />
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