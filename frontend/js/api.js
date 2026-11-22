/* Single gateway to the backend. Every request goes through Api.request so the Authorization header,
   error messages, and 401/403 handling live in one place.
   Usage: Api.request('GET', '/api/events').then(res => ...).fail(err => err.message) */
window.Api = (function () {
  function message(xhr) {
    const j = xhr.responseJSON || {};
    const m = j.message || j.error || (Array.isArray(j.errors) && j.errors.map(e => e.msg || e.message || e).join(', '));
    if (m) return m;
    if (xhr.status === 0) return 'Cannot reach the server. Check your connection and that the backend is running.';
    if (xhr.status === 403) return 'You do not have permission to do that. Contact an administrator.';
    if (xhr.status >= 500) return 'Server error. Please try again in a moment.';
    return 'Something went wrong. Please try again.';
  }
  // opts: { body: {...} -> JSON, formData: FormData -> multipart (uploads), auth: false for public calls }
  function request(method, path, opts) {
    opts = opts || {};
    const sentToken = opts.auth !== false && Auth.token();
    const o = { url: CONFIG.API_BASE_URL + path, method: method, headers: {} };
    if (sentToken) o.headers.Authorization = 'Bearer ' + sentToken;
    // Optional upload progress: pass onProgress(fraction 0..1) alongside formData.
    if (opts.onProgress) o.xhr = function () { const x = $.ajaxSettings.xhr(); if (x.upload) x.upload.addEventListener('progress', ev => ev.lengthComputable && opts.onProgress(ev.loaded / ev.total)); return x; };
    if (opts.formData) { o.data = opts.formData; o.processData = false; o.contentType = false; } // browser sets the multipart boundary
    else if (opts.body) { o.data = JSON.stringify(opts.body); o.contentType = 'application/json'; }
    return $.ajax(o).then(null, function (xhr) {
      // Expired/invalid token on a protected call -> sign out and go to login (401 on /login itself just means bad credentials).
      if (xhr.status === 401 && sentToken) {
        Auth.clear(); UI.flash('Your session has expired. Please sign in again.', 'error'); location.replace('login.html');
      }
      return $.Deferred().reject({ status: xhr.status, message: message(xhr), data: xhr.responseJSON }).promise();
    });
  }
  return { request };
})();