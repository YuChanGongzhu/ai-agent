// Supabase配置文件
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 初始化Supabase
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Supabase 安全配置指南
 * 
 * 如果遇到权限问题，请确保在 Supabase 控制台中正确配置 RLS (Row Level Security) 策略:
 * 
 * 1. 登录 Supabase 控制台 (https://app.supabase.com/)
 * 2. 选择您的项目
 * 3. 导航至 "Authentication" > "Policies"
 * 4. 为用户表添加适当的 RLS 策略
 * 
 * 示例策略:
 * ```sql
 * CREATE POLICY "Users can view their own data" ON "public"."users"
 * FOR SELECT USING (auth.uid() = id);
 * 
 * CREATE POLICY "Users can update their own data" ON "public"."users"
 * FOR UPDATE USING (auth.uid() = id);
 * ```
 */

export default supabase;
