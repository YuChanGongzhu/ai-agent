import axios from 'axios';

const BASE_URL = process.env.REACT_APP_DIFY_BASE_URL;
const API_KEY = process.env.REACT_APP_DIFY_API_KEY;

// Create axios instance with default config
const difyAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

type SortBy = 'created_at' | '-created_at' | 'updated_at' | '-updated_at';

interface GetConversationsParams {
  user: string;
  last_id?: string;
  limit?: number;
  sort_by?: SortBy;
}

export interface Conversation {
  id: string;
  name: string;
  inputs: {
    ai_reply?: string;
    is_group?: string | null;
    my_name?: string;
    room_id?: string;
    room_name?: string;
    sender_id?: string;
    sender_name?: string;
    [key: string]: any;
  };
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

interface MessageFile {
  id: string;
  type: string;
  url: string;
  belongs_to: string;
}

interface RetrieverResource {
  position: number;
  dataset_id: string;
  dataset_name: string;
  document_id: string;
  document_name: string;
  segment_id: string;
  score: number;
  content: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
  query: string;
  answer: string;
  message_files: MessageFile[];
  feedback: any;
  retriever_resources: RetrieverResource[];
  created_at: number;
}

interface MessagesResponse {
  limit: number;
  has_more: boolean;
  data: Message[];
}

interface ConversationsResponse {
  limit: number;
  has_more: boolean;
  data: Conversation[];
}

type FileType = 'document' | 'image' | 'audio' | 'video' | 'custom';
type TransferMethod = 'remote_url' | 'local_file';

interface ChatFile {
  type: FileType;
  transfer_method: TransferMethod;
  url?: string;
  upload_file_id?: string;
}

interface ChatRequest {
  query: string;
  inputs: Record<string, any>;
  response_mode: 'blocking' | 'streaming';
  user: string;
  conversation_id?: string;
  mode?: 'advanced-chat';
  files?: ChatFile[];
  auto_generate_name?: boolean;
}

interface Usage {
  prompt_tokens: number;
  prompt_unit_price: string;
  prompt_price_unit: string;
  prompt_price: string;
  completion_tokens: number;
  completion_unit_price: string;
  completion_price_unit: string;
  completion_price: string;
  total_tokens: number;
  total_price: string;
  currency: string;
  latency: number;
}

interface WorkflowEvent {
  event: 'workflow_started' | 'workflow_finished' | 'node_started' | 'node_finished';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    [key: string]: any; // Other fields vary by event type
  };
}

interface MessageEvent {
  event: 'message';
  message_id: string;
  conversation_id: string;
  answer: string;
  created_at: number;
}

interface MessageEndEvent {
  event: 'message_end';
  id: string;
  conversation_id: string;
  metadata: {
    usage: Usage;
    retriever_resources: RetrieverResource[];
  };
}

interface TTSEvent {
  event: 'tts_message' | 'tts_message_end';
  conversation_id: string;
  message_id: string;
  created_at: number;
  task_id: string;
  audio: string;
}

type StreamingEvent = WorkflowEvent | MessageEvent | MessageEndEvent | TTSEvent;

interface BlockingChatResponse {
  event: 'message';
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: Usage;
    retriever_resources: RetrieverResource[];
  };
  created_at: number;
}

export async function getMessagesApi(params: { user: string; conversation_id: string; last_id?: string; limit?: number }): Promise<MessagesResponse> {
  try {
    const response = await difyAxios.get('/messages', {
      params: {
        user: params.user,
        conversation_id: params.conversation_id,
        ...(params.last_id ? { last_id: params.last_id } : {}),
        ...(params.limit ? { limit: params.limit.toString() } : { limit: '20' })
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export async function getConversationsApi(params: GetConversationsParams): Promise<ConversationsResponse> {
  try {
    const response = await difyAxios.get('/conversations', {
      params: {
        user: params.user,
        ...(params.last_id ? { last_id: params.last_id } : {}),
        ...(params.limit ? { limit: params.limit.toString() } : { limit: '20' })
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}