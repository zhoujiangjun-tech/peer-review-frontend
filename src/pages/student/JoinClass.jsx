/**
 * pages/student/JoinClass.jsx
 * 学生：用邀请码加入班级
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, App as AntApp, Card } from 'antd';
import { TeamOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import { classApi } from '../../api/index.js';
import { palette } from '../../theme.js';
import useResponsive from '../../hooks/useResponsive.js';

export default function JoinClass() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await classApi.join({
        invite_code: values.invite_code.trim().toUpperCase(),
        student_no: values.student_no.trim()
      });
      message.success('加入成功');
      navigate('/student/assignments', { replace: true });
    } catch (e) {
      message.error(e.response?.data?.error || '加入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: isMobile ? 14 : 20, color: palette.inkSoft, paddingLeft: 0 }}
      >
        返回
      </Button>

      <Card bordered style={{ borderRadius: 14, border: `1px solid ${palette.line}`, padding: isMobile ? '8px 4px' : 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56, height: 56,
              borderRadius: 28,
              background: palette.primarySoft,
              color: palette.primary,
              fontSize: 26,
              marginBottom: 12
            }}
          >
            <TeamOutlined />
          </div>
          <h1 style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 30, color: palette.ink, margin: 0, fontWeight: 400
          }}>
            加入班级
          </h1>
          <p style={{ color: palette.mute, fontSize: 14, marginTop: 6 }}>
            输入老师分享的邀请码和你的学号
          </p>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 8 }}>
          <Form.Item
            name="invite_code"
            label="邀请码"
            rules={[
              { required: true, message: '请输入邀请码' },
              { min: 6, message: '邀请码至少 6 位' }
            ]}
          >
            <Input
              size="large"
              placeholder="如：AB12CD34"
              style={{
                fontFamily: 'Manrope, monospace',
                letterSpacing: 4,
                textTransform: 'uppercase',
                fontSize: 18
              }}
              maxLength={12}
            />
          </Form.Item>
          <Form.Item
            name="student_no"
            label="学号"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input
              size="large"
              placeholder="如：S001"
              style={{ fontFamily: 'Manrope, monospace' }}
            />
          </Form.Item>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            block
            loading={loading}
            style={{ marginTop: 4 }}
          >
            加入
          </Button>
        </Form>
      </Card>
    </div>
  );
}
