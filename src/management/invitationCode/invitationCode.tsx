import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, message, Modal, Typography, Card, Spin, Badge, Tooltip,
  Input, Popconfirm, notification
} from 'antd';
import { CopyOutlined, ReloadOutlined, DeleteOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { InvitationCode, InvitationCodeService } from './invitationCodeService';

const { Title } = Typography;
const { Search } = Input;

const InvitationCodeManagement: React.FC = () => {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch invitation codes from Supabase
  const fetchInvitationCodes = async () => {
    try {
      setLoading(true);
      const data = await InvitationCodeService.getInvitationCodes(searchQuery);
      setCodes(data);
    } catch (error: any) {
      message.error(`获取邀请码失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate new invitation code
  const handleGenerateInvitationCode = async () => {
    try {
      setLoading(true);
      await InvitationCodeService.generateInvitationCode();
      message.success('邀请码生成成功');
      fetchInvitationCodes(); // Refresh the list
    } catch (error: any) {
      message.error(`生成邀请码失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete invitation code
  const handleDeleteInvitationCode = async (id: number) => {
    try {
      setLoading(true);
      await InvitationCodeService.deleteInvitationCode(id);
      message.success('邀请码删除成功');
      fetchInvitationCodes();
    } catch (error: any) {
      message.error(`删除邀请码失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Batch delete invitation codes
  const handleBatchDeleteInvitationCodes = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的邀请码');
      return;
    }
    
    try {
      setLoading(true);
      await InvitationCodeService.deleteMultipleInvitationCodes(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个邀请码`);
      setSelectedRowKeys([]);
      fetchInvitationCodes();
    } catch (error: any) {
      message.error(`批量删除邀请码失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSendInvitationCodes = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要发送的邀请码');
      return;
    }
    
    try {
      setLoading(true);
      await InvitationCodeService.batchSendInvitationCodes(selectedRowKeys as number[]);
      message.success(`成功发送 ${selectedRowKeys.length} 个邀请码`);
      setSelectedRowKeys([]);
      fetchInvitationCodes();
    } catch (error: any) {
      message.error(`批量发送邀请码失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Copy invitation code to clipboard
  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        message.success('邀请码已复制到剪贴板');
      })
      .catch(err => {
        message.error('复制失败，请手动复制');
        console.error('复制失败:', err);
      });
  };
  
  // Batch copy invitation codes to clipboard
  const batchCopyInvitationCodes = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要复制的邀请码');
      return;
    }
    
    const selectedCodes = codes
      .filter(code => selectedRowKeys.includes(code.id))
      .map(code => code.invitation_code)
      .join('\n');
      
    navigator.clipboard.writeText(selectedCodes)
      .then(() => {
        message.success(`已复制 ${selectedRowKeys.length} 个邀请码到剪贴板`);
      })
      .catch(err => {
        message.error('批量复制失败，请手动复制');
        console.error('批量复制失败:', err);
      });
  };
  
  useEffect(() => {
    fetchInvitationCodes();
  }, [searchQuery]);
  
  const columns = [
    {
      title: '邀请码',
      dataIndex: 'invitation_code',
      key: 'invitation_code',
      render: (text: string) => (
        <Space>
          {text}
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => copyInvitationCode(text)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        let badgeStatus: 'success' | 'processing' | 'default';
        let text: string;
        
        if (status === 1) {
          badgeStatus = 'success';
          text = '可用';
        } else if (status === 2) {
          badgeStatus = 'processing';
          text = '已发送';
        } else {
          badgeStatus = 'default';
          text = '已使用';
        }
        
        return <Badge status={badgeStatus} text={text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '使用时间',
      dataIndex: 'used_at',
      key: 'used_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '关联用户',
      dataIndex: 'related_login_name',
      key: 'related_login_name',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InvitationCode) => (
        <Space size="middle">
          <Popconfirm
            title="确定要删除这个邀请码吗？"
            onConfirm={() => handleDeleteInvitationCode(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              disabled={record.status !== 1}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: InvitationCode) => ({
      disabled: record.status !== 1,
    }),
  };
  
  return (
    <Card title={<Title level={4}>邀请码管理</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleGenerateInvitationCode}
          >
            生成邀请码
          </Button>
          <Button 
            type="primary"
            icon={<SendOutlined />}
            onClick={handleBatchSendInvitationCodes}
            disabled={selectedRowKeys.length === 0}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            批量发送邀请码
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchInvitationCodes()}
          >
            刷新邀请码
          </Button>
          <Popconfirm
            title="确定要删除选中的邀请码吗？"
            onConfirm={handleBatchDeleteInvitationCodes}
            okText="确定"
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              disabled={selectedRowKeys.length === 0}
            >
              删除邀请码
            </Button>
          </Popconfirm>
          <Button 
            icon={<CopyOutlined />} 
            onClick={batchCopyInvitationCodes}
            disabled={selectedRowKeys.length === 0}
          >
            批量复制邀请码
          </Button>
          <Search
            placeholder="搜索邀请码或关联用户"
            allowClear
            onSearch={(value: string) => setSearchQuery(value)}
            style={{ width: 250 }}
          />
        </Space>
        
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={codes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </Card>
  );
};

export default InvitationCodeManagement;
