/**
 * pages/student/ReviewSubmission.jsx
 * Student: submit a peer review for an assigned (anonymous) submission.
 */
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Slider, Input, Button, App as AntApp, Spin, Divider, Result, Tag, Tooltip } from 'antd';
import {
  ArrowLeftOutlined, DownloadOutlined, FileTextOutlined, FilePdfOutlined,
  FileImageOutlined, FileZipOutlined, EyeOutlined, CloseOutlined
} from '@ant-design/icons';

import { reviewApi, submissionApi } from '../../api/index.js';
import { palette } from '../../theme.js';
import StatusTag from '../../components/StatusTag.jsx';
import useResponsive from '../../hooks/useResponsive.js';

function fileIcon(name) {
  if (!name) return <FileTextOutlined />;
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return <FilePdfOutlined />;
  if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lower)) return <FileImageOutlined />;
  if (/\.(zip|7z|rar|tar|gz)$/.test(lower)) return <FileZipOutlined />;
  return <FileTextOutlined />;
}

function isImage(name) { return !!name && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name); }
function isPdf(name) { return !!name && /\.pdf$/i.test(name); }
function isTextLike(name) {
  return !!name && /\.(txt|md|json|xml|ya?ml|csv|html|css|js|ts|jsx|tsx|py|java|c|cpp|h|hpp|go|rs|rb|php|sh|sql|log)$/i.test(name);
}
function isDocx(name) { return !!name && /\.docx?$/i.test(name); }

export default function ReviewSubmission() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [score, setScore] = useState(80);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewKind, setPreviewKind] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await reviewApi.taskSubmission(taskId);
        setTask(data);
      } catch (e) {
        message.error('加载失败：' + (e.response?.data?.error || e.message));
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId, message]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const hasFile = !!(task && task.file_name);
  const submissionId = task?.submission_id;
  const getAuthToken = () => localStorage.getItem('pr_token') || '';

  const openPreview = async () => {
    if (!submissionId) return;
    setPreviewing(true);
    try {
      if (isDocx(task.file_name)) {
        const r = await fetch(`/api/submissions/file/${submissionId}?format=html`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        if (!r.ok) throw new Error('后端解析失败');
        const html = await r.text();
        setPreviewText(html);
        setPreviewKind('html');
        setPreviewUrl(null);
        return;
      }
      if (isTextLike(task.file_name) && !isImage(task.file_name)) {
        const res = await fetch(`/api/submissions/file/${submissionId}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        const text = await res.text();
        setPreviewText(text.slice(0, 20000) + (text.length > 20000 ? '\n\n... (truncated)' : ''));
        setPreviewKind('text');
        setPreviewUrl(null);
        return;
      }
      const url = await submissionApi.getPreviewUrl(submissionId);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewKind(isImage(task.file_name) ? 'image' : isPdf(task.file_name) ? 'pdf' : null);
    } catch (e) {
      message.error('预览失败：' + (e.response?.data?.error || e.message));
    } finally {
      setPreviewing(false);
    }
  };

  const closePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setPreviewKind(null);
    setPreviewText('');
  };

  const onDownload = async () => {
    if (!submissionId) return;
    try {
      await submissionApi.download(submissionId, task.file_name);
    } catch (e) {
      message.error('下载失败：' + (e.response?.data?.error || e.message));
    }
  };

  const submit = async () => {
    if (comment.trim().length < 5) {
      message.warning('请至少写 5 个字的评语');
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.submit({ task_id: Number(taskId), score, comment });
      message.success('评审已提交');
      setDone(true);
      setTimeout(() => navigate('/student'), 1200);
    } catch (e) {
      message.error(e.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }
  if (!task) return null;

  if (done) {
    return (
      <Result
        status="success"
        title="评审已提交"
        subTitle="正在返回首页..."
        style={{ background: palette.surface, borderRadius: 14, padding: isMobile ? 24 : 48 }}
      />
    );
  }

  const showable = hasFile && (isImage(task.file_name) || isPdf(task.file_name) || isTextLike(task.file_name) || isDocx(task.file_name));
  const styles = makeStyles(isMobile);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/student')}
        style={{ marginBottom: 20, color: palette.inkSoft }}
      >
        返回
      </Button>

      <Card bordered style={styles.card}>
        <div style={styles.anonRow}>
          <div>
            <div style={styles.anonLabel}>ANONYMOUS</div>
            <div style={styles.anonId}>{task.anonymous_id}</div>
          </div>
          <StatusTag type="review" value={task.task_id ? false : true} />
        </div>

        <Divider style={{ margin: '24px 0', borderColor: palette.lineSoft }} />

        <div style={styles.section}>
          <div style={styles.sectionLabel}>文件</div>
          {hasFile ? (
            <div style={styles.fileRow}>
              <div style={styles.fileInfo}>
                <span style={{ fontSize: 22, color: palette.primary, marginRight: 10 }}>
                  {fileIcon(task.file_name)}
                </span>
                <span style={{ color: palette.ink, fontSize: 14, fontWeight: 500 }}>
                  {task.file_name}
                </span>
                {task.file_size != null && (
                  <Tag color="default" style={{ marginLeft: 10 }}>
                    {(task.file_size / 1024).toFixed(1)} KB
                  </Tag>
                )}
              </div>
              <div style={styles.fileActions}>
                {showable && (
                  <Tooltip title="在页面内预览">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={openPreview}
                      loading={previewing}
                    >
                      预览
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="下载原文件">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={onDownload}
                  >
                    下载
                  </Button>
                </Tooltip>
              </div>
            </div>
          ) : (
            <div style={{ color: palette.mute, fontSize: 13 }}>(no file, text only)</div>
          )}

          {(previewKind || previewing) && (
            <div style={styles.previewBox}>
              <div style={styles.previewHead}>
                <span style={{ fontSize: 12, color: palette.mute }}>
                  {previewing ? 'loading...' : 'preview'}
                </span>
                <Button
                  size="small"
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={closePreview}
                />
              </div>
              {previewKind === 'image' && previewUrl && (
                <img
                  src={previewUrl}
                  alt={task.file_name}
                  style={{ maxWidth: '100%', maxHeight: isMobile ? 280 : 480, display: 'block', margin: '0 auto' }}
                />
              )}
              {previewKind === 'pdf' && previewUrl && (
                <iframe
                  src={previewUrl}
                  title={task.file_name}
                  style={{ width: '100%', height: isMobile ? 280 : 480, border: 'none', borderRadius: 6 }}
                />
              )}
              {previewKind === 'text' && (
                <pre style={styles.previewText}>{previewText}</pre>
              )}
              {previewKind === 'html' && (
                <iframe
                  title={task.file_name}
                  srcDoc={previewText}
                  sandbox=""
                  style={{ width: '100%', height: isMobile ? 280 : 480, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
                />
              )}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>内容</div>
          <pre style={styles.content}>{task.content || '(no content)'}</pre>
        </div>
      </Card>

      <Card bordered style={{ ...styles.card, marginTop: 20 }}>
        <div style={styles.sectionLabel}>评分</div>
        <div style={styles.scoreRow}>
          <Slider
            min={0} max={100}
            value={score}
            onChange={setScore}
            tooltip={{ formatter: (v) => `${v} 分` }}
            style={{ flex: 1 }}
          />
          <div style={styles.scoreDisplay}>{score}</div>
        </div>

        <div style={{ ...styles.sectionLabel, marginTop: 16 }}>评语</div>
        <Input.TextArea
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="请客观、专业地给出你的建议..."
          style={{ marginTop: 6 }}
        />

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => navigate('/student')}>取消</Button>
          <Button type="primary" loading={submitting} onClick={submit}>
            提交评审
          </Button>
        </div>
      </Card>
    </div>
  );
}

const makeStyles = (isMobile) => ({
  card: { borderRadius: 14, border: `1px solid ${palette.line}` },
  anonRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  anonLabel: { fontSize: 10, letterSpacing: 2, color: palette.mute, marginBottom: 4 },
  anonId: { fontFamily: 'Instrument Serif, serif', fontSize: 30, color: palette.ink },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, color: palette.mute, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: palette.paperWarm,
    border: `1px solid ${palette.line}`,
    borderRadius: 10,
    gap: 12
  },
  fileInfo: { display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' },
  fileActions: { display: 'flex', gap: 4, flexShrink: 0 },
  previewBox: {
    marginTop: 10,
    background: '#fff',
    border: `1px solid ${palette.line}`,
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: isMobile ? 280 : 480,
    overflowY: 'auto'
  },
  previewHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    background: palette.paperWarm,
    borderBottom: `1px solid ${palette.line}`,
    position: 'sticky',
    top: 0,
    zIndex: 1
  },
  previewText: {
    padding: 14,
    margin: 0,
    fontSize: 12,
    lineHeight: 1.6,
    color: palette.ink,
    fontFamily: 'Manrope, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 360,
    overflow: 'auto'
  },
  content: {
    background: palette.paperWarm,
    padding: 16,
    borderRadius: 8,
    fontSize: 13,
    color: palette.ink,
    lineHeight: 1.7,
    fontFamily: 'Manrope, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0
  },
  scoreRow: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? 12 : 24,
    marginTop: 6
  },
  scoreDisplay: {
    fontFamily: 'Instrument Serif, serif',
    fontSize: isMobile ? 36 : 48,
    color: palette.primary,
    minWidth: 80,
    textAlign: isMobile ? 'left' : 'right'
  }
});
