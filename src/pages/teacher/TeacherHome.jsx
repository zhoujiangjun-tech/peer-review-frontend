/**
 * pages/teacher/TeacherHome.jsx
 * 教师管理主页：左侧 = 班级侧栏，右侧 = 当前班级详情 + 作业列表
 *
 * 字段约定（与后端 routes/* 保持一致）：
 *   class:   class_name / invite_code
 *   assignment: class_id / title / description / submit_deadline / status
 */

import { useEffect, useState } from 'react';
import {
  Layout, Button, Modal, Form, Input, App as AntApp, Spin,
  Collapse, Tag, Empty, List, InputNumber, DatePicker, Space, Upload, Drawer, Tooltip
} from 'antd';
import { PlusOutlined, TeamOutlined, FileTextOutlined, RightOutlined, PaperClipOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { classApi, assignmentApi } from '../../api/index.js';
import { palette } from '../../theme.js';
import useResponsive from '../../hooks/useResponsive.js';
import StatusTag from '../../components/StatusTag.jsx';

const { Sider, Content } = Layout;
const { Dragger } = Upload;

export default function TeacherHome() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [siderDrawerOpen, setSiderDrawerOpen] = useState(false);

  const [classOpen, setClassOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [classForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [classSubmitting, setClassSubmitting] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { classes: cs } = await classApi.list();
      setClasses(cs);
      if (cs.length > 0 && !activeClassId) setActiveClassId(cs[0].id);
    } catch {
      message.error('加载班级失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClasses(); /* eslint-disable-next-line */ }, []);

  // 当前班级下的作业
  useEffect(() => {
    if (!activeClassId) { setAssignments([]); return; }
    (async () => {
      try {
        const { assignments: a } = await assignmentApi.list();
        setAssignments(a.filter((x) => x.class_id === activeClassId));
      } catch {
        message.error('加载作业失败');
      }
    })();
  }, [activeClassId, message]);

  const onCreateClass = async (values) => {
    setClassSubmitting(true);
    try {
      await classApi.create({ class_name: values.class_name });
      message.success('班级创建成功');
      setClassOpen(false);
      classForm.resetFields();
      await loadClasses();
    } catch (e) {
      message.error(e.response?.data?.error || '创建失败');
    } finally {
      setClassSubmitting(false);
    }
  };

  const onCreateAssign = async (values) => {
    if (!activeClassId) {
      message.warning('请先选择班级');
      return;
    }
    setAssignSubmitting(true);
    try {
      const submit_deadline = values.submit_deadline ? values.submit_deadline.toISOString() : null;
      const review_deadline = values.review_deadline ? values.review_deadline.toISOString() : null;
      await assignmentApi.create({
        class_id: activeClassId,
        title: values.title,
        description: values.description || null,
        submit_deadline,
        review_deadline,
        attachment: attachmentFile || undefined
      });
      message.success(attachmentFile ? '作业发布成功（已含附件）' : '作业发布成功');
      setAssignOpen(false);
      assignForm.resetFields();
      setAttachmentFile(null);
      // 重新拉取
      const { assignments: a } = await assignmentApi.list();
      setAssignments(a.filter((x) => x.class_id === activeClassId));
    } catch (e) {
      message.error(e.response?.data?.error || '发布失败');
    } finally {
      setAssignSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{
        ...styles.head,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-end',
        gap: isMobile ? 12 : 0,
        position: 'relative'
      }}>
        {/* 桌面端 Hero 装饰：同心圆 + 大字"师" + 色块（仅桌面端） */}
        {!isMobile && (
          <svg
            viewBox="0 0 200 120"
            style={{ position: 'absolute', right: 0, top: -10, width: 180, height: 110, pointerEvents: 'none' }}
            aria-hidden
          >
            <defs>
              <radialGradient id="tHeroG" cx="80%" cy="50%" r="60%">
                <stop offset="0%" stopColor={palette.primary} stopOpacity="0.14" />
                <stop offset="100%" stopColor={palette.paper} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="200" height="120" fill="url(#tHeroG)" />
            <g fill="none" stroke={palette.primary} strokeWidth="1" opacity="0.35">
              <circle cx="160" cy="60" r="22" />
              <circle cx="160" cy="60" r="40" />
              <circle cx="160" cy="60" r="58" />
            </g>
            <circle cx="160" cy="60" r="3" fill={palette.primary} />
            <rect x="100" y="80" width="22" height="22" rx="6" fill={palette.accent} opacity="0.22" transform="rotate(10 111 91)" />
            <text x="80" y="100" fontFamily="Instrument Serif, serif" fontSize="72" fill={palette.primary} opacity="0.10">师</text>
          </svg>
        )}
        <div>
          <h1 style={{ ...styles.title, fontSize: isMobile ? 26 : 36 }}>教师工作台</h1>
          <p style={styles.subtitle}>管理你的班级和作业，跟踪互评进度</p>
        </div>
        <Space style={{ flexWrap: 'wrap' }}>
          {isMobile && classes.length > 0 && (
            <Button
              icon={<TeamOutlined />}
              onClick={() => setSiderDrawerOpen(true)}
            >
              班级列表（{classes.length}）
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setClassOpen(true)}
          >
            创建班级
          </Button>
        </Space>
      </div>

      <Layout style={{ background: 'transparent', marginTop: 24, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* 左侧：班级侧栏（桌面端直接显示 / 移动端通过 Drawer 打开） */}
        {!isMobile ? (
          <Sider width={300} style={styles.sider}>
            <div style={styles.siderTitle}>
              <TeamOutlined /> 我的班级
              <span style={styles.count}>{classes.length}</span>
            </div>
            <ClassSiderList
              classes={classes}
              activeClassId={activeClassId}
              setActiveClassId={setActiveClassId}
            />
          </Sider>
        ) : (
          <Drawer
            placement="left"
            width={280}
            open={siderDrawerOpen}
            onClose={() => setSiderDrawerOpen(false)}
            title={
              <Space>
                <TeamOutlined /> 我的班级
                <span style={styles.count}>{classes.length}</span>
              </Space>
            }
          >
            <ClassSiderList
              classes={classes}
              activeClassId={activeClassId}
              setActiveClassId={(id) => {
                setActiveClassId(id);
                setSiderDrawerOpen(false);
              }}
            />
          </Drawer>
        )}

        {/* 右侧：当前班级详情 */}
        <Content style={{
          ...styles.content,
          marginTop: isMobile ? 16 : 0,
          marginLeft: isMobile ? 0 : 24,
          padding: isMobile ? 16 : 28
        }}>
          {!activeClassId ? (
            isMobile ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Empty description="点击顶部「班级列表」选择班级" />
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={() => setSiderDrawerOpen(true)}
                  style={{ marginTop: 16 }}
                >
                  选择班级
                </Button>
              </div>
            ) : (
              <Empty description="请在左侧选择一个班级" />
            )
          ) : (
            <ClassPanel
              klass={classes.find((c) => c.id === activeClassId)}
              assignments={assignments}
              isMobile={isMobile}
              onCreateAssign={() => setAssignOpen(true)}
              onOpen={(id) => navigate(`/teacher/assignments/${id}`)}
            />
          )}
        </Content>
      </Layout>

      {/* 创建班级弹窗 */}
      <Modal
        title="创建新班级"
        open={classOpen}
        onCancel={() => setClassOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={classForm}
          layout="vertical"
          onFinish={onCreateClass}
          style={{ marginTop: 12 }}
        >
          <Form.Item name="class_name" label="班级名称" rules={[{ required: true }]}>
            <Input placeholder="如：2024计算机科学1班" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={classSubmitting} block>
            创建
          </Button>
        </Form>
      </Modal>

      {/* 发布作业弹窗 */}
      <Modal
        title="发布新作业"
        open={assignOpen}
        onCancel={() => { setAssignOpen(false); setAttachmentFile(null); }}
        footer={null}
        destroyOnClose
        width={isMobile ? '100%' : 560}
        style={isMobile ? { top: 0, paddingBottom: 0, maxWidth: '100vw' } : undefined}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={onCreateAssign}
          style={{ marginTop: 12 }}
          initialValues={{ submit_deadline: dayjs().add(7, 'day'), review_deadline: dayjs().add(10, 'day') }}
        >
          <Form.Item name="title" label="作业标题" rules={[{ required: true }]}>
            <Input placeholder="如：实验三 · 数据结构" />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <Input.TextArea rows={3} placeholder="作业要求、评分标准等" />
          </Form.Item>
          <Space
            size="middle"
            style={{ width: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}
          >
            <Form.Item name="submit_deadline" label="提交截止" style={{ flex: 1, width: '100%' }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="review_deadline" label="评审截止" style={{ flex: 1, width: '100%' }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item label="附件（可选，≤20MB）" style={{ marginBottom: 12 }}>
            <Dragger
              multiple={false}
              beforeUpload={(file) => {
                if (file.size > 20 * 1024 * 1024) {
                  message.error('附件不能超过 20MB');
                  return Upload.LIST_IGNORE;
                }
                setAttachmentFile(file);
                return false; // 阻止自动上传，发布时随表单一起提交
              }}
              onRemove={() => { setAttachmentFile(null); }}
              fileList={attachmentFile ? [{
                uid: '-1',
                name: attachmentFile.name,
                status: 'done',
                size: attachmentFile.size
              }] : []}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.rtf,.zip,.7z,.rar,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.js,.ts,.py,.java,.c,.cpp,.go,.rs,.rb,.php,.sh,.json,.xml,.yaml,.yml,.html,.css,.sql"
            >
              <p style={{ fontSize: 32, color: palette.inkSoft, margin: '4px 0' }}>
                <InboxOutlined />
              </p>
              <p style={{ color: palette.ink, margin: '4px 0', fontWeight: 500 }}>
                点击或拖拽文件到此处
              </p>
              <p style={{ color: palette.mute, fontSize: 12, margin: 0 }}>
                任务说明、参考资料、模板等，学生可在提交/评审时查看和下载
              </p>
            </Dragger>
            {attachmentFile && (
              <div style={{ marginTop: 6, color: palette.mute, fontSize: 12 }}>
                <PaperClipOutlined style={{ marginRight: 4 }} />
                {attachmentFile.name}（{(attachmentFile.size / 1024).toFixed(1)} KB）
              </div>
            )}
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={assignSubmitting} block>
            发布
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

function ClassSiderList({ classes, activeClassId, setActiveClassId }) {
  if (classes.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="还没有班级"
        style={{ marginTop: 40 }}
      />
    );
  }
  return (
    <Collapse
      ghost
      activeKey={String(activeClassId)}
      onChange={(k) => setActiveClassId(Number(k))}
      items={classes.map((c) => ({
        key: String(c.id),
        label: (
          <div style={styles.classItem}>
            <span style={styles.className}>{c.class_name}</span>
            <Tag style={{ margin: 0 }}>{c.invite_code}</Tag>
          </div>
        ),
        children: (
          <div style={{ padding: '4px 8px', color: palette.mute, fontSize: 12 }}>
            点击右侧查看该班级作业
          </div>
        )
      }))}
    />
  );
}

function ClassPanel({ klass, assignments, isMobile, onCreateAssign, onOpen }) {
  const kpiCols = isMobile
    ? 'repeat(2, 1fr)'
    : 'repeat(4, 1fr)';
  return (
    <div>
      <div style={{
        ...styles.panelHead,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: isMobile ? 12 : 0
      }}>
        <div>
          <h2 style={{ ...styles.panelTitle, fontSize: isMobile ? 18 : 24 }}>
            {klass.class_name}
          </h2>
          <div style={{ color: palette.mute, fontSize: 13, marginTop: 2, wordBreak: 'break-all' }}>
            邀请码 <Tag color="green" style={{ marginLeft: 4, fontWeight: 600 }}>{klass.invite_code}</Tag>
            <span style={{ marginLeft: 8, color: palette.mute }}>分享给学生加入</span>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateAssign}>
          发布作业
        </Button>
      </div>

      <div style={{ ...styles.kpiRow, gridTemplateColumns: kpiCols, gap: isMobile ? 10 : 16 }}>
        <Kpi label="作业数" value={assignments.length} />
        <Kpi
          label="评审中"
          value={assignments.filter((a) => a.status === 'reviewing').length}
        />
        <Kpi
          label="待提交"
          value={assignments.filter((a) => a.status === 'open').length}
        />
        <Kpi
          label="已截止"
          value={assignments.filter((a) => a.status === 'closed').length}
        />
      </div>

      <div style={styles.listWrap}>
        {assignments.length === 0 ? (
          <Empty description="还没有作业" />
        ) : (
          <List
            dataSource={assignments}
            renderItem={(a) => (
              <List.Item
                style={styles.listItem}
                onClick={() => onOpen(a.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={styles.itemTitle}>
                    {a.title}
                    {a.attachment_name && (
                      <Tooltip title={`附件：${a.attachment_name}`}>
                        <PaperClipOutlined style={{ marginLeft: 8, color: palette.primary, fontSize: 14 }} />
                      </Tooltip>
                    )}
                  </div>
                  <div style={styles.itemDesc}>
                    发布于 {dayjs(a.created_at).format('YYYY-MM-DD')}
                    {a.submit_deadline && ` · 提交截止 ${dayjs(a.submit_deadline).format('MM-DD')}`}
                  </div>
                </div>
                <StatusTag type="assignment" value={a.status} />
                <RightOutlined style={{ color: palette.mute, marginLeft: 16 }} />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

const styles = {
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontFamily: 'Instrument Serif, serif', fontSize: 36, color: palette.ink, margin: 0, fontWeight: 400 },
  subtitle: { color: palette.mute, fontSize: 14, marginTop: 4 },
  sider: {
    background: palette.surface,
    border: `1px solid ${palette.line}`,
    borderRadius: 14,
    padding: '20px 0',
    marginRight: 24,
    minHeight: 600
  },
  siderTitle: {
    padding: '0 20px 16px',
    fontSize: 12,
    color: palette.mute,
    letterSpacing: 2,
    textTransform: 'uppercase',
    borderBottom: `1px solid ${palette.lineSoft}`
  },
  count: { marginLeft: 8, color: palette.primary, fontWeight: 600 },
  classItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  className: { fontWeight: 600, color: palette.ink, fontSize: 14 },
  content: {
    background: palette.surface,
    border: `1px solid ${palette.line}`,
    borderRadius: 14,
    padding: 28
  },
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  panelTitle: { fontSize: 24, color: palette.ink, fontWeight: 600, margin: 0 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 },
  kpi: { background: palette.paperWarm, borderRadius: 10, padding: '14px 16px' },
  kpiLabel: { color: palette.mute, fontSize: 12, letterSpacing: 1 },
  kpiValue: { fontFamily: 'Instrument Serif, serif', fontSize: 32, color: palette.primary, marginTop: 4, fontVariantNumeric: 'tabular-nums' },
  listWrap: { marginTop: 24 },
  listItem: {
    padding: '16px 4px',
    borderBottom: `1px solid ${palette.lineSoft}`,
    cursor: 'pointer',
    transition: 'background 200ms'
  },
  itemTitle: { fontSize: 15, fontWeight: 600, color: palette.ink },
  itemDesc: { color: palette.mute, fontSize: 12, marginTop: 4 }
};
