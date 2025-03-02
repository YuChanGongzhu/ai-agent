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

export const getAIReplyListApi=async(username:string)=> {
  return handleRequest(airflowAxios.get(`/variables/${username}_enable_ai_room_ids`));
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

interface ChatMessageRequest {
  conf: ChatMessageConf;
  dag_run_id: string;
  data_interval_end: string;
  data_interval_start: string;
  logical_date: string;
  note: string;
}

export const sendChatMessageApi = async (request: ChatMessageRequest) => {
  return handleRequest(airflowAxios.post('/dags/wx_msg_sender/dagRuns', request));
};

interface MsgCountResponse {
  description: string | null;
  key: string;
  value: string;
}

export const getUserMsgCountApi = async (username: string): Promise<MsgCountResponse> => {
  return handleRequest<MsgCountResponse>(airflowAxios.get(`/variables/${username}_msg_count?`));
} 