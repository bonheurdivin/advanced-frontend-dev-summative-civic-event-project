/* Auth store = the app's "global auth context": token + { id, full_name, role }.
   Session-only login -> sessionStorage (cleared when the tab closes).
   "Keep me signed in" -> localStorage. Tradeoff: localStorage survives restarts but is readable
   by any script on the origin, so an XSS bug could steal the token. Hence we always escape output. */
window.Auth = (function () {
  const T = CONFIG.TOKEN_KEY, U = CONFIG.USER_KEY;
  const token = () => localStorage.getItem(T) || sessionStorage.getItem(T);
  const user = () => { try { return JSON.parse(localStorage.getItem(U) || sessionStorage.getItem(U)); } catch (e) { return null; } };
  const clear = () => [localStorage, sessionStorage].forEach(s => { s.removeItem(T); s.removeItem(U); });
  const save = (tok, usr, remember) => { clear(); const s = remember ? localStorage : sessionStorage; s.setItem(T, tok); s.setItem(U, JSON.stringify(usr)); };
  const setUser = usr => (localStorage.getItem(T) ? localStorage : sessionStorage).setItem(U, JSON.stringify(usr));
  // Decode the JWT payload (backend puts { id, role, iat, exp } in it). Used for expiry only, never for security.
  const decode = tok => { try { return JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; } };
  const isExpired = () => { const p = token() && decode(token()); return !p || !p.exp || p.exp * 1000 <= Date.now(); };
  const isLoggedIn = () => !!token() && !isExpired();
  const isAdmin = () => { const u = user(); return isLoggedIn() && !!u && u.role === 'admin'; };
  return { token, user, save, setUser, clear, decode, isExpired, isLoggedIn, isAdmin };
})();