/**
 * pages/Login.jsx
 * 极简登录页：左侧几何装饰 + 右侧居中卡片
 *
 * 几何装饰：渐变光晕 + 同心圆 + 浮动的「评」字
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Tabs, App as AntApp } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';

import { useAuth } from '../context/AuthContext.jsx';
import { palette } from '../theme.js';
import BrandMark from '../components/BrandMark.jsx';
import useResponsive from '../hooks/useResponsive.js';

export default function Login() {
  const { login } = useAuth();
  const { message } = AntApp.useApp();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values);
    } catch (e) {
      message.error(e.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...styles.page,
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
    }}>
      {/* 左侧：装饰（移动端压缩到顶部 banner） */}
      {isMobile ? (
        <div style={styles.mobileDecor}>
          <MobileDecorCanvas />
          <div style={styles.mobileQuote}>
            「三人行，必有我师焉」
          </div>
        </div>
      ) : (
        <div style={styles.decor}>
          <DecorCanvas />
          <div style={styles.decorQuote}>
            <div style={styles.quoteZh}>「三人行，必有我师焉」</div>
            <div style={styles.quoteEn}>— 孔子 · 论语</div>
          </div>
        </div>
      )}

      {/* 右侧：登录卡 */}
      <div style={{
        ...styles.right,
        padding: isMobile ? '0 20px 40px' : 40,
        alignItems: isMobile ? 'stretch' : 'center',
        paddingTop: isMobile ? 24 : 40,
        minHeight: isMobile ? undefined : '100vh'
      }}>
        <div style={{
          ...styles.card,
          padding: isMobile ? '28px 22px' : '40px 36px 32px',
          boxShadow: isMobile
            ? 'none'
            : '0 1px 3px rgba(26,26,26,0.05), 0 12px 40px rgba(26,26,26,0.06)',
          border: isMobile ? 'none' : `1px solid ${palette.line}`
        }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <BrandMark />
          </div>

          <h1 style={styles.title}>欢迎回来</h1>
          <p style={styles.subtitle}>登录后开始今天的评审</p>

          <Tabs
            activeKey={role}
            onChange={setRole}
            centered
            items={[
              { key: 'student', label: '学生登录' },
              { key: 'teacher', label: '教师登录' }
            ]}
            style={{ marginBottom: 20 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ username: '', password: '' }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: palette.mute }} />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: palette.mute }} />}
                placeholder="密码"
                autoComplete="current-password"
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
              登录
            </Button>
          </Form>

          <div style={styles.footer}>
            还没有账号？
            <Link to="/register" style={{ color: palette.primary, fontWeight: 500 }}>
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 左侧装饰画布 ---------- */
function DecorCanvas() {
  return (
    <svg
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        <radialGradient id="g1" cx="30%" cy="20%" r="80%">
          <stop offset="0%"  stopColor={palette.primary} stopOpacity="0.18" />
          <stop offset="60%" stopColor={palette.primary} stopOpacity="0.04" />
          <stop offset="100%" stopColor={palette.paper} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g2" cx="80%" cy="90%" r="60%">
          <stop offset="0%"  stopColor={palette.accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={palette.paper} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="800" fill="url(#g1)" />
      <rect width="600" height="800" fill="url(#g2)" />

      {/* 同心圆 - 暗示「多视角」 */}
      <g fill="none" stroke={palette.primary} strokeWidth="1.2" opacity="0.4">
        <circle cx="180" cy="280" r="80" />
        <circle cx="180" cy="280" r="140" />
        <circle cx="180" cy="280" r="200" />
      </g>
      <circle cx="180" cy="280" r="6" fill={palette.primary} />

      {/* 浮动色块 */}
      <rect x="420" y="480" width="120" height="120" rx="22" fill={palette.accent} opacity="0.85" transform="rotate(12 480 540)" />
      <rect x="380" y="540" width="60"  height="60"  rx="14" fill={palette.primary} opacity="0.7" transform="rotate(-8 410 570)" />

      {/* 抽象线条 */}
      <path
        d="M 60 640 Q 200 580 320 660 T 560 600"
        stroke={palette.primary}
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />

      {/* 大字 */}
      <text
        x="380" y="200"
        fontFamily="Instrument Serif, serif"
        fontSize="180"
        fill={palette.primary}
        opacity="0.1"
      >
        评
      </text>
    </svg>
  );
}

/* ---------- 移动端装饰：顶部 banner，比例缩小 ---------- */
function MobileDecorCanvas() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden
    >
      <defs>
        <radialGradient id="mG1" cx="20%" cy="30%" r="80%">
          <stop offset="0%"  stopColor={palette.primary} stopOpacity="0.20" />
          <stop offset="100%" stopColor={palette.paperWarm} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mG2" cx="90%" cy="100%" r="60%">
          <stop offset="0%"  stopColor={palette.accent} stopOpacity="0.14" />
          <stop offset="100%" stopColor={palette.paperWarm} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="url(#mG1)" />
      <rect width="400" height="220" fill="url(#mG2)" />

      {/* 同心圆（缩小到左上） */}
      <g fill="none" stroke={palette.primary} strokeWidth="1" opacity="0.4">
        <circle cx="80" cy="90" r="36" />
        <circle cx="80" cy="90" r="64" />
        <circle cx="80" cy="90" r="92" />
      </g>
      <circle cx="80" cy="90" r="4" fill={palette.primary} />

      {/* 浮动色块（右下） */}
      <rect x="270" y="120" width="64" height="64" rx="14" fill={palette.accent} opacity="0.85" transform="rotate(12 302 152)" />
      <rect x="250" y="150" width="34" height="34" rx="8"  fill={palette.primary} opacity="0.7" transform="rotate(-8 267 167)" />

      {/* 大字"评"（右上） */}
      <text
        x="250" y="80"
        fontFamily="Instrument Serif, serif"
        fontSize="90"
        fill={palette.primary}
        opacity="0.10"
      >评</text>

      {/* 抽象线条 */}
      <path
        d="M 20 180 Q 100 150 180 190 T 360 170"
        stroke={palette.primary}
        strokeWidth="1.2"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    background: palette.paper
  },
  mobileDecor: {
    position: 'relative',
    width: '100%',
    height: 220,
    background: palette.paperWarm,
    overflow: 'hidden',
    borderBottom: `1px solid ${palette.line}`,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0 16px 14px'
  },
  mobileQuote: {
    position: 'relative',
    zIndex: 1,
    color: palette.ink,
    fontFamily: 'Instrument Serif, serif',
    fontSize: 16,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  decor: {
    position: 'relative',
    background: palette.paperWarm,
    borderRight: `1px solid ${palette.line}`,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    padding: 48
  },
  decorQuote: {
    position: 'relative',
    zIndex: 1,
    color: palette.ink
  },
  quoteZh: {
    fontFamily: 'Instrument Serif, serif',
    fontSize: 30,
    fontStyle: 'italic',
    marginBottom: 8
  },
  quoteEn: { color: palette.mute, fontSize: 13, letterSpacing: 1 },
  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: palette.surface,
    borderRadius: 16,
    padding: '40px 36px 32px',
    boxShadow: '0 1px 3px rgba(26,26,26,0.05), 0 12px 40px rgba(26,26,26,0.06)',
    border: `1px solid ${palette.line}`
  },
  title: {
    fontFamily: 'Instrument Serif, serif',
    fontSize: 32,
    fontWeight: 400,
    color: palette.ink,
    margin: 0,
    textAlign: 'center'
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
