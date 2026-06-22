/**
 * components/AppLayout.jsx
 * 顶部导航 + 内容区（响应式）
 * - 桌面：横向布局
 * - 移动端：导航项折叠到 Drawer 抽屉，Header 简化为品牌+汉堡+用户菜单
 */

import { useState } from 'react';
import { Layout, Avatar, Dropdown, Space, Tag, Drawer, Button } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  MenuOutlined,
  BookOutlined,
  TeamOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { palette } from '../theme.js';
import useResponsive from '../hooks/useResponsive.js';
import BrandMark from './BrandMark.jsx';

const { Header, Content } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isMobile } = useResponsive();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const isTeacher = user.role === 'teacher';
  const go = (path) => { navigate(path); setDrawerOpen(false); };

  // 学生导航项
  const navItems = isTeacher ? [] : [
    { key: '/student',           label: '待评作业', icon: <AppstoreOutlined /> },
    { key: '/student/assignments', label: '我的作业', icon: <BookOutlined /> },
    { key: '/student/join',      label: '加入班级', icon: <TeamOutlined /> }
  ];

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true }
    ],
    onClick: ({ key }) => { if (key === 'logout') logout(); }
  };

  // 移动端 Header 高度稍小
  const headerHeight = isMobile ? 56 : 64;
  const headerPadding = isMobile ? '0 16px' : '0 40px';
  const contentPadding = isMobile ? '20px 16px 60px' : '40px 40px 80px';

  return (
    <Layout style={{ minHeight: '100vh', background: palette.paper }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${palette.line}`,
          padding: headerPadding,
          height: headerHeight
        }}
      >
        {/* 左：品牌 + (移动端) 汉堡按钮 */}
        <Space size={12}>
          {!isTeacher && isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ width: 36, height: 36, padding: 0 }}
              aria-label="打开菜单"
            />
          )}
          <div
            onClick={() => navigate(isTeacher ? '/teacher' : '/student')}
            style={{ cursor: 'pointer' }}
          >
            <BrandMark compact={isMobile} />
          </div>
        </Space>

        {/* 中/右：桌面端直接显示导航，移动端只显示用户菜单 */}
        {!isMobile && (
          <Space size="large">
            {!isTeacher && navItems.map((it) => (
              <a
                key={it.key}
                onClick={() => go(it.key)}
                style={{
                  color: (pathname === it.key ||
                          (it.key !== '/student' && pathname.includes(it.key)))
                          ? palette.primary : palette.inkSoft,
                  fontWeight: 500
                }}
              >
                <span style={{ marginRight: 6 }}>{it.icon}</span>
                {it.label}
              </a>
            ))}
          </Space>
        )}

        {/* 右：用户菜单（移动端只显示头像） */}
        <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }} size={8}>
            <Avatar
              size={isMobile ? 28 : 32}
              style={{ background: palette.primarySoft, color: palette.primary }}
              icon={<UserOutlined />}
            />
            {!isMobile && (
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: palette.ink }}>
                  {user.real_name || user.username}
                </div>
                <Tag
                  color={isTeacher ? 'geekblue' : 'green'}
                  style={{ margin: 0, fontSize: 11, lineHeight: '16px', padding: '0 6px' }}
                >
                  {isTeacher ? '教师' : '学生'}
                </Tag>
              </div>
            )}
          </Space>
        </Dropdown>
      </Header>

      {/* 移动端：抽屉式导航 */}
      {!isTeacher && (
        <Drawer
          title={
            <Space>
              <Avatar
                size={28}
                style={{ background: palette.primarySoft, color: palette.primary }}
                icon={<UserOutlined />}
              />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, color: palette.ink }}>
                  {user.real_name || user.username}
                </div>
                <Tag color="green" style={{ margin: 0, fontSize: 11, lineHeight: '16px', padding: '0 6px' }}>
                  学生
                </Tag>
              </div>
            </Space>
          }
          placement="left"
          width={280}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          closeIcon={<CloseOutlined />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((it) => {
              const active = pathname === it.key ||
                             (it.key !== '/student' && pathname.includes(it.key));
              return (
                <div
                  key={it.key}
                  onClick={() => go(it.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    color: active ? palette.primary : palette.ink,
                    background: active ? palette.primarySoft : 'transparent',
                    fontWeight: active ? 600 : 500,
                    fontSize: 15,
                    transition: 'background 160ms'
                  }}
                >
                  <span style={{ fontSize: 18 }}>{it.icon}</span>
                  {it.label}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: 'absolute',
              left: 16, right: 16, bottom: 24,
              padding: '12px 14px',
              borderTop: `1px solid ${palette.lineSoft}`,
              color: palette.mute,
              fontSize: 12
            }}
          >
            点击菜单切换页面
          </div>
        </Drawer>
      )}

      {/* 移动端：Header 下加一个紧凑装饰条（呼应桌面端右侧大装饰） */}
      {isMobile && (
        <div
          aria-hidden
          style={{
            position: 'relative',
            height: 80,
            margin: '0 16px 12px',
            borderRadius: 12,
            overflow: 'hidden',
            background: palette.paperWarm,
            border: `1px solid ${palette.line}`
          }}
        >
          <svg
            viewBox="0 0 400 80"
            preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <radialGradient id="mbG1" cx="20%" cy="50%" r="70%">
                <stop offset="0%"  stopColor={palette.primary} stopOpacity="0.18" />
                <stop offset="100%" stopColor={palette.paperWarm} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="mbG2" cx="95%" cy="100%" r="60%">
                <stop offset="0%"  stopColor={palette.accent} stopOpacity="0.16" />
                <stop offset="100%" stopColor={palette.paperWarm} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="400" height="80" fill="url(#mbG1)" />
            <rect width="400" height="80" fill="url(#mbG2)" />
            {/* 缩小版同心圆 */}
            <g fill="none" stroke={palette.primary} strokeWidth="1" opacity="0.45">
              <circle cx="60" cy="40" r="14" />
              <circle cx="60" cy="40" r="24" />
              <circle cx="60" cy="40" r="34" />
            </g>
            <circle cx="60" cy="40" r="2.5" fill={palette.primary} />
            {/* 色块 */}
            <rect x="300" y="22" width="38" height="38" rx="9" fill={palette.accent} opacity="0.85" transform="rotate(10 319 41)" />
            <rect x="280" y="40" width="20" height="20" rx="5" fill={palette.primary} opacity="0.7" transform="rotate(-8 290 50)" />
            {/* 大字"评" */}
            <text x="240" y="58" fontFamily="Instrument Serif, serif" fontSize="48" fill={palette.primary} opacity="0.10">评</text>
          </svg>
        </div>
      )}

      <Content
        style={{
          padding: contentPadding,
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* 桌面端装饰：呼应 Login 的同心圆 + 大字"评" + 色块（绝对定位，不影响布局） */}
        {!isMobile && (
          <svg
            viewBox="0 0 1280 360"
            preserveAspectRatio="xMaxYMin slice"
            style={{
              position: 'absolute', top: -40, right: -40,
              width: 520, height: 360,
              pointerEvents: 'none', zIndex: 0,
              opacity: 0.9
            }}
            aria-hidden
          >
            <defs>
              <radialGradient id="hdrG1" cx="80%" cy="20%" r="70%">
                <stop offset="0%"  stopColor={palette.primary} stopOpacity="0.10" />
                <stop offset="100%" stopColor={palette.paper} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hdrG2" cx="20%" cy="100%" r="60%">
                <stop offset="0%"  stopColor={palette.accent} stopOpacity="0.08" />
                <stop offset="100%" stopColor={palette.paper} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1280" height="360" fill="url(#hdrG1)" />
            <rect width="1280" height="360" fill="url(#hdrG2)" />
            {/* 同心圆 */}
            <g fill="none" stroke={palette.primary} strokeWidth="1" opacity="0.35">
              <circle cx="1080" cy="120" r="50" />
              <circle cx="1080" cy="120" r="90" />
              <circle cx="1080" cy="120" r="130" />
            </g>
            <circle cx="1080" cy="120" r="5" fill={palette.primary} />
            {/* 浮动色块 */}
            <rect x="940"  y="240" width="64" height="64" rx="14" fill={palette.accent} opacity="0.18" transform="rotate(10 972 272)" />
            <rect x="1140" y="60"  width="36" height="36" rx="8"  fill={palette.primary} opacity="0.15" transform="rotate(-12 1158 78)" />
            {/* 大字"评" */}
            <text
              x="1000" y="280"
              fontFamily="Instrument Serif, serif"
              fontSize="180"
              fill={palette.primary}
              opacity="0.06"
            >评</text>
          </svg>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
