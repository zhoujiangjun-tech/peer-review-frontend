/**
 * pages/student/StudentHome.jsx
 * 学生首页：聚合所有「评审中」作业的待评任务
 *
 *   - 顶部大标题 + 完成进度小卡片
 *   - 3 卡片网格（每份作业 1 个分组卡片）
 *   - 卡片：作业标题 + 3 个匿名小卡 + 进度
 *   - hover 上浮
 */

import { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Button, Spin, App as AntApp, Progress } from 'antd';
import { ArrowRightOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { assignmentApi, reviewApi } from '../../api/index.js';
import { palette } from '../../theme.js';
import EmptyState from '../../components/EmptyState.jsx';
import useResponsive from '../../hooks/useResponsive.js';

export default function StudentHome() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  // { assignmentId, title, tasks: [...] }
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { assignments } = await assignmentApi.list();
        const reviewing = assignments.filter((a) => a.status === 'reviewing');
        const results = await Promise.all(
          reviewing.map(async (a) => {
            const { tasks } = await reviewApi.myTasks(a.id);
            return { assignmentId: a.id, title: a.title, tasks };
          })
        );
        // 只保留有待评任务的作业
        setGroups(results.filter((g) => g.tasks.length > 0));
      } catch (e) {
        message.error('加载待评列表失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [message]);

  const totals = useMemo(() => {
    const all = groups.flatMap((g) => g.tasks);
    const done = all.filter((t) => t.completed).length;
    return { total: all.length, done, rate: all.length ? done / all.length : 0 };
  }, [groups]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 标题区 */}
      <div style={{
        ...styles.header,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-end',
        gap: isMobile ? 16 : 0,
        marginBottom: isMobile ? 24 : 40,
        position: 'relative'
      }}>
        {/* 桌面端 Hero 装饰 */}
        {!isMobile && (
          <svg
            viewBox="0 0 200 120"
            style={{ position: 'absolute', right: 320, top: -10, width: 180, height: 110, pointerEvents: 'none' }}
            aria-hidden
          >
            <defs>
              <radialGradient id="sHeroG" cx="80%" cy="50%" r="60%">
                <stop offset="0%" stopColor={palette.accent} stopOpacity="0.14" />
                <stop offset="100%" stopColor={palette.paper} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="200" height="120" fill="url(#sHeroG)" />
            <g fill="none" stroke={palette.primary} strokeWidth="1" opacity="0.35">
              <circle cx="160" cy="60" r="22" />
              <circle cx="160" cy="60" r="40" />
              <circle cx="160" cy="60" r="58" />
            </g>
            <circle cx="160" cy="60" r="3" fill={palette.primary} />
            <rect x="100" y="80" width="22" height="22" rx="6" fill={palette.primary} opacity="0.22" transform="rotate(-10 111 91)" />
            <text x="80" y="100" fontFamily="Instrument Serif, serif" fontSize="72" fill={palette.accent} opacity="0.10">评</text>
          </svg>
        )}
        <div>
          <h1 style={{ ...styles.title, fontSize: isMobile ? 26 : 36 }}>待评作业</h1>
          <p style={styles.subtitle}>
            {totals.total === 0
              ? '今日无事，悠闲时光'
              : `共 ${totals.total} 份待评，已完成 ${totals.done} 份`}
          </p>
        </div>
        {totals.total > 0 && (
          <Card style={styles.statCard} bordered={false}>
            <div style={styles.statLabel}>总体完成度</div>
            <Progress
              percent={Math.round(totals.rate * 100)}
              strokeColor={palette.primary}
              trailColor={palette.lineSoft}
              style={{ marginBottom: 4 }}
            />
            <div style={styles.statSub}>
              {totals.done} / {totals.total}
            </div>
          </Card>
        )}
      </div>

      {/* 空状态 */}
      {groups.length === 0 && (
        <EmptyState
          title="还没有待评作业"
          description="去喝杯咖啡吧，等老师分发新任务 ☕"
        />
      )}

      {/* 分组卡片 */}
      {groups.map((g) => (
        <div key={g.assignmentId} style={{ marginBottom: 40 }}>
          <div style={styles.groupHeader}>
            <FileTextOutlined style={{ color: palette.primary, marginRight: 8 }} />
            <span style={styles.groupTitle}>{g.title}</span>
            <span style={styles.groupMeta}>
              {g.tasks.filter((t) => t.completed).length} / {g.tasks.length} 已完成
            </span>
          </div>

          <Row gutter={[20, 20]}>
            {g.tasks.map((task, idx) => (
              <Col key={task.task_id} xs={24} sm={12} md={8}>
                <ReviewCard task={task} index={idx} onClick={() => {
                  if (task.completed) {
                    message.info('已评过这份作业，可查看他人对你的反馈');
                  } else {
                    navigate(`/student/review/${task.task_id}`);
                  }
                }} />
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
}

/* ---------- 单张待评卡 ---------- */
function ReviewCard({ task, index, onClick }) {
  const done = task.completed;
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.reviewCard,
        cursor: 'pointer',
        background: done ? palette.paperWarm : palette.surface
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,26,26,0.08)';
        e.currentTarget.style.borderColor = done ? palette.line : palette.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(26,26,26,0.04), 0 4px 12px rgba(26,26,26,0.04)';
        e.currentTarget.style.borderColor = palette.line;
      }}
    >
      {/* 序号 / 状态小角标 */}
      <div style={styles.cardIndex}>#{String(index + 1).padStart(2, '0')}</div>

      <div style={styles.anonLabel}>ANONYMOUS</div>
      <div style={styles.anonId}>{task.anonymous_id}</div>

      <div style={styles.cardFooter}>
        {done ? (
          <span style={{ color: palette.success, fontSize: 13, fontWeight: 500 }}>
            ✓ 已评 · {task.score} 分
          </span>
        ) : (
          <span style={{ color: palette.mute, fontSize: 13 }}>点击开始评审</span>
        )}
        <ArrowRightOutlined style={{ color: done ? palette.success : palette.primary }} />
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 40
  },
  title: {
    fontFamily: 'Instrument Serif, serif',
    fontSize: 36,
    color: palette.ink,
    margin: 0,
    fontWeight: 400
  },
  subtitle: { color: palette.mute, fontSize: 14, marginTop: 4 },
  statCard: {
    background: palette.surface,
    border: `1px solid ${palette.line}`,
    borderRadius: 12,
    padding: '16px 22px',
    minWidth: 220,
    boxShadow: '0 1px 2px rgba(26,26,26,0.04)'
  },
  statLabel: { color: palette.mute, fontSize: 12, marginBottom: 8, letterSpacing: 1 },
  statSub: { color: palette.ink, fontSize: 13, fontWeight: 600, textAlign: 'right' },

  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid ${palette.line}`
  },
  groupTitle: { fontSize: 16, fontWeight: 600, color: palette.ink },
  groupMeta: { marginLeft: 'auto', color: palette.mute, fontSize: 13 },

  reviewCard: {
    position: 'relative',
    border: `1px solid ${palette.line}`,
    borderRadius: 14,
    padding: '24px 22px 20px',
    transition: 'all 220ms ease-out',
    boxShadow: '0 1px 2px rgba(26,26,26,0.04), 0 4px 12px rgba(26,26,26,0.04)',
    height: '100%'
  },
  cardIndex: {
    position: 'absolute', top: 14, right: 16,
    fontSize: 11, color: palette.mute, letterSpacing: 1
  },
  anonLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: palette.mute,
    marginBottom: 6
  },
  anonId: {
    fontFamily: 'Instrument Serif, serif',
    fontSize: 32,
    color: palette.ink,
    marginBottom: 20
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTop: `1px solid ${palette.lineSoft}`
  }
};
