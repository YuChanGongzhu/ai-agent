import axios from 'axios';

const BASE_URL = process.env.REACT_APP_DIFY_BASE_URL;
const API_KEY = process.env.REACT_APP_DIFY_API_KEY;
const DATASET_API_KEY = process.env.REACT_APP_DIFY_DATASET_API_KEY;

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

const difyDatasetAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${DATASET_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

interface CreateDatasetRequest {
  name: string;
  description?: string;
  indexing_technique?: 'high_quality' | 'economy';
  permission?: 'only_me' | 'all_team_members' | 'partial_members';
  provider?: 'vendor' | 'external';
  external_knowledge_api_id?: string;
  external_knowledge_id?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  permission: string;
  data_source_type: string | null;
  indexing_technique: string | null;
  app_count: number;
  document_count: number;
  word_count: number;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
  embedding_model: string | null;
  embedding_model_provider: string | null;
  embedding_available: boolean | null;
}

export async function createDatasetApi(data: CreateDatasetRequest): Promise<Dataset> {
  try {
    const response = await difyDatasetAxios.post('/datasets', data);
    return response.data;
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw error;
  }
}

interface DocumentItem {
  id: string;
  position: number;
  data_source_type: string;
  data_source_info: any;
  dataset_process_rule_id: string | null;
  name: string;
  created_from: string;
  created_by: string;
  created_at: number;
  tokens: number;
  indexing_status: string;
  error: string | null;
  enabled: boolean;
  disabled_at: number | null;
  disabled_by: string | null;
  archived: boolean;
}

interface GetDocumentsResponse {
  data: DocumentItem[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

interface GetDocumentsParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export async function getDatasetDocumentsApi(datasetId: string, params?: GetDocumentsParams): Promise<GetDocumentsResponse> {
  try {
    const response = await difyDatasetAxios.get(`/datasets/${datasetId}/documents`, {
      params: {
        ...(params?.keyword && { keyword: params.keyword }),
        ...(params?.page && { page: params.page.toString() }),
        ...(params?.limit && { limit: params.limit.toString() })
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting dataset documents:', error);
    throw error;
  }
}

export type IndexingTechnique = 'high_quality' | 'economy';
export type DocForm = 'text_model' | 'hierarchical_model' | 'qa_model';
export type DocType = 'book' | 'web_page' | 'paper' | 'social_media_post' | 'wikipedia_entry' | 
              'personal_document' | 'business_document' | 'im_chat_log' | 'synced_from_notion' | 
              'synced_from_github' | 'others';
export type ProcessRuleMode = 'automatic' | 'custom';
export type ParentMode = 'full-doc' | 'paragraph';

export interface PreProcessingRule {
  id: 'remove_extra_spaces' | 'remove_urls_emails';
  enabled: boolean;
}

export interface SegmentationRule {
  separator: string;
  max_tokens: number;
  parent_mode?: ParentMode;
}

export interface SubchunkSegmentationRule {
  separator: string;
  max_tokens: number;
  chunk_overlap?: number;
}

export interface ProcessRules {
  pre_processing_rules: PreProcessingRule[];
  segmentation: SegmentationRule;
  subchunk_segmentation?: SubchunkSegmentationRule;
}

export interface ProcessRule {
  mode: ProcessRuleMode;
  rules: ProcessRules;
}

export interface BookMetadata {
  title: string;
  language: string;
  author: string;
  publisher?: string;
  publication_date?: string;
  isbn?: string;
  category?: string;
}

export interface WebPageMetadata {
  url: string;
  title?: string;
  description?: string;
  language?: string;
  author?: string;
  published_date?: string;
}

export type DocMetadata = BookMetadata | WebPageMetadata | Record<string, any>;

export type SearchMethod = 'hybrid_search' | 'semantic_search' | 'full_text_search';

export interface RerankingModel {
  reranking_provider_name: string;
  reranking_model_name: string;
}

export interface RetrievalModel {
  search_method: SearchMethod;
  reranking_enable: boolean;
  reranking_model?: RerankingModel;
  top_k: number;
  score_threshold_enabled?: boolean;
  score_threshold?: number;
}

export interface CreateDocumentByFileData {
  original_document_id?: string;
  indexing_technique: IndexingTechnique;
  doc_form?: DocForm;
  doc_type?: DocType;
  doc_metadata?: DocMetadata;
  doc_language?: string;
  process_rule: ProcessRule;
  retrieval_model?: RetrievalModel;
  embedding_model?: string;
  embedding_model_provider?: string;
}

interface DocumentResponse {
  id: string;
  position: number;
  data_source_type: string;
  data_source_info: {
    upload_file_id: string;
  };
  dataset_process_rule_id: string;
  name: string;
  created_from: string;
  created_by: string;
  created_at: number;
  tokens: number;
  indexing_status: string;
  error: string | null;
  enabled: boolean;
  disabled_at: number | null;
  disabled_by: string | null;
  archived: boolean;
  display_status: string;
  word_count: number;
  hit_count: number;
  doc_form: DocForm;
}

interface CreateDocumentByFileResponse {
  document: DocumentResponse;
  batch: string;
}

// Default options for document upload when not specified
export const defaultDocumentUploadOptions: Partial<CreateDocumentByFileData> = {
  indexing_technique: 'high_quality',
  doc_form: 'text_model',
  process_rule: {
    mode: 'custom',
    rules: {
      pre_processing_rules: [
        { id: 'remove_extra_spaces', enabled: true },
        { id: 'remove_urls_emails', enabled: true }
      ],
      segmentation: {
        separator: '\n',
        max_tokens: 1000
      }
    }
  },
  retrieval_model: {
    search_method: 'hybrid_search',
    reranking_enable: false,
    top_k: 2,
    score_threshold_enabled: false,
    score_threshold: 0.5
  }
};

export async function createDocumentByFileApi(
  datasetId: string,
  file: File,
  data: CreateDocumentByFileData
): Promise<CreateDocumentByFileResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(data));
    
    const response = await difyDatasetAxios.post(
      `/datasets/${datasetId}/document/create-by-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating document by file:', error);
    throw error;
  }
}