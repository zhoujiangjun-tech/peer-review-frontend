/**
 * api/index.js
 * axios 实例 + 全部后端接口封装
 *
 * - baseURL = '/api'，由 Vite dev 代理到 http://localhost:3000
 * - 拦截器自动注入 Authorization；401 时清理本地 token
 *
 * 字段约定（与后端 routes/* 保持一致）：
 *   classes:      class_name / invite_code / teacher_id
 *   assignments:  class_id / title / description / submit_deadline / review_deadline
 *   progress:     status / total_submissions / total_tasks / completed_reviews / pending_reviews
 *   review task:  task_id / assignment_id / submission_id / anonymous_id / completed / score / comment
 */

import axios from 'axios';

const TOKEN_KEY = 'pr_token';
const USER_KEY  = 'pr_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
};
export const setStoredUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));

const http = axios.create({
  baseURL: 'https://peer-review-backend-production-bca4.up.railway.app/api',
  timeout: 15000
});

http.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) clearAuth();
    return Promise.reject(err);
  }
);

const ok = (p) => p.then((r) => r.data);

// ============ Auth ============
export const authApi = {
  register: (body) => ok(http.post('/auth/register', body)),
  login:    (body) => ok(http.post('/auth/login', body)),
  me:       ()     => ok(http.get('/auth/me'))
};

// ============ Classes ============
export const classApi = {
  list:    ()     => ok(http.get('/classes')),
  create:  (body) => ok(http.post('/classes', body)),         // { class_name }
  join:    (body) => ok(http.post('/classes/join', body)),    // { invite_code, student_no }
  members: (id)   => ok(http.get(`/classes/${id}/members`))
};

// ============ Assignments ============
export const assignmentApi = {
  list:        ()     => ok(http.get('/assignments')),
  // body: { class_id, title, description?, submit_deadline?, review_deadline?, attachment? }
  create:      (body) => {
    const fd = new FormData();
    fd.append('class_id', body.class_id);
    fd.append('title', body.title);
    if (body.description)     fd.append('description', body.description);
    if (body.submit_deadline) fd.append('submit_deadline', body.submit_deadline);
    if (body.review_deadline) fd.append('review_deadline', body.review_deadline);
    if (body.attachment)      fd.append('attachment', body.attachment);
    return ok(http.post('/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  get:         (id)   => ok(http.get(`/assignments/${id}`)),
  distribute:  (id)   => ok(http.post(`/assignments/${id}/distribute`)),
  progress:    (id)   => ok(http.get(`/assignments/${id}/progress')),
  // 拿到授权的 blob URL（供 <img src> / <iframe src> 使用）
  async getAttachmentPreviewUrl(id) {
    const res = await http.get(`/assignments/${id}/attachment`, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },
  // 触发下载附件（保留后端返回的原始文件名）
  async downloadAttachment(id, fallbackName = 'file') {
    const res = await http.get(`/assignments/${id}/attachment`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

// ============ Submissions ============
export const submissionApi = {
  // body: { assignment_id, content?, file? }  - file 是原始 File 对象
  submit:  (body) => {
    const fd = new FormData();
    fd.append('assignment_id', body.assignment_id);
    if (body.content) fd.append('content', body.content);
    if (body.file)    fd.append('file', body.file);
    return ok(http.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  mine:    (assignmentId)=> ok(http.get('/submissions/mine', { params: { assignmentId } })),
  listAll: (assignmentId)=> ok(http.get('/submissions',     { params: { assignmentId } })),   // 教师
  // 修改提交：{ content?, file? }
  update:  (id, body) => {
    const fd = new FormData();
    if (body.content !== undefined && body.content !== null) fd.append('content', body.content);
    if (body.file) fd.append('file', body.file);
    return ok(http.put(`/submissions/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  // 拿到一个授权的 blob URL（供 <img src> / <iframe src> 使用），组件在卸载时调用 revoke
  async getPreviewUrl(id) {
    const res = await http.get(`/submissions/file/${id}`, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },
  // 触发下载（保留后端返回的原始文件名）
  async download(id, fallbackName = 'file') {
    const res = await http.get(`/submissions/file/${id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

// ============ Reviews ============
export const reviewApi = {
  myTasks:        (aid) => ok(http.get('/reviews/tasks/my', { params: { assignmentId: aid } })),
  taskSubmission: (tid) => ok(http.get(`/reviews/tasks/${tid}/submission`)),
  submit:         (body)=> ok(http.post('/reviews', body)),                      // { task_id, score, comment }
  listAll:        (aid) => ok(http.get('/reviews/all',     { params: { assignmentId: aid } }))   // 教师
};
