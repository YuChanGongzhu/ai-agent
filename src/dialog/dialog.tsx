import { DialogList } from './dialogList';
import { DialogPage } from './dialogPage';
import { ChatMemory } from './chatMemory';

export const Dialog = () => {
    return (
        <div className="h-screen p-6 flex space-x-6">
            {/* Left Column - Chat List */}
            <div className="w-[300px] flex-shrink-0">
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

            {/* Right Column - Chat Memory */}
            <div className="w-[300px] flex-shrink-0">
                <div className="h-full">
                    <ChatMemory />
                </div>
            </div>
        </div>
    );
};