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
