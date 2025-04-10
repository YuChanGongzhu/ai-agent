import axios from 'axios';

export interface WxAccount {
  wxid: string;
  name: string;
  mobile: string;
  home: string;
  small_head_url: string;
  big_head_url: string;
  source_ip: string;
  is_online: boolean;
  contact_num: number;
  update_time: string;
  create_time: string;
}

export interface WxMpAccount {
  gh_user_id: string;
  name: string;
}

const BASE_URL = process.env.REACT_APP_AIRFLOW_BASE_URL
const USERNAME = process.env.REACT_APP_AIRFLOW_USERNAME
const PASSWORD = process.env.REACT_APP_AIRFLOW_PASSWORD

const airflowAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`,
    'Content-Type': 'application/json',
  },
});

const handleRequest = async <T>(request: Promise<any>): Promise<T> => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Airflow API request failed: ${error.message}`);
    }
    throw error;
  }
};

export const getWxAccountListApi = async (): Promise<WxAccount[]> => {
  const response = await handleRequest<{key: string; value: string}>(airflowAxios.get('/variables/WX_ACCOUNT_LIST'));
  return JSON.parse(response.value);
};

export const getWxMpAccountListApi = async (): Promise<WxMpAccount[]> => {
  const response = await handleRequest<{key: string; value: string}>(airflowAxios.get('/variables/WX_MP_ACCOUNT_LIST'));
  return JSON.parse(response.value);
};

interface DagRunRequest<T = any> {
  conf: T;
  dag_run_id: string;
  data_interval_end: string;
  data_interval_start: string;
  logical_date: string;
  note: string;
}

interface ChatMessageConf {
  room_id: string;
  content: string;
  source_ip: string;
  sender: string;
  msg_type: number;
  is_self: boolean;
  is_group: boolean;
}

interface WxChatHistorySummaryConf {
  wx_user_id: string;
  room_id: string;
}

export const sendChatMessageApi = async (request: DagRunRequest<ChatMessageConf>) => {
  return handleRequest(airflowAxios.post('/dags/wx_msg_sender/dagRuns', request));
};

interface VariableResponse {
  description: string | null;
  key: string;
  value: string;
}

export const getUserMsgCountApi = async (username: string ): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${username}_msg_count?`));
} 

export const generateWxChatHistorySummaryApi = async (request: DagRunRequest<WxChatHistorySummaryConf>) => {
  return handleRequest(airflowAxios.post('/dags/wx_chat_history_summary/dagRuns', request));
};

export const getWxAccountPromptApi = async (wxid: string, name: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_ui_input_prompt`));
}


export const updateWxAccountPromptApi = async (wxid: string, name: string, prompt: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(prompt),
    key: `${name}_${wxid}_ui_input_prompt`,
    description: `${name}-自定义提示词`
  }));
}

export const getWxHumanListApi = async (name: string, wxid: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_human_room_ids`));
}

export const updateWxHumanListApi = async (wxid: string, name: string, room_ids: Array<string>): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(room_ids),
    key: `${name}_${wxid}_human_room_ids`,
    description: `${name}-转人工列表`
  }));
}

export const getWxCountactHeadListApi = async (name: string, wxid: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_CONTACT_LIST`));
}

export enum ConfigKey {
  SALES = 'sales',
  HEALTH = 'health',
  BEAUTY = 'beauty',
  FINANCE = 'finance',
  DEFAULT = 'beauty', // 默认使用beauty
  LUCY = 'lucy',
  LUCY_GROUP = 'lucy_group'
}

const keyMap: Record<string, string | undefined> = {
  [ConfigKey.SALES]: process.env.REACT_APP_DIFY_API_SALES,
  [ConfigKey.HEALTH]: process.env.REACT_APP_DIFY_API_HEALTH,
  [ConfigKey.BEAUTY]: process.env.REACT_APP_DIFY_API_BEAUTY,
  [ConfigKey.FINANCE]: process.env.REACT_APP_DIFY_API_FINANCE,
  [ConfigKey.LUCY]: process.env.REACT_APP_DIFY_API_LUCY,
  [ConfigKey.LUCY_GROUP]: process.env.REACT_APP_DIFY_API_LUCY_GROUP
}
export const updateWxDifyReplyApi = async (wxid: string, name: string, appId?: string): Promise<VariableResponse> => {
  console.log('Updating Dify API key:', wxid, name, appId);
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: appId || '',
    key: `${name}_${wxid}_dify_api_key`,
    description: `${name}-自定义回复`
  }));
}

export const updateWxDifyGroupReplyApi = async (wxid: string, name: string, config?: string): Promise<VariableResponse> => {
  console.log(wxid, name, config, config ? keyMap[config] : keyMap[ConfigKey.BEAUTY]);
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: config ? keyMap[config] : keyMap[ConfigKey.BEAUTY],
    key: `${name}_${wxid}_group_dify_api_key`,
    description: `${name}-群回复`
  }));
}

export const getAIReplyListApi=async(username:string,wxid:string):Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${username}_${wxid}_enable_ai_room_ids`));
}

export const postAIReplyListApi=async(username:string,wxid:string,room_ids:Array<string>):Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(room_ids),
    key: `${username}_${wxid}_enable_ai_room_ids`,
    description: `${username}-允许ai会话列表`
  }));
}
export const getDisableAIReplyListApi=async(username:string,wxid:string):Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${username}_${wxid}_disable_ai_room_ids`));
}

export const postDisableAIReplyListApi=async(username:string,wxid:string,room_ids:Array<string>):Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(room_ids),
    key: `${username}_${wxid}_disable_ai_room_ids`,
    description: `${username}-禁止ai会话列表`
  }));
}

export const getWxAccountSingleChatApi = async (name: string, wxid: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_single_chat_ai_global`));
}

export const getWxAccountGroupChatApi = async (name: string, wxid: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_group_chat_ai_global`));
}

export const updateWxAccountSingleChatApi = async (name: string, wxid: string, switchVal:string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: switchVal,
    key: `${name}_${wxid}_single_chat_ai_global`,
    description: `${name}-单聊AI配置`
  }));
}

export const updateWxAccountGroupChatApi = async (name: string, wxid: string, switchVal:string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: switchVal,
    key: `${name}_${wxid}_group_chat_ai_global`,
    description: `${name}-群聊AI配置`
  }));
}