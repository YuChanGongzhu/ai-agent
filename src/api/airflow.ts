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

const BASE_URL = 'http://129.204.143.82/api/v1';
const USERNAME = 'claude89757';
const PASSWORD = 'claude@airflow';

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

export const getAIReplyListApi=async()=> {
  return handleRequest(airflowAxios.get('/variables/enable_ai_room_ids'));
}

interface ChatMessageConf {
  msg: string;
  source_ip: string;
  room_id: string;
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