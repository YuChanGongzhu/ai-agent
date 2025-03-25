import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Select } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import supabase from '../auth/supabaseConfig';

const { Title } = Typography;
const { Option } = Select;

// 自定义样式
const selectStyles = {
  '.ant-select-with-prefix .ant-select-selector': {
    paddingLeft: '32px !important',
  },
  '.ant-select-with-prefix .ant-select-selection-search-input': {
    paddingLeft: '0 !important',
  },
  '.ant-select-with-prefix .ant-select-selection-item': {
    paddingLeft: '0 !important',
  },
  '.ant-select-with-prefix .ant-select-arrow': {
    right: '11px',
  },
};

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  invitationCode: string;
  industry: string;
}

interface Industry {
  id: number;
  name: string;
}

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 获取行业列表
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data, error } = await supabase
          .from('industry')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('获取行业列表失败:', error);
          message.error('获取行业列表失败，请刷新页面重试');
          return;
        }

        setIndustries(data || []);
      } catch (error) {
        console.error('获取行业列表时发生错误:', error);
        message.error('获取行业列表失败，请刷新页面重试');
      }
    };

    fetchIndustries();
  }, []);

  // 验证邮箱是否已被使用
  const validateEmail = async (_: any, value: string) => {
    if (!value) {
      return Promise.reject('请输入邮箱');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', value)
        .maybeSingle();

      if (error) {
        console.error('验证邮箱失败:', error);
        return Promise.reject('验证邮箱失败，请稍后重试');
      }

      if (data) {
        return Promise.reject('该邮箱已被注册，请使用其他邮箱');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('验证邮箱时发生错误:', error);
      return Promise.reject('验证邮箱时发生错误，请稍后重试');
    }
  };

  // 验证邀请码
  const validateInvitationCode = async (_: any, value: string) => {
    if (!value) {
      return Promise.reject('请输入邀请码');
    }

    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('id, status')
        .eq('invitation_code', value)
        .eq('status', 1)
        .maybeSingle();

      if (error) {
        console.error('验证邀请码失败:', error);
        return Promise.reject('验证邀请码失败，请稍后重试');
      }

      if (!data) {
        return Promise.reject('该邀请码不存在或已被使用');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('验证邀请码时发生错误:', error);
      return Promise.reject('验证邀请码时发生错误，请稍后重试');
    }
  };

  const onFinish = async (values: RegisterFormData) => {
    try {
      setLoading(true);

      // 注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        message.error(authError.message);
        return;
      }

      if (authData.user) {
        // 创建用户资料
        const selectedIndustry = industries.find(industry => String(industry.id) === values.industry);
        
        const userProfileData = {
          user_id: authData.user.id,
          email: values.email,
          industry: selectedIndustry?.name || '',  // 确保存储行业名称
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 先检查用户资料是否已存在
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (existingProfile) {
          // 如果用户资料已存在，则更新
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              email: values.email,
              industry: selectedIndustry?.name || '',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', authData.user.id);

          if (updateError) {
            console.error('更新用户资料失败:', updateError);
            message.error('更新用户资料失败，但账号已创建成功');
          }
        } else {
          // 如果用户资料不存在，则创建
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([userProfileData]);

          if (insertError) {
            console.error('创建用户资料失败:', insertError);
            message.error('创建用户资料失败，但账号已创建成功');
          }
        }

        // 更新邀请码状态
        const { error: updateError } = await supabase
          .from('invitation_codes')
          .update({
            status: 0, // 0 表示已使用
            used_at: new Date().toISOString(),
            related_login_name: values.email
          })
          .eq('invitation_code', values.invitationCode);

        if (updateError) {
          console.error('更新邀请码状态失败:', updateError);
          message.error('更新邀请码状态失败，但账号已创建成功');
        }

        message.success('注册成功！请检查邮箱以验证您的账号。');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      message.error(error.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (value && value.length < 6) {
      return Promise.reject('密码长度至少为6位');
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = ({ getFieldValue }: any) => ({
    validator(_: any, value: string) {
      if (!value || getFieldValue('password') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('两次输入的密码不一致'));
    },
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>注册账号</Title>
        </div>
        
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            validateTrigger={['onChange', 'onBlur']}
            validateFirst
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
              { validator: validateEmail }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="邮箱" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { validator: validatePassword }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="设置密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              validateConfirmPassword
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="industry"
            rules={[
              { required: true, message: '请选择行业' }
            ]}
          >
            <Select
              placeholder="请选择行业"
              size="large"
              loading={industries.length === 0}
              style={{ width: '100%' }}
            >
              {industries.map(industry => (
                <Option key={industry.id} value={industry.id}>
                  {industry.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="invitationCode"
            validateTrigger={['onChange', 'onBlur']}
            validateFirst
            rules={[
              { required: true, message: '请输入邀请码' },
              { validator: validateInvitationCode }
            ]}
          >
            <Input
              prefix={<KeyOutlined />}
              placeholder="邀请码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
              style={{ backgroundColor: 'rgba(108, 93, 211, 1)', borderColor: 'rgba(108, 93, 211, 1)' }}
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有账号？{' '}
            <Button type="link" onClick={() => navigate('/login')} style={{ color: 'rgba(108, 93, 211, 1)' }}>
              立即登录
            </Button>
          </div>
        </Form>
      </Card>
      
      {/* Contact Information Footer */}
      <div style={{ 
        width: '400px', 
        backgroundColor: 'rgba(108, 93, 211, 1)', 
        color: 'white', 
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '32px',
        borderRadius: '0 0 8px 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>电话: 19864781028</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>微信: 19864781028</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>邮箱: lucy@lucyai.ai</span>
        </div>
      </div>
    </div>
  );
};

export default Register; 