// api/index.js - axios instance + backend API wrapper
// baseURL is the Railway backend; interceptor injects Bearer token; 401 clears token

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
  if (t) cfg.headers.Authorization = 'Bearer ' + t;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response && err.response.status === 401) clearAuth();
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
  create:  (body) => ok(http.post('/classes', body)),
  join:    (body) => ok(http.post('/classes/join', body)),
  members: (id)   => ok(http.get('/classes/' + id + '/members'))
};

// ============ Assignments ============
export const assignmentApi = {
  list:        ()     => ok(http.get('/assignments')),
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
  get:         (id)   => ok(http.get('/assignments/' + id)),
  distribute:  (id)   => ok(http.post('/assignments/' + id + '/distribute')),
  progress:    (id)   => ok(http.get('/assignments/' + id + '/progress')),
  getAttachmentPreviewUrl(id) {
    const path = '/assignments/' + id + '/attachment';
    return http.get(path, { responseType: 'blob' })
      .then((res) => URL.createObjectURL(res.data));
  },
  downloadAttachment(id, fallbackName) {
    const path = '/assignments/' + id + '/attachment';
    return http.get(path, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackName || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
  }
};

// ============ Submissions ============
export const submissionApi = {
  submit:  (body) => {
    const fd = new FormData();
    fd.append('assignment_id', body.assignment_id);
    if (body.content) fd.append('content', body.content);
    if (body.file)    fd.append('file', body.file);
    return ok(http.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  mine:    (assignmentId) => ok(http.get('/submissions/mine', { params: { assignmentId } })),
  listAll: (assignmentId) => ok(http.get('/submissions',     { params: { assignmentId } })),
  update:  (id, body) => {
    const fd = new FormData();
    if (body.content !== undefined && body.content !== null) fd.append('content', body.content);
    if (body.file) fd.append('file', body.file);
    return ok(http.put('/submissions/' + id, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  getPreviewUrl(id) {
    const path = '/submissions/file/' + id;
    return http.get(path, { responseType: 'blob' })
      .then((res) => URL.createObjectURL(res.data));
  },
  download(id, fallbackName) {
    const path = '/submissions/file/' + id;
    return http.get(path, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackName || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
  }
};

// ============ Reviews ============
export const reviewApi = {
  myTasks:        (aid) => ok(http.get('/reviews/tasks/my', { params: { assignmentId: aid } })),
  taskSubmission: (tid) => ok(http.get('/reviews/tasks/' + tid + '/submission')),
  submit:         (body)=> ok(http.post('/reviews', body)),
  listAll:        (aid) => ok(http.get('/reviews/all',     { params: { assignmentId: aid } }))
};
