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
}

const BASE_URL = process.env.REACT_APP_AIRFLOW_BASE_URL
const USERNAME = process.env.REACT_APP_AIRFLOW_USERNAME
const PASSWORD = process.env.REACT_APP_AIRFLOW_PASSWORD

export type ConfigKey = 'config1' | 'config2' | 'config3';

const keyMap: Record<ConfigKey, string | undefined> = {
  'config1': process.env.REACT_APP_DIFY_API_KEY1,
  'config2': process.env.REACT_APP_DIFY_API_KEY2,
  'config3': process.env.REACT_APP_DIFY_API_KEY3
}

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

export const getAIReplyListApi=async(username:string,wxid:string):Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${username}_${wxid}_enable_ai_room_ids`));
}

export const postAIReplyListApi=async(username:string,wxid:string,room_ids:Array<string>):Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(room_ids),
    key: `${username}_${wxid}_enable_ai_room_ids`,
    description: ""
  }));
}

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

export const getWxChatHistorySummaryApi = async (wxid: string, room_id: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${wxid}_${room_id}_chat_summary`));
}

export const getWxAccountPromptApi = async (wxid: string, name: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_ui_input_prompt`));
}


export const updateWxAccountPromptApi = async (wxid: string, name: string, prompt: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(prompt),
    key: `${name}_${wxid}_ui_input_prompt`,
    description: `${name}-自定义提示词"`
  }));
}

export const getWxHumanListApi = async (name: string, wxid: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_CONTACT_LIST`));
}

export const updateWxHumanListApi = async (wxid: string, name: string, room_ids: Array<string>): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: JSON.stringify(room_ids),
    key: `${name}_${wxid}_human_room_ids`,
    description: `${name}-转人工列表"`
  }));
}

export const getWxCountactHeadListApi = async (name: string, wxid: string): Promise<VariableResponse> => {
  return handleRequest<VariableResponse>(airflowAxios.get(`/variables/${name}_${wxid}_CONTACT_LIST`));
}

export const updateWxDifyReplyApi = async (wxid: string, name: string, config?: string): Promise<VariableResponse> => {
  console.log(wxid, name, config, config ? keyMap[config as ConfigKey] : keyMap['config3']);
  return handleRequest<VariableResponse>(airflowAxios.post(`/variables`,{
    value: config ? keyMap[config as ConfigKey] : keyMap['config3'],
    key: `${name}_${wxid}_dify_api_key`,
    description: `${name}-自定义回复"`
  }));
}