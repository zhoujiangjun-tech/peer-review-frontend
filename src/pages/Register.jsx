/**
 * pages/Register.jsx
 * 注册：选择角色 + 用户名 / 密码 / 姓名
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Radio, App as AntApp } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';

import { useAuth } from '../context/AuthContext.jsx';
import { palette } from '../theme.js';
import BrandMark from '../components/BrandMark.jsx';
import useResponsive from '../hooks/useResponsive.js';

export default function Register() {
  const { register } = useAuth();
  const { message } = AntApp.useApp();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register(values);
    } catch (e) {
      message.error(e.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...styles.page,
      padding: isMobile ? 16 : 24,
      alignItems: isMobile ? 'flex-start' : 'center',
      paddingTop: isMobile ? 40 : 24
    }}>
      <div style={{
        ...styles.card,
        padding: isMobile ? '24px 18px' : '40px 36px 32px',
        boxShadow: isMobile
          ? 'none'
          : '0 1px 3px rgba(26,26,26,0.05), 0 12px 40px rgba(26,26,26,0.06)',
        border: isMobile ? 'none' : `1px solid ${palette.line}`
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BrandMark />
        </div>

        <h1 style={styles.title}>创建账号</h1>
        <p style={styles.subtitle}>加入 Peer Review，开启互评新体验</p>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ role: 'student' }}
        >
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true }]}
          >
            <Radio.Group buttonStyle="solid" size="large" style={{ width: '100%' }}>
              <Radio.Button value="student" style={{ width: '50%', textAlign: 'center' }}>
                学生
              </Radio.Button>
              <Radio.Button value="teacher" style={{ width: '50%', textAlign: 'center' }}>
                教师
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '至少 2 个字符' },
              { max: 20, message: '最多 20 个字符' }
            ]}
          >
            <Input size="large" prefix={<UserOutlined style={{ color: palette.mute }} />} placeholder="登录用户名" />
          </Form.Item>

          <Form.Item
            name="real_name"
            label="姓名"
          >
            <Input size="large" prefix={<IdcardOutlined style={{ color: palette.mute }} />} placeholder="真实姓名（可选）" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '至少 6 位' }
            ]}
          >
            <Input.Password size="large" prefix={<LockOutlined style={{ color: palette.mute }} />} placeholder="至少 6 位" />
          </Form.Item>

          <Button
            type="primary"
            size="large"
            htmlType="submit"
            block
            loading={loading}
            style={{ marginTop: 8 }}
          >
            创建账号
          </Button>
        </Form>

        <div style={styles.footer}>
          已有账号？
          <Link to="/login" style={{ color: palette.primary, fontWeight: 500 }}>前往登录</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.paper,
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: palette.surface,
    borderRadius: 16,
    padding: '40px 36px 32px',
    boxShadow: '0 1px 3px rgba(26,26,26,0.05), 0 12px 40px rgba(26,26,26,0.06)',
    border: `1px solid ${palette.line}`
  },
  title: {
    fontFamily: 'Instrument Serif, serif',
    fontSize: 30,
    color: palette.ink,
    margin: 0,
    textAlign: 'center',
    fontWeight: 400
  },
  subtitle: {
    textAlign: 'center',
    color: palette.mute,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 28
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    color: palette.mute,
    fontSize: 13
  }
};
