
const BASE_URL = 'http://43.160.203.237/v1';
const API_KEY = 'app-PxThpS1NYVqrtgZoTWhvNeMd'; //工号001机器人

interface Conversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
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

interface Message {
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

export async function sendChatMessageApi(request: ChatRequest): Promise<BlockingChatResponse | ReadableStream> {
  try {
    const response = await fetch(`${BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    if (request.response_mode === 'blocking') {
      return await response.json();
    } else {
      // Streaming mode
      if (!response.body) {
        throw new Error('No response body received for streaming request');
      }
      return response.body;
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

// Helper function to parse streaming events
export function parseStreamingEvent(data: string): StreamingEvent | null {
  try {
    if (data.startsWith('data: ')) {
      const jsonStr = data.slice(6); // Remove 'data: ' prefix
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (error) {
    console.error('Error parsing streaming event:', error);
    return null;
  }
}

export async function getMessagesApi(params: { user: string; conversation_id: string; last_id?: string; limit?: number }): Promise<MessagesResponse> {
  try {
    const queryParams = new URLSearchParams({
      user: params.user,
      conversation_id: params.conversation_id,
      ...(params.last_id ? { last_id: params.last_id } : {}),
      ...(params.limit ? { limit: params.limit.toString() } : { limit: '20' })
    });

    const response = await fetch(`${BASE_URL}/messages?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export async function getConversationsApi(params: { user: string; last_id?: string; limit?: number }): Promise<ConversationsResponse> {
  try {
    const queryParams = new URLSearchParams({
      user: params.user,
      ...(params.last_id ? { last_id: params.last_id } : {}),
      ...(params.limit ? { limit: params.limit.toString() } : { limit: '20' })
    });

    const response = await fetch(`${BASE_URL}/conversations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}