// ----------------------------------------
// KundenPortal – Cloudflare API Version
// ----------------------------------------

// Cloudflare Pages Domain hier eintragen (dein Project Name)
const API_BASE = "fuerst-software-dev.pages.dev"; // <— deine Pages-URL


const API_BASE =
  (location.hostname === "127.0.0.1" || location.hostname === "localhost")
    ? "http://127.0.0.1:8788"     // für lokalen Wrangler-Test (optional)
    : CF_BASE;

(() => {
  "use strict";

  const API_BASE = "https://fuerst-software.pages.dev"; // oder https://api.fuerst-software.com
  const API = {
    login:        () => `${API_BASE}/api/auth/login`,
    me:           () => `${API_BASE}/api/auth/me`,
    customers:    () => `${API_BASE}/api/customers`,
    services:     () => `${API_BASE}/api/services`,
    requests:     () => `${API_BASE}/api/requests`,
    notes:        () => `${API_BASE}/api/notes`,
    cats:         () => `${API_BASE}/api/cats`,
    quick:        () => `${API_BASE}/api/quick`,
  };

  // ---------- DOM ----------
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const el = {
    loginForm: $("#loginForm"),
    loginView: $("#view-login"),
    appView: $("#view-app"),
    userBadge: $("#userBadge"),
    logoutBtn: $("#logoutBtn"),
    toastBox: $("#toast"),
    year: $("#year"),
    darkToggle: $("#darkToggle"),
    // Admin
    tblCustomers: $("#tblCustomers"),
    tblServices: $("#tblServices"),
    btnAddCustomer: $("#btnAddCustomer"),
    btnAddService: $("#btnAddService"),
    tblRequests: $("#tblRequests"),
    adminActivity: $("#admin-activity"),
    // Mitarbeiter
    noteText: $("#noteText"),
    btnAddNote: $("#btnAddNote"),
    deskNotes: $("#deskNotes"),
    quickTitle: $("#quickTitle"),
    quickInfo: $("#quickInfo"),
    btnQuickAdd: $("#btnQuickAdd"),
    quickList: $("#quickList"),
    catTitle: $("#catTitle"),
    btnAddCategory: $("#btnAddCategory"),
    catList: $("#catList"),
    // Kunde
    custContact: $("#custContact"),
    custServices: $("#custServices"),
    // Request Form
    requestForm: $("#requestForm"),
    rqType: $("#rqType"),
    rqPrio: $("#rqPrio"),
    rqDue: $("#rqDue"),
    rqDesc: $("#rqDesc"),
  };
  if (el.year) el.year.textContent = new Date().getFullYear();

  const h = (v) => String(v ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");

  const showToast = (msg, ok=true) => {
    if (!el.toastBox) return;
    el.toastBox.textContent = msg;
    el.toastBox.className = ok ? "ff-toast ok" : "ff-toast err";
    el.toastBox.style.opacity = "1";
    setTimeout(()=> el.toastBox.style.opacity = "0", 2500);
  };

  // ---------- State ----------
  let currentUser = null;
  let currentRole = null;

  // ---------- Helpers: Fetch ----------
  const jget  = (url, opts={}) => fetch(url, { credentials:"include", ...opts }).then(r=> {
    if(!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
    return r.json();
  });
  const jpost = (url, data, opts={}) => fetch(url, {
    method:"POST",
    headers:{ "content-type":"application/json", ...(opts.headers||{}) },
    body: JSON.stringify(data),
    credentials:"include",
    ...opts
  }).then(r=>{
    if(!r.ok) return r.json().catch(()=>({error:""})).then(j=>{ throw new Error(j.error || `POST ${url} -> ${r.status}`); });
    return r.json();
  });
  const jdel  = (url, opts={}) => fetch(url, { method:"DELETE", credentials:"include", ...opts }).then(r=>{
    if(!r.ok) throw new Error(`DELETE ${url} -> ${r.status}`);
    return r.json();
  });

  // ---------- Auth ----------
  const enterApp = (user, role) => {
    currentUser = user;
    currentRole = role;

    el.loginView?.classList.add("d-none");
    el.appView?.classList.remove("d-none");
    el.userBadge?.classList.remove("d-none");
    el.logoutBtn?.classList.remove("d-none");
    if (el.userBadge) el.userBadge.textContent = `${user} (${role})`;

    const roleSel = `.role-${role}`;
    $$(".nav-item").forEach(li => li.classList.add("d-none"));
    $$(".tab-pane").forEach(p => p.classList.remove("show","active"));
    $$(".nav-item"+roleSel).forEach(li => li.classList.remove("d-none"));
    $$(".tab-pane"+roleSel)[0]?.classList.add("show","active");
    $(`.nav-item${roleSel} .nav-link`)?.classList.add("active");

    renderAll();
  };

  const checkSession = async () => {
    try {
      const me = await jget(API.me());
      enterApp(me.user, me.role);
    } catch {
      // keine Session: Login-View bleibt
    }
  };

  el.loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("#lg-user")?.value.trim();
    const password = $("#lg-pass")?.value.trim();
    if (!username || !password) { showToast("Bitte Zugangsdaten eingeben", false); return; }
    try {
      const res = await jpost(API.login(), { username, password });
      enterApp(res.user, res.role);
      showToast("Willkommen, " + res.user);
    } catch (err) {
      showToast("Login fehlgeschlagen", false);
    }
  });

  el.logoutBtn?.addEventListener("click", () => {
    // Session-Cookie „löschen“: kurzer Trick – abgelaufenes Cookie setzen
    document.cookie = `ff_sess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure`;
    location.reload();
  });

  checkSession();

  // ---------- Customers ----------
  async function loadCustomers() {
    if (!el.tblCustomers) return;
    const data = await jget(API.customers());
    el.tblCustomers.innerHTML = data.map(c => `
      <tr>
        <td>${h(c.name)}</td>
        <td>${h(c.mail||"")}</td>
        <td>${h(c.services_count||0)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-dark" data-act="del-customer" data-id="${h(c.id)}">Löschen</button>
        </td>
      </tr>`).join("");
  }
  el.btnAddCustomer?.addEventListener("click", async ()=>{
    const name = prompt("Kundenname?");
    const mail = prompt("E-Mail?");
    if(!name) return;
    try { await jpost(API.customers(), { name, mail }); await loadCustomers(); showToast("Kunde angelegt"); }
    catch { showToast("Kunde konnte nicht angelegt werden", false); }
  });

  // ---------- Services ----------
  async function loadServices() {
    if (!el.tblServices) return;
    const data = await jget(API.services());
    el.tblServices.innerHTML = data.map(s => `
      <tr>
        <td>${h(s.title)}</td>
        <td>${h(s.descr||"")}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-dark" data-act="del-service" data-id="${h(s.id)}">Löschen</button>
        </td>
      </tr>`).join("");
  }
  el.btnAddService?.addEventListener("click", async ()=>{
    const title = prompt("Titel?");
    const desc  = prompt("Beschreibung?");
    if(!title) return;
    try { await jpost(API.services(), { title, desc }); await loadServices(); showToast("Dienst angelegt"); }
    catch { showToast("Dienst konnte nicht angelegt werden", false); }
  });

  // ---------- Requests ----------
  async function loadRequests() {
    if (!el.tblRequests) return;
    const data = await jget(API.requests());
    el.tblRequests.innerHTML = data.map(r => `
      <tr>
        <td>${h(r.user)}</td>
        <td>${h(r.type)}</td>
        <td>${h(r.prio)}</td>
        <td>${h(r.due)}</td>
        <td>${h(r.desc)}</td>
        <td class="text-end">${h(r.status)}</td>
      </tr>`).join("");
  }
  el.requestForm?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(!el.requestForm.checkValidity()){ el.requestForm.classList.add("was-validated"); return; }
    const payload = {
      user: currentUser,
      type: el.rqType?.value || "",
      prio: el.rqPrio?.value || "",
      due:  el.rqDue?.value || "",
      desc: el.rqDesc?.value?.trim() || ""
    };
    try {
      await jpost(API.requests(), payload);
      el.requestForm.reset(); el.requestForm.classList.remove("was-validated");
      showToast("Anfrage gesendet!");
      await loadRequests(); await renderActivity();
    } catch {
      showToast("Anfrage konnte nicht gespeichert werden", false);
    }
  });

  // ---------- Notes ----------
  async function loadNotes() {
    if (!el.deskNotes) return;
    const list = await jget(API.notes());
    el.deskNotes.innerHTML = list.map(n => `
      <div>• [${new Date(n.created_at).toLocaleString()}] ${h(n.author)}: ${h(n.text)}</div>
    `).join("");
  }
  el.btnAddNote?.addEventListener("click", async ()=>{
    const txt = el.noteText?.value.trim(); if(!txt) return;
    try { await jpost(API.notes(), { author: currentUser, text: txt }); el.noteText.value=""; showToast("Notiz gespeichert"); await loadNotes(); await renderActivity(); }
    catch { showToast("Notiz konnte nicht gespeichert werden", false); }
  });

  // ---------- Quick ----------
  async function loadQuick() {
    if (!el.quickList) return;
    const list = await jget(API.quick());
    el.quickList.innerHTML = list.map(q => `<div>• ${h(q.title)}: ${h(q.info)}</div>`).join("");
  }
  el.btnQuickAdd?.addEventListener("click", async ()=>{
    const title = el.quickTitle?.value.trim();
    const info = el.quickInfo?.value.trim();
    if(!title || !info) return;
    try { await jpost(API.quick(), { title, info }); el.quickTitle.value=""; el.quickInfo.value=""; await loadQuick(); showToast("Ablage gespeichert"); }
    catch { showToast("Ablage fehlgeschlagen", false); }
  });

  // ---------- Categories ----------
  async function loadCats() {
    if (!el.catList) return;
    const cats = await jget(API.cats());
    el.catList.innerHTML = cats.map(c => `
      <div class="col-6"><div class="ff-badge">${h(c.title)}</div></div>
    `).join("");
  }
  el.btnAddCategory?.addEventListener("click", async ()=>{
    const title = el.catTitle?.value.trim(); if(!title) return;
    try { await jpost(API.cats(), { title }); el.catTitle.value=""; await loadCats(); showToast("Kategorie hinzugefügt"); }
    catch { showToast("Kategorie fehlgeschlagen", false); }
  });

  // ---------- Customer View ----------
  async function renderCustomerView(){
    if (!el.custContact || !el.custServices) return;
    el.custContact.textContent = `${currentUser}@mail.com`;
    // Services als einfache Liste anzeigen
    const services = await jget(API.services());
    el.custServices.innerHTML = services.map(s => `<li>${h(s.title)}</li>`).join("");
  }

  // ---------- Stats & Activity ----------
  async function renderStats(){
    const [customers, services, requests] = await Promise.all([
      jget(API.customers()),
      jget(API.services()),
      jget(API.requests())
    ]);
    const setKp = (k,v)=>{ const n = document.querySelector(`[data-kp='${k}']`); if(n) n.textContent = v; };
    setKp("statCustomers", customers.length);
    setKp("statServices",  services.length);
    setKp("statRequests",  requests.length);
  }

  async function renderActivity(){
    if (!el.adminActivity) return;
    const [notes, reqs] = await Promise.all([ jget(API.notes()), jget(API.requests()) ]);
    const ns = notes.map(n=>({txt:`Notiz von ${n.author}: ${n.text}`, dateISO:n.created_at}));
    const rs = reqs.map(r=>({txt:`Anfrage von ${r.user}: ${r.type}`, dateISO:r.due || r.created_at}));
    const all = [...ns, ...rs].sort((a,b)=> new Date(b.dateISO) - new Date(a.dateISO)).slice(0,5);
    el.adminActivity.innerHTML = all.map(a=>`<div>• ${new Date(a.dateISO).toLocaleString()}: ${h(a.txt)}</div>`).join("");
  }

  // ---------- Delete Delegation (Customers/Services) ----------
  document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("[data-act]");
    if(!btn) return;
    const act = btn.getAttribute("data-act");
    const id  = btn.getAttribute("data-id");
    try {
      if(act === "del-customer") { await jdel(`${API.customers()}?id=${encodeURIComponent(id)}`); await loadCustomers(); showToast("Kunde gelöscht"); }
      if(act === "del-service")  { await jdel(`${API.services()}?id=${encodeURIComponent(id)}`);  await loadServices();  showToast("Dienst gelöscht"); }
    } catch {
      showToast("Löschen fehlgeschlagen", false);
    }
  });

  // ---------- Render All ----------
  async function renderAll(){
    // paralleles Laden
    await Promise.all([
      loadCustomers(),
      loadServices(),
      loadRequests(),
      loadNotes(),
      loadQuick(),
      loadCats(),
      renderCustomerView(),
      renderStats(),
      renderActivity(),
    ]);
  }

  // Periodischer Refresh für Admin
  setInterval(async ()=>{ 
    if (currentRole === "admin" && !el.appView?.classList.contains("d-none")) {
      await Promise.all([loadRequests(), loadNotes(), renderStats(), renderActivity()]);
    }
  }, 3000);

  // ---------- Dark Mode ----------
  el.darkToggle?.addEventListener("click", ()=>{
    document.documentElement.classList.toggle("dark-mode");
    el.darkToggle.textContent = document.documentElement.classList.contains("dark-mode") ? "☀️ Light" : "🌙 Dark";
    localStorage.setItem("ffportal:theme", document.documentElement.classList.contains("dark-mode") ? "dark" : "light");
  });
  (()=>{ const t = localStorage.getItem("ffportal:theme"); if(t==="dark"){ document.documentElement.classList.add("dark-mode"); el.darkToggle && (el.darkToggle.textContent="☀️ Light"); }})();
})();





