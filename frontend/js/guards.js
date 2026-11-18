/* ROLE-BASED ACCESS GUARDS (client side, UX only).
   The backend is the real security: it checks the JWT role on every admin endpoint.
   These guards only keep people from seeing screens/buttons they can't use.

   1) PAGE GUARDS (call at the top of a page's script):
        Guards.requireAuth()   -> any signed-in user (admin or user); else redirect to login
        Guards.requireAdmin()  -> admin only; normal users are sent back to the dashboard with a 403 message
        Guards.guestOnly()     -> login/signup pages; signed-in users skip to the dashboard
   2) ELEMENT GUARDS: mark markup with data-role="admin" (admin-only controls: create/edit/delete,
        user management, broadcast) or data-role="user" (normal-user controls: register, feedback).
        Guards.applyRoleUI() hides whichever set doesn't match the current role. */
window.Guards = {
  requireAuth() {
    if (Auth.isLoggedIn()) return true;
    const hadToken = !!Auth.token();                       // token present but expired
    Auth.clear();
    if (hadToken) UI.flash('Your session has expired. Please sign in again.', 'error');
    location.replace('login.html');
    return false;
  },
  requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!Auth.isAdmin()) {                                  // signed in but not an admin -> forbidden
      UI.flash('403: this area is for administrators. Contact an admin if you need access.', 'error');
      location.replace('dashboard.html');
      return false;
    }
    return true;
  },
  guestOnly() { if (Auth.isLoggedIn()) location.replace('dashboard.html'); },
  applyRoleUI() {
    const admin = Auth.isAdmin();
    $('[data-role="admin"]').toggleClass('hidden', !admin);
    $('[data-role="user"]').toggleClass('hidden', admin);
  }
};