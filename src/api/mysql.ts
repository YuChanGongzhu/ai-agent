const roomMsgListUrl = process.env.REACT_APP_GET_ROOM_MSG_LIST;
const roomListUrl = process.env.REACT_APP_GET_ROOM_LIST;
const roomMpListUrl = process.env.REACT_APP_GET_MP_ROOM_LIST;
const roomMpMsgListUrl = process.env.REACT_APP_GET_MP_ROOM_MSG_LIST;
const tokenUsageUrl = process.env.REACT_APP_GET_CHAT_TOKEN;

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

/**
 * Interface for token usage record
 */
export interface TokenUsageRecord {
  id: string;
  token_source_platform: string;
  wx_user_id: string;
  wx_user_name?: string;
  room_id?: string;
  room_name?: string;
  model_name?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  unit_price?: number;
  total_price?: number;
  created_at: string;
  updated_at?: string;
  [key: string]: any; // For any other fields that might be returned
}

/**
 * Interface for token usage response
 */
export interface TokenUsageResponse {
  code: number;
  message: string;
  data: {
    total: number;
    records: TokenUsageRecord[];
    limit: number;
    offset: number;
  };
  sum: {
    sum_token: number;
    sum_price: string;
  };
}

/**
 * Retrieves token usage records with optional filtering
 */
export const getTokenUsageApi = async (params: {
  token_source_platform: string;
  wx_user_id: string;
  room_id?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}): Promise<TokenUsageResponse> => {
  try {
    if (!params || !params.token_source_platform) {
      throw new Error('Missing required parameter: token_source_platform');
    }
    
    if (!params.wx_user_id) {
      throw new Error('Missing required parameter: wx_user_id');
    }

    const queryParams = new URLSearchParams();
    
    queryParams.append('token_source_platform', params.token_source_platform);
    queryParams.append('wx_user_id', params.wx_user_id);
    
    if (params.room_id) queryParams.append('room_id', params.room_id);
    if (params.start_time) queryParams.append('start_time', params.start_time);
    if (params.end_time) queryParams.append('end_time', params.end_time);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const baseUrl = tokenUsageUrl || '';
    const url = queryParams.toString()
      ? `${baseUrl}?${queryParams.toString()}`
      : baseUrl;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch token usage records');
    }
    
    return await response.json() as TokenUsageResponse;
  } catch (error) {
    console.error('Error fetching token usage records:', error);
    throw error;
  }
};

const chatSummaryUrl = process.env.REACT_APP_GET_CHAT_SUMMARY;
const friendCircleAnalysisUrl = process.env.REACT_APP_GET_FRIEND_CIRCLE_ANALYSIS;

export interface ChatHistorySummaryResponse {
  code: number;
  message: string;
  data: {
    metadata: {
      id: string;
      room_id: string;
      room_name: string;
      wx_user_id: string;
      time_range: {
        start: string;
        end: string;
      };
      message_count: number;
      created_at: string;
      updated_at: string;
    };
    summary: string;
    chat_key_event: Array<{
      time: string;
      event: string;
      detail: string;
    }>;
    tags: {
      基础信息: {
        name: string;
        contact: string;
        gender: string;
        age_group: string;
        city_tier: string;
        specific_location: string;
        occupation_type: string;
        marital_status: string;
        family_structure: string;
        income_level_estimated: string;
      };
      价值观与兴趣: {
        core_values: any;
        hobbies_interests: any;
        life_status_indicators: any;
        social_media_activity_level: string;
        info_acquisition_habits: any;
      };
      互动与认知: {
        acquisition_channel_type: string;
        acquisition_channel_detail: string;
        initial_intent: string;
        intent_details: string;
        product_knowledge_level: string;
        communication_style: string;
        current_trust_level: string;
        need_urgency: string;
      };
      购买决策: {
        core_need_type: string;
        budget_sensitivity: string;
        decision_drivers: any;
        main_purchase_obstacles: any;
        upsell_readiness: string;
      };
      客户关系: {
        past_satisfaction_level: string;
        customer_loyalty_status: string;
        repurchase_drivers: any;
        need_evolution_trend: string;
        engagement_level: string;
      };
      特殊来源: {
        partner_source_type: string;
        partner_name: string;
        partner_interest_focus: string;
        partner_conversion_obstacles: any;
      };
    };
  } | null;
}

/**
 * Fetches chat history summary for a specific WeChat user and room
 * 
 * @param wxid WeChat user ID
 * @param room_id Room ID
 * @returns Promise with the chat history summary response
 */
export const getWxChatHistorySummaryApi = async (wxid: string, room_id: string): Promise<ChatHistorySummaryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('wx_user_id', wxid);
    queryParams.append('room_id', room_id);

    const baseUrl = chatSummaryUrl || '';
    const url = `${baseUrl}?${queryParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch chat history summary');
    }
    return response.json() as Promise<ChatHistorySummaryResponse>;
  } catch (error) {
    console.error('Error fetching chat history summary:', error);
    throw error;
  }
};

/**
 * Interface for friend circle analysis response
 */
export interface FriendCircleAnalysisResponse {
  code: number;
  message: string;
  data: {
    metadata: {
      id: number;
      wxid: string;
      nickname: string;
      wx_user_id: string;
      created_at: string;
      updated_at: string;
    };
    analysis: {
      basic: {
        gender: string;
        age_group: string;
      };
      consumption: string;
      core_interests: Array<{
        tag: string;
        confidence: number;
      }>;
      life_pattern: {
        work_balance: string;
      };
      social: string[];
      values: string[];
    };
  } | null;
}

/**
 * Fetches friend circle analysis data for a specific WeChat user and friend
 * 
 * @param wx_user_id WeChat user ID
 * @param wxid Friend's WeChat ID
 * @returns Promise with the friend circle analysis response
 */
export const getFriendCircleAnalysisApi = async (wx_user_id: string, wxid: string): Promise<FriendCircleAnalysisResponse> => {
  console.log("getFriendCircleAnalysisApi",wx_user_id,wxid);
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('wx_user_id', wx_user_id);
    queryParams.append('wxid', wxid);

    const baseUrl = friendCircleAnalysisUrl || '';
    const url = `${baseUrl}?${queryParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch friend circle analysis');
    }
    return response.json() as Promise<FriendCircleAnalysisResponse>;
  } catch (error) {
    console.error('Error fetching friend circle analysis:', error);
    throw error;
  }
};
