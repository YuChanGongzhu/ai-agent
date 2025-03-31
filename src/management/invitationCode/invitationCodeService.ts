import supabase from '../../auth/supabaseConfig';
import { getCurrentUser } from '../../auth/authService';

// Interface for Invitation Code
export interface InvitationCode {
  id: number;
  created_at: string;
  invitation_code: string;
  status: number;
  created_by: string;
  used_at: string | null;
  related_login_name: string | null;
}

export class InvitationCodeService {
  /**
   * 获取所有邀请码
   */
  static async getInvitationCodes(searchQuery?: string): Promise<InvitationCode[]> {
    try {
      let query = supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false }); //按创建时间逆序排序;

      if (searchQuery) {
        query = query.or(`invitation_code.ilike.%${searchQuery}%,related_login_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取邀请码列表失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取邀请码列表失败:', error);
      throw error;
    }
  }

  /**
   * 生成新的邀请码
   */
  static async generateInvitationCode(): Promise<InvitationCode> {
    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error('用户未登录，无法生成邀请码');
      }

      // 生成随机邀请码
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase
        .from('invitation_codes')
        .insert([{
          invitation_code: randomCode,
          status: 1,
          created_by: user.id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('生成邀请码失败:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('创建邀请码失败');
      }

      return data[0];
    } catch (error) {
      console.error('生成邀请码失败:', error);
      throw error;
    }
  }

  /**
   * 删除单个邀请码
   */
  static async deleteInvitationCode(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitation_codes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除邀请码失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('删除邀请码失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除邀请码
   */
  static async deleteMultipleInvitationCodes(ids: number[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitation_codes')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('批量删除邀请码失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('批量删除邀请码失败:', error);
      throw error;
    }
  }

  /**
    * 批量发送邀请码
  * @param ids 要发送的邀请码ID数组
  */
  static async batchSendInvitationCodes(ids: number[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitation_codes')
        .update({ status: 2 }) // 2 表示已发送状态
        .in('id', ids)
        .eq('status', 1); // 只更新可用状态的邀请码

      if (error) {
        console.error('批量发送邀请码失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('批量发送邀请码失败:', error);
      throw error;
    }
  }
} 