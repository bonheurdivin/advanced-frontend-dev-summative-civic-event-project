/* Helpers for audio/video pages: time formatting, file validation, caption text -> WebVTT. */
window.Media = {
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  time(s) { if (!isFinite(s)) return '0:00'; s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  // Returns an error message, or '' if the file is fine. Run BEFORE uploading so people get instant feedback.
  check(file, types, maxMB) {
    if (!file) return 'Choose a file.';
    if (!types.includes(file.type)) return 'Unsupported file type (' + (file.type || 'unknown') + ').';
    if (file.size > maxMB * 1048576) return 'That file is ' + (file.size / 1048576).toFixed(1) + ' MB. The limit is ' + maxMB + ' MB.';
    return '';
  },
  // The API stores caption_text as plain text with no timings, so split it into sentences and spread the cues evenly over the video.
  vtt(text, dur) {
    if (/-->/.test(text)) return /^WEBVTT/.test(text.trim()) ? text : 'WEBVTT\n\n' + text;     // already WebVTT
    const parts = (text.match(/[^.!?\n]+[.!?]*/g) || [text]).map(x => x.trim()).filter(Boolean), step = dur / parts.length;
    const f = t => String(Math.floor(t / 3600)).padStart(2, '0') + ':' + String(Math.floor(t % 3600 / 60)).padStart(2, '0') + ':' + (t % 60).toFixed(3).padStart(6, '0');
    return 'WEBVTT\n\n' + parts.map((p, i) => f(i * step) + ' --> ' + f((i + 1) * step) + '\n' + p).join('\n\n');
  }
};