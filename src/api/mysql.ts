const roomMsgListUrl = process.env.REACT_APP_GET_ROOM_MSG_LIST;
const roomListUrl = process.env.REACT_APP_GET_ROOM_LIST;
const roomMpListUrl = process.env.REACT_APP_GET_MP_ROOM_LIST;
const roomMpMsgListUrl = process.env.REACT_APP_GET_MP_ROOM_MSG_LIST;

export interface ChatMessage {
    msg_id: string;
    wx_user_id: string;
    wx_user_name: string;
    room_id: string;
    room_name: string;
    sender_id: string;
    sender_name: string;
    msg_type: number;
    msg_type_name: string;
    content: string;
    msg_datetime: string;
}

export interface ChatMessagesResponse {
    code: number;
    message: string;
    data: {
        total: number;
        records: ChatMessage[];
    };
}

export const getChatMessagesApi = async (params: {
    room_id?: string;
    wx_user_id?: string;
    sender_id?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
    });

    const response = await fetch(`${roomMsgListUrl}/messages?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch chat messages');
    }
    return response.json() as Promise<ChatMessagesResponse>;
};

export interface RoomListMessage {
    room_id: string;
    room_name: string;
    wx_user_id: string;
    wx_user_name: string;
    sender_id: string;
    sender_name: string;
    msg_id: string;
    msg_content: string;
    msg_datetime: string;
    msg_type: number;
    is_group: boolean;
}

export interface RoomListMessagesResponse {
    code: number;
    message: string;
    data: RoomListMessage[];
}

export const getRoomListMessagesApi = async (params: {
    wx_user_id?: string;
}) => {
    const queryParams = new URLSearchParams();
    if (params.wx_user_id) {
        queryParams.append('wx_user_id', params.wx_user_id);
    }

    const response = await fetch(`${roomListUrl}?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch chat messages');
    }
    return response.json() as Promise<RoomListMessagesResponse>;
};

export const getChatMpMessagesApi = async (params: {
    room_id?: string;
    wx_user_id?: string;
    sender_id?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
    });

    const response = await fetch(`${roomMpMsgListUrl}/messages?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch chat MP messages');
    }
    return response.json() as Promise<ChatMessagesResponse>;
};

export const getRoomMpListMessagesApi = async (params: {
    wx_user_id?: string;
}) => {
    const queryParams = new URLSearchParams();
    if (params.wx_user_id) {
        queryParams.append('wx_user_id', params.wx_user_id);
    }

    const response = await fetch(`${roomMpListUrl}?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch chat MP room messages');
    }
    return response.json() as Promise<RoomListMessagesResponse>;
};

// Interface for WeChat Public Account room list items
export interface MpRoomListMessage {
    room_id: string;
    room_name: string;
    user_id: string;
    sender_id: string;
    sender_name: string;
    msg_id: string;
    msg_type: string; // Changed to string based on SQL schema
    msg_content: string;
    msg_datetime: string;
    is_group: boolean;
}

// Interface for WeChat Public Account chat messages
export interface MpChatMessage {
    msg_id: string;
    sender_id: string;
    sender_name: string;
    receiver_id: string;
    msg_type: string;
    msg_content: string;
    msg_datetime: string;
}

export interface MpChatMessagesResponse {
    code: number;
    message: string;
    data: {
        total: number;
        records: MpChatMessage[];
        limit: number;
        offset: number;
    };
}

export interface MpRoomListResponse {
    code: number;
    message: string;
    data: MpRoomListMessage[];
}

/**
 * Fetches the list of WeChat public account chat sessions
 * Each session includes the latest message between a user and a public account
 * @param params Optional parameters
 * @param params.gh_user_id Optional public account ID to filter results
 */
export const getMpRoomListApi = async (params?: {
    gh_user_id?: string;
}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.gh_user_id) {
            queryParams.append('gh_user_id', params.gh_user_id);
        }

        const baseUrl = roomMpListUrl || '';
        const url = queryParams.toString() 
            ? `${baseUrl}?${queryParams.toString()}` 
            : baseUrl;
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch WeChat public account room list');
        }
        return response.json() as Promise<MpRoomListResponse>;
    } catch (error) {
        console.error('Error fetching WeChat public account room list:', error);
        throw error;
    }
};

/**
 * Fetches chat messages for WeChat public accounts
 * Supports two query methods:
 * 1. By room_id (format: gh_xxx@userid)
 * 2. By from_user_id and to_user_id separately
 *
 * @param params Query parameters for the chat messages
 * @returns Promise with the chat messages response
 */
export const getMpChatMessageApi = async (params: {
    room_id?: string;
    from_user_id?: string;
    to_user_id?: string;
    msg_type?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
    offset?: number;
}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add all provided parameters to the query string
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                queryParams.append(key, value.toString());
            }
        });
        
        const baseUrl = roomMpMsgListUrl || '';
        const url = queryParams.toString()
            ? `${baseUrl}?${queryParams.toString()}`
            : baseUrl;
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch WeChat public account chat messages');
        }
        
        return response.json() as Promise<MpChatMessagesResponse>;
    } catch (error) {
        console.error('Error fetching WeChat public account chat messages:', error);
        throw error;
    }
};
