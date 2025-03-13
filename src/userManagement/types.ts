import { UserProfile } from './userProfileService';

export interface UserData {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  is_active: boolean;
  role: string;
  display_name?: string;
  profile?: UserProfile | null;
} 