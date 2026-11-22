/* Shared layout: header (nav, global search, notification bell + drawer, profile menu), footer, helpers.
   Every signed-in page calls Layout.init() first. It runs Guards.requireAuth() and returns false if redirecting. */
$.extend(UI, {
  // Uploaded files come back as /uploads/... paths; make them absolute against the backend.
  mediaUrl(p) { return !p ? '' : /^https?:/.test(p) ? p : CONFIG.API_BASE_URL + (p[0] === '/' ? '' : '/') + p; },
  fmt(d) { return d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''; }
});

window.Layout = (function () {
  let items = [], loaded = false;
  const u = () => Auth.user() || {};
  const seenKey = () => 'civic_seen_' + u().id;
  const seen = () => { try { return new Set(JSON.parse(localStorage.getItem(seenKey()) || '[]')); } catch (e) { return new Set(); } };
  // Unread = API says read=false AND this browser has not opened it (the API has one shared flag per row).
  const unread = n => !n.read && !seen().has(n.id);
  const a = 'rounded px-3 py-2 font-bold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-civic';

  function updateCount() {
    const n = items.filter(unread).length;
    $('#bell-count').text(n > 9 ? '9+' : n).toggleClass('hidden', !n);
    $('#bell').attr('aria-label', 'Notifications, ' + n + ' unread');
    // Tell other parts of the page (e.g. dashboard tiles) so they stay in sync with the bell.
    $(document).trigger('civic:notifs', [{ total: items.length, unread: n }]);
  }
  function render() {
    updateCount();
    $('#notif-list').html(items.length ? items.map(i => `<li class="border-b border-slate-200 p-4">
      <button class="notif-toggle flex w-full items-start gap-2 text-left focus:outline-none focus:ring-2 focus:ring-civic" data-id="${i.id}" aria-expanded="false">
        <span class="${unread(i) ? 'bg-civic' : 'bg-transparent'} mt-2 h-2 w-2 shrink-0 rounded-full" aria-hidden="true"></span>
        <span><span class="block font-bold">${UI.esc(i.title)}</span><span class="block text-sm text-slate-700">${UI.esc(i.type)}, ${UI.fmt(i.created_at)}</span></span></button>
      <div class="notif-detail mt-2 hidden pl-4"><p>${UI.esc(i.message)}</p>
        ${i.metadata && i.metadata.event_id ? `<a class="mt-2 inline-block font-bold text-civic underline" href="event-detail.html?id=${encodeURIComponent(i.metadata.event_id)}">View event</a>` : ''}
        <button data-role="admin" class="notif-del ml-3 hidden text-red-800 underline" data-id="${i.id}">Delete</button></div></li>`).join('')
      : '<li class="p-4 text-slate-700">You have no notifications yet.</li>');
    Guards.applyRoleUI();
  }
  function load() {
    $('#notif-list').html('<li class="p-4 text-slate-700">Loading…</li>');
    Api.request('GET', '/api/notifications').done(r => { items = r.data || []; loaded = true; render(); })
      .fail(e => $('#notif-list').html(`<li class="p-4 text-red-800" role="alert">${UI.esc(e.message)} <button id="notif-retry" class="font-bold underline">Retry</button></li>`));
  }
  const setDrawer = open => {
    $('#drawer').toggleClass('translate-x-full', !open).attr('aria-hidden', !open);
    $('#drawer-bg').toggleClass('hidden', !open); $('#bell').attr('aria-expanded', open);
    if (open) $('#drawer-close').focus(); else $('#bell').focus();
  };

  function init() {
    // GUARD: any signed-in user may see the shared layout. Role-specific links use data-role (see guards.js).
    if (!Guards.requireAuth()) return false;
    $('#app-header').html(`<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-white focus:p-2">Skip to main content</a>
    <header class="sticky top-0 z-40 border-b border-slate-300 bg-white"><div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
      <a href="dashboard.html" class="brand text-xl font-bold">CivicEvents<span class="text-civic">+</span></a>
      <form id="global-search" role="search" class="order-last w-full md:order-none md:w-56"><label for="q-global" class="sr-only">Search events</label>
        <input id="q-global" type="search" placeholder="Search events" class="w-full rounded-lg border border-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-civic"></form>
      <button id="menu-btn" class="${a} ml-auto md:hidden" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav id="nav" aria-label="Main" class="hidden w-full flex-col gap-1 md:ml-auto md:flex md:w-auto md:flex-row md:items-center">
        <a href="dashboard.html" class="${a}">Dashboard</a>
        <a href="events.html" class="${a}">Events</a><a href="announcements.html" class="${a}">Announcements</a><a href="promos.html" class="${a}">Promos</a>
        <a data-role="user" href="my-registrations.html" class="hidden ${a}">My events</a>
        <a data-role="admin" href="users.html" class="hidden ${a}">Users</a>
        <button id="bell" class="${a} relative text-left" aria-expanded="false" aria-controls="drawer" aria-label="Notifications"><span aria-hidden="true">🔔</span><span class="md:hidden"> Notifications</span>
          <span id="bell-count" class="absolute right-0 top-0 hidden rounded-full bg-red-700 px-1.5 text-xs text-white"></span></button>
        <div class="relative"><button id="profile-btn" class="${a}" aria-haspopup="menu" aria-expanded="false">${UI.esc(u().full_name || 'Account')}</button>
          <div id="profile-menu" role="menu" class="absolute right-0 z-50 mt-1 hidden w-48 rounded-lg border border-slate-300 bg-white py-1 shadow-lg">
            <a role="menuitem" href="profile.html" class="block px-4 py-2 hover:bg-slate-100">My profile</a>
            <button id="logout" role="menuitem" class="block w-full px-4 py-2 text-left hover:bg-slate-100">Sign out</button></div></div>
      </nav></div></header>`);
    $('#app-footer').html(`<footer class="mt-12 border-t border-slate-300 bg-white"><div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
      <div><p class="font-bold">CivicEvents+</p><p class="text-sm text-slate-700">City events, announcements and services in one accessible place.</p></div>
      <div><p class="font-bold">Help</p><ul class="text-sm"><li><a class="underline" href="events.html">Browse events</a></li><li><a class="underline" href="mailto:help@civicevents.example">help@civicevents.example</a></li></ul></div>
      <div><p class="font-bold">Contact</p><p class="text-sm text-slate-700">Kigali City Hall, Rwanda<br>Monday to Friday, 8:00 to 17:00</p></div></div>
      <p class="border-t border-slate-200 py-3 text-center text-sm text-slate-700">© 2026 CivicEvents+ course project</p></footer>
      <div id="drawer-bg" class="fixed inset-0 z-40 hidden bg-black/40"></div>
      <aside id="drawer" role="dialog" aria-label="Notifications" aria-hidden="true" class="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm translate-x-full flex-col bg-white shadow-xl transition-transform">
        <div class="flex items-center justify-between border-b p-4"><h2 class="text-xl font-bold">Notifications</h2>
          <button id="drawer-close" class="${a}" aria-label="Close notifications">Close</button></div><ul id="notif-list" class="flex-1 overflow-y-auto"></ul></aside>`);
    Guards.applyRoleUI();
    $('#nav a').each(function () { if (this.getAttribute('href') === location.pathname.split('/').pop()) this.setAttribute('aria-current', 'page'); });  // highlight current page

    $('#menu-btn').on('click', function () { const o = $('#nav').toggleClass('hidden').hasClass('hidden'); $(this).attr('aria-expanded', !o); });
    $('#profile-btn').on('click', function (e) { e.stopPropagation(); const o = $('#profile-menu').toggleClass('hidden').hasClass('hidden'); $(this).attr('aria-expanded', !o); });
    $(document).on('click', () => $('#profile-menu').addClass('hidden'));
    $(document).on('keydown', e => { if (e.key === 'Escape') { $('#profile-menu').addClass('hidden'); if (!$('#drawer').hasClass('translate-x-full')) setDrawer(false); } });
    $('#logout').on('click', () => { Auth.clear(); UI.flash('You have signed out.', 'info'); location.href = 'login.html'; });
    $('#global-search').on('submit', e => { e.preventDefault(); location.href = 'events.html?q=' + encodeURIComponent($('#q-global').val().trim()); });
    $('#bell').on('click', () => setDrawer(true)); $('#drawer-close, #drawer-bg').on('click', () => setDrawer(false));
    $(document).on('click', '#notif-retry', load);
    $(document).on('click', '.notif-toggle', function () {
      const id = $(this).data('id'), open = $(this).attr('aria-expanded') === 'true';
      $(this).attr('aria-expanded', !open).siblings('.notif-detail').toggleClass('hidden', open);
      const s = seen(); s.add(id); try { localStorage.setItem(seenKey(), JSON.stringify([...s])); } catch (e) {}  // optimistic "read"
      $(this).find('span').first().removeClass('bg-civic'); updateCount();
    });
    // ADMIN-ONLY control (button is rendered with data-role="admin"; the backend also enforces it).
    $(document).on('click', '.notif-del', function () {
      const id = $(this).data('id'); if (!confirm('Delete this notification for everyone?')) return;
      Api.request('DELETE', '/api/notifications/' + id).done(() => { items = items.filter(n => n.id !== id); render(); UI.toast('Notification deleted.', 'success'); })
        .fail(e => UI.toast(e.message, 'error'));
    });
    load();
    return true;
  }
  return { init, counts: () => loaded ? { total: items.length, unread: items.filter(unread).length } : null };
})();