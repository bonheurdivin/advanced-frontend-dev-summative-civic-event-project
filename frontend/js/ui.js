/* Small UI helpers: toasts, flash messages across redirects, button loading state, field errors, escaping. */
window.UI = {
  toast(msg, type) {
    let $c = $('#toast-region');
    if (!$c.length) $c = $('<div id="toast-region" role="status" aria-live="polite" class="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2"></div>').appendTo('body');
    const bg = { success: 'bg-green-800', error: 'bg-red-800', info: 'bg-ink' }[type || 'info'];
    const $t = $('<div class="text-white px-4 py-3 rounded-lg shadow-lg sm:max-w-sm"></div>').addClass(bg).text(msg);
    $c.append($t);
    setTimeout(() => $t.fadeOut(200, () => $t.remove()), 6000);
  },
  // Store a message to show on the next page (e.g. after redirecting to login).
  flash(msg, type) { sessionStorage.setItem('civic_flash', JSON.stringify({ msg, type: type || 'info' })); },
  loading($btn, on, label) {
    if (on) { $btn.data('label', $btn.text()).prop('disabled', true).text(label || 'Please wait…'); }
    else { $btn.prop('disabled', false).text($btn.data('label') || $btn.text()); }
  },
  // Show/clear an inline error under an input (#id-error) and set aria-invalid. Returns true if valid.
  fieldError(id, msg) {
    const $f = $('#' + id), $e = $('#' + id + '-error');
    if (msg) { $e.text(msg).removeClass('hidden'); $f.attr('aria-invalid', 'true'); }
    else { $e.text('').addClass('hidden'); $f.removeAttr('aria-invalid'); }
    return !msg;
  },
  esc(s) { return $('<div>').text(s == null ? '' : s).html(); }
};
$(function () {
  const f = sessionStorage.getItem('civic_flash');
  if (f) { sessionStorage.removeItem('civic_flash'); try { const o = JSON.parse(f); UI.toast(o.msg, o.type); } catch (e) {} }
});