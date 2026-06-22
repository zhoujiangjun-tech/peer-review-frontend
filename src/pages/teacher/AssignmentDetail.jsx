/**
 * pages/teacher/AssignmentDetail.jsx
 * 教师：作业详情
 *   - 顶部：标题 + 状态
 *   - 重点：分发按钮（朱砂红）+ 进度条（completed/total 已完成）
 *   - 学生提交表格
 *   - 评审记录（实时）
 *
 * 后端字段（routes/assignments.js GET /:id/progress）：
 *   { id, title, status, submit_deadline, review_deadline,
 *     reviews_per_submission, total_submissions, total_tasks,
 *     completed_reviews, pending_reviews, avg_score }
 *
 * 后端字段（routes/submissions.js GET /）：
 *   { id, student_id, file_name, content, submitted_at, real_name, student_no }
 *
 * 后端字段（routes/reviews.js GET /all）：
 *   { task_id, anonymous_id, reviewer_name, completed, score, comment }
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Progress, Table, Statistic, App as AntApp, Spin, Tag
} from 'antd';
import { ThunderboltOutlined, ReloadOutlined, ArrowLeftOutlined, DownloadOutlined, PaperClipOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { assignmentApi, submissionApi, reviewApi } from '../../api/index.js';
import { palette } from '../../theme.js';
import useResponsive from '../../hooks/useResponsive.js';
import StatusTag from '../../components/StatusTag.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { isMobile } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [detail, setDetail] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [distributing, setDistributing] = useState(false);
  // 附件预览
  const [attachmentPreview, setAttachmentPreview] = useState({
    open: false, kind: 'loading', url: null, text: '', html: ''
  });

  const closeAttachmentPreview = () => {
    setAttachmentPreview((p) => {
      if (p.url) URL.revokeObjectURL(p.url);
      return { open: false, kind: 'loading', url: null, text: '', html: '' };
    });
  };
  const openAttachmentPreview = async (fileName) => {
    if (!detail) return;
    setAttachmentPreview({ open: true, kind: 'loading', url: null, text: '', html: '' });
    try {
      const lower = (fileName || '').toLowerCase();
      const isImg   = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower);
      const isPdf   = /\.pdf$/i.test(lower);
      const isText  = /\.(txt|md|json|xml|ya?ml|csv|html|css|js|ts|jsx|tsx|py|java|c|cpp|h|hpp|go|rs|rb|php|sh|sql|log)$/i.test(lower);
      const isDocx  = /\.docx?$/i.test(lower);

      if (isDocx) {
        const r = await fetch(`/api/assignments/${detail.id}/attachment?format=html`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pr_token') || ''}` }
        });
        if (!r.ok) throw new Error('后端解析失败');
        const html = await r.text();
        setAttachmentPreview({ open: true, kind: 'html', url: null, text: '', html });
        return;
      }
      if (isText) {
        const r = await fetch(`/api/assignments/${detail.id}/attachment`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pr_token') || ''}` }
        });
        const t = await r.text();
        setAttachmentPreview({
          open: true, kind: 'text', url: null,
          text: t.slice(0, 20000) + (t.length > 20000 ? '\n\n... (已截断)' : '')
        });
        return;
      }
      if (isImg || isPdf) {
        const url = await assignmentApi.getAttachmentPreviewUrl(detail.id);
        setAttachmentPreview({ open: true, kind: isImg ? 'image' : 'pdf', url, text: '', html: '' });
        return;
      }
      setAttachmentPreview({ open: true, kind: 'unsupported', url: null, text: '', html: '' });
    } catch (e) {
      message.error('预览失败：' + (e.message || ''));
      closeAttachmentPreview();
    }
  };

  useEffect(() => () => {
    if (attachmentPreview.url) URL.revokeObjectURL(attachmentPreview.url);
  }, [attachmentPreview.url]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prog, det, subs, rev] = await Promise.all([
        assignmentApi.progress(id),
        assignmentApi.get(id),
        submissionApi.listAll(id),   // 教师端
        reviewApi.listAll(id)        // 教师端
      ]);
      setProgress(prog);
      setDetail(det);
      setSubmissions(subs.submissions || []);
      setReviews(rev.tasks || []);
    } catch (e) {
      message.error('加载作业详情失败：' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }, [id, message]);

  useEffect(() => { load(); }, [load]);

  const onDistribute = async () => {
    setDistributing(true);
    try {
      const res = await assignmentApi.distribute(id);
      message.success(`分发完成，已生成 ${res.totalTasks} 个评审任务`);
      await load();
    } catch (e) {
      message.error(e.response?.data?.error || '分发失败');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }
  if (!progress) return null;

  const total = progress.total_tasks || 0;
  const done  = progress.completed_reviews || 0;
  const rate  = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/teacher')}
        style={{ marginBottom: 20, color: palette.inkSoft }}
      >
        返回工作台
      </Button>

      {/* 头部 */}
      <div style={{
        ...styles.head,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: isMobile ? 16 : 0
      }}>
        <div>
          <h1 style={{ ...styles.title, fontSize: isMobile ? 22 : 36, wordBreak: 'break-word' }}>
            {progress.title || '作业详情'}
          </h1>
          <div style={{ marginTop: 8, color: palette.mute, fontSize: isMobile ? 12 : 14, lineHeight: 1.8 }}>
            <StatusTag type="assignment" value={progress.status} />
            {progress.submit_deadline && (
              <div style={{ marginTop: 4 }}>
                提交截止 {dayjs(progress.submit_deadline).format('YYYY-MM-DD HH:mm')}
              </div>
            )}
            {progress.review_deadline && (
              <div>
                评审截止 {dayjs(progress.review_deadline).format('YYYY-MM-DD HH:mm')}
              </div>
            )}
          </div>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          loading={distributing}
          onClick={onDistribute}
          disabled={progress.status === 'reviewing' || progress.status === 'closed'}
          style={{
            background: palette.accent,
            borderColor: palette.accent,
            fontWeight: 600,
            padding: '0 24px',
            height: 48
          }}
        >
          {progress.status === 'reviewing' ? '已分发' : '开始分发评审'}
        </Button>
      </div>

      {/* 作业附件（教师查看/下载） */}
      {detail && detail.attachment_name && (
        <div style={styles.attachmentBar}>
          <PaperClipOutlined style={{ color: palette.primary, fontSize: 18 }} />
          <span style={{ color: palette.mute, fontSize: 13 }}>作业附件：</span>
          <span style={{ fontWeight: 600, color: palette.ink }}>{detail.attachment_name}</span>
          {detail.attachment_size != null && (
            <span style={{ color: palette.mute, fontSize: 12 }}>
              （{(detail.attachment_size / 1024).toFixed(1)} KB）
            </span>
          )}
          <div style={{ flex: 1 }} />
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openAttachmentPreview(detail.attachment_name)}
          >
            预览
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            style={{ marginLeft: 8 }}
            onClick={() => assignmentApi.downloadAttachment(detail.id, detail.attachment_name)}
          >
            下载
          </Button>
        </div>
      )}

      {/* 进度区 */}
      <div style={styles.progressCard}>
        <div style={{ flex: 1, marginRight: 32 }}>
          <div style={styles.progressLabel}>评审进度</div>
          <Progress
            percent={rate}
            strokeColor={palette.primary}
            trailColor={palette.lineSoft}
            format={() => (
              <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 28, color: palette.ink }}>
                {done} / {total}
              </span>
            )}
            style={{ marginTop: 4 }}
          />
          <div style={styles.progressHint}>
            每份作业由 {progress.reviews_per_submission ?? 3} 位同学评审
          </div>
        </div>

        <div style={styles.statRow}>
          <Statistic
            title={<span style={{ color: palette.mute, fontSize: 12 }}>已提交</span>}
            value={progress.total_submissions}
            valueStyle={{ fontFamily: 'Instrument Serif, serif', color: palette.ink, fontSize: 28 }}
          />
          <Statistic
            title={<span style={{ color: palette.mute, fontSize: 12 }}>待评任务</span>}
            value={progress.total_tasks}
            valueStyle={{ fontFamily: 'Instrument Serif, serif', color: palette.ink, fontSize: 28 }}
          />
          <Statistic
            title={<span style={{ color: palette.mute, fontSize: 12 }}>平均分</span>}
            value={progress.avg_score ? Number(progress.avg_score).toFixed(1) : '—'}
            valueStyle={{ fontFamily: 'Instrument Serif, serif', color: palette.primary, fontSize: 28 }}
          />
        </div>
      </div>

      {/* 作业附件预览 Modal */}
      <Modal
        open={attachmentPreview.open}
        onCancel={closeAttachmentPreview}
        footer={[
          <Button
            key="dl"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => assignmentApi.downloadAttachment(detail?.id, detail?.attachment_name)}
          >
            下载原文件
          </Button>,
          <Button key="close" onClick={closeAttachmentPreview}>关闭</Button>
        ]}
        title={detail?.attachment_name || '附件预览'}
        width={780}
        destroyOnClose
      >
        {attachmentPreview.kind === 'loading' && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}
        {attachmentPreview.kind === 'image' && (
          <img src={attachmentPreview.url} alt="附件预览" style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }} />
        )}
        {attachmentPreview.kind === 'pdf' && (
          <iframe src={attachmentPreview.url} title="PDF" style={{ width: '100%', height: 520, border: 'none' }} />
        )}
        {attachmentPreview.kind === 'text' && (
          <pre style={{
            background: '#fafaf7', padding: 16, borderRadius: 8, maxHeight: 520,
            overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontFamily: 'Manrope, "Microsoft YaHei", monospace', fontSize: 13
          }}>
            {attachmentPreview.text}
          </pre>
        )}
        {attachmentPreview.kind === 'html' && (
          <iframe
            title="docx 预览"
            srcDoc={attachmentPreview.html}
            sandbox=""
            style={{ width: '100%', height: 520, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
          />
        )}
        {attachmentPreview.kind === 'unsupported' && (
          <div style={{ textAlign: 'center', padding: 40, color: palette.mute }}>
            <p>该文件类型暂不支持在线预览，请点击下方"下载原文件"查看。</p>
          </div>
        )}
      </Modal>

      {/* 提交列表 */}
      <Card
        title={<span style={{ fontWeight: 600, color: palette.ink }}>学生提交</span>}
        extra={
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={load}
            style={{ color: palette.inkSoft }}
          >
            刷新
          </Button>
        }
        bordered
        style={styles.card}
      >
        {submissions.length === 0 ? (
          <EmptyState title="还没有学生提交" description="等同学们完成作业后再来吧" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10 }}
            dataSource={submissions}
            columns={[
              { title: '学号', dataIndex: 'student_no', key: 'no',
                render: (v) => <span style={{ fontFamily: 'Manrope', fontWeight: 600 }}>{v || '—'}</span> },
              { title: '姓名', dataIndex: 'real_name', key: 'name',
                render: (v, r) => v || r.username || '—' },
              { title: '文件', dataIndex: 'file_name', key: 'file',
                render: (v, r) => v ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => submissionApi.download(r.id, v)}
                    style={{ padding: 0, height: 'auto', fontWeight: 500, color: palette.primary }}
                  >
                    {v}
                    {r.file_size != null && (
                      <span style={{ color: palette.mute, fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                        ({(r.file_size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </Button>
                ) : (r.content ? <span style={{ color: palette.mute }}>仅文字</span> : '—') },
              { title: '提交时间', dataIndex: 'submitted_at', key: 'submitted_at',
                render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '—' }
            ]}
          />
        )}
      </Card>

      {/* 评审记录 */}
      <Card
        title={<span style={{ fontWeight: 600, color: palette.ink }}>评审记录</span>}
        bordered
        style={{ ...styles.card, marginTop: 20 }}
      >
        {reviews.length === 0 ? (
          <EmptyState title="还没有评审记录" description="分发评审任务后会出现在这里" />
        ) : (
          <Table
            rowKey="task_id"
            size="middle"
            pagination={{ pageSize: 10, simple: isMobile }}
            scroll={{ x: 600 }}
            dataSource={reviews}
            columns={[
              { title: '任务', dataIndex: 'task_id', key: 'id', width: 80,
                render: (v) => `#${v}` },
              { title: '评审者', dataIndex: 'reviewer_name', key: 'reviewer',
                render: (v) => v || <span style={{ color: palette.mute }}>—</span> },
              { title: '被评作业', dataIndex: 'anonymous_id', key: 'target',
                render: (v) => <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 16 }}>{v}</span> },
              { title: '状态', dataIndex: 'completed', key: 'completed',
                render: (v) => <StatusTag type="review" value={v} /> },
              { title: '分数', dataIndex: 'score', key: 'score',
                render: (v) => v != null
                  ? <Tag color="green" style={{ fontWeight: 600 }}>{v}</Tag>
                  : <span style={{ color: palette.mute }}>—</span> },
              { title: '评语', dataIndex: 'comment', key: 'comment',
                ellipsis: true,
                render: (v) => v || <span style={{ color: palette.mute }}>—</span> }
            ]}
          />
        )}
      </Card>
    </div>
  );
}

const styles = {
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontFamily: 'Instrument Serif, serif', fontSize: 36, color: palette.ink, margin: 0, fontWeight: 400 },
  attachmentBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: palette.surface, border: `1px solid ${palette.line}`,
    borderRadius: 10, padding: '10px 14px', marginBottom: 20
  },
  progressCard: {
    display: 'flex',
    alignItems: 'center',
    background: palette.surface,
    border: `1px solid ${palette.line}`,
    borderRadius: 14,
    padding: 28,
    marginBottom: 24
  },
  progressLabel: { color: palette.mute, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  progressHint: { color: palette.mute, fontSize: 12, marginTop: 4 },
  statRow: { display: 'flex', gap: 48 },
  card: { borderRadius: 14, border: `1px solid ${palette.line}` }
};
