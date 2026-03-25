<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mi Suscripción — CotizaEventos.cl</title>
<meta name="description" content="Gestiona tu suscripción y perfil de proveedor en CotizaEventos.cl.">
<meta name="robots" content="noindex, nofollow">
<meta name="author" content="CotizaEventos.cl">
<meta property="og:site_name" content="CotizaEventos.cl">
<meta property="og:locale" content="es_CL">
<link rel="canonical" href="https://www.cotizaeventos.cl/suscripciones.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --coral:#E8542A;--coral2:#FF7A54;--coral-lt:#FFF0EB;--coral-md:#FFCFC2;
  --sun:#F0A500;--teal:#06C7A5;
  --bg:#FAFAF8;--bg2:#F5F3EF;--white:#FFFFFF;
  --ink:#1A1714;--ink2:#3D3733;--muted:#8A8278;
  --border:#E8E4DF;--border2:#D4CFC9;
  --r:14px;--ease:cubic-bezier(.4,0,.2,1);
  --shadow:0 2px 12px rgba(0,0,0,.07);
  --shadow-md:0 8px 32px rgba(0,0,0,.1);
  --shadow-lg:0 20px 60px rgba(0,0,0,.12);
  --font-title:'Fraunces',serif;
  --font-body:'Outfit',sans-serif;
}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer;border:none;background:none}
::selection{background:var(--coral);color:#fff}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:var(--bg2)}
::-webkit-scrollbar-thumb{background:var(--coral);border-radius:9px}

/* ── Nav ────────────────────────────────────────────────────────── */
.nav{position:sticky;top:0;z-index:100;height:56px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid var(--border)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:56px;max-width:1140px;margin:0 auto;padding:0 20px}
.nav-logo{font-family:var(--font-title);font-weight:700;font-size:20px;color:var(--ink)}
.nav-logo span{color:var(--coral)}
.nav-links{display:flex;align-items:center;gap:28px}
.nav-links a{font-size:14px;font-weight:500;color:var(--ink2);transition:color .2s}
.nav-links a:hover{color:var(--coral)}
.nav-cta{padding:8px 18px;background:var(--coral);color:#fff!important;border-radius:var(--r);font-weight:600;font-size:13px}
.nav-burger{display:none;width:32px;height:32px;flex-direction:column;justify-content:center;gap:5px;cursor:pointer}
.nav-burger i{display:block;height:2px;background:var(--ink);border-radius:2px}
.nav-mobile{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:var(--white);z-index:200;flex-direction:column;padding:80px 32px 32px}
.nav-mobile.open{display:flex}
.nav-mobile a{font-size:22px;font-weight:500;padding:16px 0;border-bottom:1px solid var(--border);color:var(--ink)}
.nav-mobile-close{position:absolute;top:16px;right:20px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--ink)}
@media(max-width:860px){.nav-links{display:none}.nav-burger{display:flex}}

/* ── Layout ─────────────────────────────────────────────────────── */
.page-header{background:#1A1410;color:#fff;padding:48px 0 40px;text-align:center}
.page-header h1{font-family:var(--font-title);font-weight:700;font-size:clamp(24px,4vw,36px);margin-bottom:6px}
.page-header p{color:rgba(255,255,255,.55);font-size:15px}
.container{max-width:900px;margin:0 auto;padding:0 20px}
.section{padding:48px 0}

/* ── Auth Screen ────────────────────────────────────────────────── */
.auth-wrap{max-width:440px;margin:48px auto 80px;background:var(--white);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.auth-tabs{display:flex;border-bottom:1px solid var(--border)}
.auth-tab{flex:1;padding:14px;text-align:center;font-weight:600;font-size:14px;color:var(--muted);cursor:pointer;transition:all .2s var(--ease);background:var(--bg2)}
.auth-tab.active{color:var(--coral);background:var(--white);box-shadow:inset 0 -2px 0 var(--coral)}
.auth-panel{display:none;padding:32px 28px}
.auth-panel.active{display:block;animation:fadeUp .3s var(--ease)}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.field{margin-bottom:18px}
.field label{display:block;font-size:14px;font-weight:500;color:var(--ink2);margin-bottom:6px}
.field label .req{color:var(--coral)}
.field input{width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:var(--r);font-family:var(--font-body);font-size:15px;background:var(--bg);transition:border-color .2s}
.field input:focus{outline:none;border-color:var(--coral);background:var(--white)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 28px;border-radius:var(--r);font-weight:600;font-size:15px;transition:all .3s var(--ease);width:100%}
.btn-coral{background:var(--coral);color:#fff}
.btn-coral:hover{background:var(--coral2)}
.btn-coral:disabled{opacity:.5;cursor:not-allowed}
.auth-msg{font-size:14px;padding:10px 14px;border-radius:8px;margin-bottom:16px;display:none}
.auth-msg.error{display:block;background:#FEE2E2;color:#DC2626;border:1px solid #FECACA}
.auth-msg.success{display:block;background:#D1FAE5;color:#059669;border:1px solid #A7F3D0}

/* ── Dashboard ──────────────────────────────────────────────────── */
.dash{display:none}
.dash.show{display:block}

.dash-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:36px;padding-bottom:20px;border-bottom:1px solid var(--border)}
.dash-biz{display:flex;align-items:center;gap:14px}
.dash-biz-logo{width:52px;height:52px;border-radius:14px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;overflow:hidden}
.dash-biz-logo img{width:100%;height:100%;object-fit:cover}
.dash-biz h2{font-family:var(--font-title);font-size:20px;font-weight:600}
.dash-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:100px;font-size:13px;font-weight:600}
.badge-dest{background:var(--coral);color:#fff}
.badge-basico{background:var(--bg2);color:var(--muted);border:1px solid var(--border)}
.dash-logout{font-size:13px;color:var(--muted);cursor:pointer;text-decoration:underline}
.dash-logout:hover{color:var(--coral)}

.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}
@media(max-width:700px){.dash-grid{grid-template-columns:1fr}}

/* ── Info Card ──────────────────────────────────────────────────── */
.info-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:28px}
.info-card h3{font-family:var(--font-title);font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px}
.info-row:last-child{border-bottom:none}
.info-row .label{color:var(--muted)}
.info-row .value{font-weight:500;color:var(--ink)}

/* ── Subscription Card ──────────────────────────────────────────── */
.sub-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:28px}
.sub-card h3{font-family:var(--font-title);font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}

/* ── Plan Comparison ────────────────────────────────────────────── */
.plan-compare{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}
@media(max-width:480px){.plan-compare{grid-template-columns:1fr}}
.plan-opt{border:2px solid var(--border);border-radius:var(--r);padding:24px 20px;text-align:center;transition:all .3s var(--ease);position:relative}
.plan-opt:hover{border-color:var(--coral-md)}
.plan-opt.recommended{border-color:var(--coral);background:linear-gradient(160deg,#FFF9F7,#fff)}
.plan-opt-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--coral);color:#fff;font-size:11px;font-weight:600;padding:3px 12px;border-radius:100px;white-space:nowrap}
.plan-opt h4{font-family:var(--font-title);font-size:18px;font-weight:600;margin-bottom:4px}
.plan-opt .price{font-size:28px;font-weight:700;color:var(--coral);margin:8px 0}
.plan-opt .price-sub{font-size:13px;color:var(--muted);margin-bottom:12px}
.plan-opt p{font-size:13px;color:var(--ink2);line-height:1.6;margin-bottom:16px}
.plan-opt .btn-plan{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:var(--coral);color:#fff;border-radius:var(--r);font-weight:600;font-size:14px;transition:all .2s var(--ease)}
.plan-opt .btn-plan:hover{background:var(--coral2)}

.plan-note{font-size:13px;color:var(--muted);text-align:center;margin-top:16px;line-height:1.6}

/* ── Active Subscription View ───────────────────────────────────── */
.sub-active-info{margin-bottom:20px}

/* Toggle switch */
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border)}
.toggle-row .toggle-label{font-size:14px;color:var(--ink2)}
.toggle{position:relative;width:48px;height:26px;flex-shrink:0}
.toggle input{display:none}
.toggle-track{position:absolute;inset:0;background:var(--border2);border-radius:13px;cursor:pointer;transition:background .3s var(--ease)}
.toggle-track::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:transform .3s var(--ease);box-shadow:0 1px 3px rgba(0,0,0,.15)}
.toggle input:checked+.toggle-track{background:var(--teal)}
.toggle input:checked+.toggle-track::after{transform:translateX(22px)}

.btn-cancel{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border:1px solid #e53e3e;color:#e53e3e;border-radius:var(--r);font-weight:500;font-size:14px;transition:all .2s var(--ease);margin-top:16px;background:transparent}
.btn-cancel:hover{background:#FEE2E2}

/* ── Cancel Modal ───────────────────────────────────────────────── */
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,23,20,.6);backdrop-filter:blur(10px);z-index:300;justify-content:center;align-items:center}
.modal-overlay.open{display:flex}
.modal-box{background:var(--white);border-radius:20px;max-width:420px;width:calc(100% - 40px);padding:32px;text-align:center}
.modal-box h3{font-family:var(--font-title);font-size:20px;font-weight:600;margin-bottom:10px}
.modal-box p{font-size:15px;color:var(--ink2);line-height:1.7;margin-bottom:24px}
.modal-btns{display:flex;gap:10px;justify-content:center}
.modal-btns .btn{width:auto}
.btn-outline{border:2px solid var(--border2);color:var(--ink);background:var(--white);padding:12px 24px;border-radius:var(--r);font-weight:600;font-size:14px}
.btn-outline:hover{border-color:var(--coral);color:var(--coral)}
.btn-danger{background:#e53e3e;color:#fff;padding:12px 24px;border-radius:var(--r);font-weight:600;font-size:14px}
.btn-danger:hover{background:#c53030}

/* ── Profile Editor ──────────────────────────────────────────────── */
.profile-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:28px;grid-column:1/-1}
.profile-card h3{font-family:var(--font-title);font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:600px){.profile-grid{grid-template-columns:1fr}}
.profile-field label{display:block;font-size:13px;font-weight:500;color:var(--muted);margin-bottom:4px}
.profile-field input,.profile-field textarea{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);font-size:14px;background:var(--bg);transition:border-color .2s}
.profile-field input:focus,.profile-field textarea:focus{outline:none;border-color:var(--coral);background:#fff}
.profile-field textarea{resize:vertical;min-height:70px}
.profile-field.full{grid-column:1/-1}
.profile-field.disabled input{background:var(--bg2);color:var(--muted);cursor:not-allowed}
.profile-uploads{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
@media(max-width:600px){.profile-uploads{grid-template-columns:1fr}}
.profile-upload{border:2px dashed var(--border2);border-radius:var(--r);padding:16px;text-align:center;cursor:pointer;transition:all .2s;background:var(--white);position:relative}
.profile-upload:hover{border-color:var(--coral);background:var(--coral-lt)}
.profile-upload.has-img{border-style:solid;border-color:var(--teal)}
.profile-upload img{max-height:80px;border-radius:6px;margin:8px auto 0;display:block}
.profile-upload input[type=file]{display:none}
.profile-upload p{font-size:13px;color:var(--ink2);margin:0}
.profile-upload .up-label{font-size:12px;color:var(--muted);margin-top:4px}
.profile-actions{display:flex;gap:10px;margin-top:20px;justify-content:flex-end}
.btn-save{background:var(--teal);color:#fff;padding:10px 24px;border-radius:var(--r);font-weight:600;font-size:14px;transition:all .2s}
.btn-save:hover{filter:brightness(1.1)}
.btn-save:disabled{opacity:.5;cursor:not-allowed}
.profile-msg{font-size:13px;padding:8px 14px;border-radius:8px;margin-top:12px;display:none}
.profile-msg.success{display:block;background:#D1FAE5;color:#059669;border:1px solid #A7F3D0}
.profile-msg.error{display:block;background:#FEE2E2;color:#DC2626;border:1px solid #FECACA}

/* ── Footer ─────────────────────────────────────────────────────── */
.footer{background:var(--bg2);border-top:1px solid var(--border);padding:48px 0 32px}
.footer-inner{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:32px;max-width:1140px;margin:0 auto;padding:0 20px}
.footer-logo{font-family:var(--font-title);font-weight:700;font-size:18px;margin-bottom:8px}
.footer-logo span{color:var(--coral)}
.footer-copy{font-size:13px;color:var(--muted)}
.footer-links{display:flex;gap:24px;flex-wrap:wrap}
.footer-links a{font-size:14px;color:var(--ink2);transition:color .2s}
.footer-links a:hover{color:var(--coral)}
</style>
</head>
<body>

<!-- ══ NAV ═══════════════════════════════════════════════════════════ -->
<nav class="nav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">Cotiza<span>Eventos</span>.cl</a>
    <div class="nav-links">
      <a href="index.html">Inicio</a>
      <a href="proveedores.html">Proveedores</a>
      <a href="nosotros.html">Nosotros</a>
      <a href="index.html#contacto">Contacto</a>
      <a href="form.html" class="nav-cta">✦ Publica tu negocio</a>
    </div>
    <div class="nav-burger" onclick="document.getElementById('navMobile').classList.toggle('open')"><i></i><i></i><i></i></div>
  </div>
</nav>
<div class="nav-mobile" id="navMobile">
  <button class="nav-mobile-close" onclick="document.getElementById('navMobile').classList.remove('open')">✕</button>
  <a href="index.html">Inicio</a>
  <a href="proveedores.html">Proveedores</a>
  <a href="nosotros.html">Nosotros</a>
  <a href="form.html">Publica tu negocio</a>
</div>

<!-- ══ PAGE HEADER ══════════════════════════════════════════════════ -->
<section class="page-header">
  <h1>Mi Suscripción</h1>
  <p>Gestiona tu cuenta y plan de proveedor</p>
</section>

<!-- ══ AUTH SCREEN ══════════════════════════════════════════════════ -->
<div class="auth-wrap" id="authWrap">
  <div class="auth-tabs">
    <div class="auth-tab active" onclick="switchTab('login')">Iniciar sesión</div>
    <div class="auth-tab" onclick="switchTab('register')">Registrarse</div>
  </div>

  <!-- Login Panel -->
  <div class="auth-panel active" id="panelLogin">
    <div class="auth-msg" id="loginMsg"></div>
    <div class="field">
      <label>Email <span class="req">*</span></label>
      <input type="email" id="loginEmail" placeholder="tu@negocio.com">
    </div>
    <div class="field">
      <label>Contraseña <span class="req">*</span></label>
      <input type="password" id="loginPass" placeholder="Tu contraseña">
    </div>
    <button class="btn btn-coral" id="loginBtn" onclick="doLogin()">Iniciar sesión</button>
    <p style="text-align:center;margin-top:14px"><a href="#" onclick="showResetPanel();return false" style="font-size:13px;color:var(--coral);text-decoration:underline">¿Olvidaste tu contraseña?</a></p>
    <!-- Reset password inline -->
    <div id="resetPanel" style="display:none;margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">
      <div class="auth-msg" id="resetMsg"></div>
      <p style="font-size:14px;color:var(--ink2);margin-bottom:14px">Ingresa tu email y te enviaremos una nueva contraseña provisoria.</p>
      <div class="field">
        <label>Email</label>
        <input type="email" id="resetEmail" placeholder="tu@negocio.com">
      </div>
      <button class="btn btn-coral" id="resetBtn" onclick="doReset()">Enviar nueva contraseña</button>
    </div>
  </div>

  <!-- Register Panel -->
  <div class="auth-panel" id="panelRegister">
    <div class="auth-msg" id="registerMsg"></div>
    <div class="field">
      <label>Nombre <span class="req">*</span></label>
      <input type="text" id="regNombre" placeholder="Tu nombre">
    </div>
    <div class="field">
      <label>Email <span class="req">*</span></label>
      <input type="email" id="regEmail" placeholder="El mismo email de tu negocio aprobado">
    </div>
    <div class="field">
      <label>Contraseña <span class="req">*</span></label>
      <input type="password" id="regPass" placeholder="Mínimo 6 caracteres">
    </div>
    <div class="field">
      <label>Confirmar contraseña <span class="req">*</span></label>
      <input type="password" id="regPass2" placeholder="Repite tu contraseña">
    </div>
    <button class="btn btn-coral" id="regBtn" onclick="doRegister()">Crear cuenta</button>
  </div>
</div>

<!-- ══ DASHBOARD ════════════════════════════════════════════════════ -->
<div class="dash" id="dashboard">
  <div class="section">
    <div class="container">

      <!-- Top bar: business info + badge -->
      <div class="dash-top">
        <div class="dash-biz">
          <div class="dash-biz-logo" id="dashLogo">✦</div>
          <div>
            <h2 id="dashName">—</h2>
            <span class="dash-badge badge-basico" id="dashBadge">📋 Básico</span>
          </div>
        </div>
        <span class="dash-logout" onclick="logout()">Cerrar sesión</span>
      </div>

      <!-- Two-column layout -->
      <div class="dash-grid">

        <!-- Left: Business info -->
        <div class="info-card">
          <h3>📊 Mi negocio</h3>
          <div id="infoRows">
            <div class="info-row"><span class="label">Cargando...</span><span class="value">—</span></div>
          </div>
        </div>

        <!-- Right: Subscription -->
        <div class="sub-card" id="subCard">
          <h3>✦ Mi suscripción</h3>
          <div id="subContent">
            <p style="color:var(--muted);font-size:14px">Cargando...</p>
          </div>
        </div>

      </div>

      <!-- Profile Editor -->
      <div class="profile-card" id="profileCard" style="margin-top:24px;display:none">
        <h3>✏️ Editar mi perfil</h3>
        <div id="profileEditor"></div>
      </div>

      <!-- Password change -->
      <div class="profile-card" id="passwordCard" style="margin-top:24px;display:none">
        <h3>🔒 Cambiar contraseña</h3>
        <div style="max-width:400px">
          <div class="field"><label>Contraseña actual <span class="req">*</span></label><input type="password" id="pwCurrent" placeholder="Tu contraseña actual"></div>
          <div class="field"><label>Nueva contraseña <span class="req">*</span></label><input type="password" id="pwNew" placeholder="Mínimo 6 caracteres"></div>
          <div class="field"><label>Confirmar nueva contraseña <span class="req">*</span></label><input type="password" id="pwNew2" placeholder="Repite la nueva contraseña"></div>
          <div class="profile-actions" style="justify-content:flex-start">
            <button class="btn-save" id="pwSaveBtn" onclick="changePassword()">Cambiar contraseña</button>
          </div>
          <div class="profile-msg" id="pwMsg"></div>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- ══ CANCEL MODAL ═════════════════════════════════════════════════ -->
<div class="modal-overlay" id="cancelModal" onclick="if(event.target===this)closeCancelModal()">
  <div class="modal-box">
    <h3>¿Cancelar suscripción?</h3>
    <p>Tu perfil Destacado se mantiene activo hasta la fecha de vencimiento aunque canceles. Después de esa fecha, tu cuenta volverá al plan Básico.</p>
    <div class="modal-btns">
      <button class="btn-outline" onclick="closeCancelModal()">Volver</button>
      <button class="btn-danger" id="confirmCancelBtn" onclick="confirmCancel()">Sí, cancelar</button>
    </div>
  </div>
</div>

<!-- ══ FOOTER ═══════════════════════════════════════════════════════ -->
<footer class="footer">
  <div class="footer-inner">
    <div>
      <div class="footer-logo">Cotiza<span>Eventos</span>.cl</div>
      <p class="footer-copy">&copy; 2025 CotizaEventos.cl — Todos los derechos reservados.</p>
    </div>
    <div class="footer-links">
      <a href="proveedores.html">Proveedores</a>
      <a href="nosotros.html">Nosotros</a>
      <a href="terminos.html">Términos</a>
      <a href="form.html">Publicar negocio</a>
    </div>
  </div>
</footer>

<script>
/* ══════════════════════════════════════════════════════════════════ */
/* HELPERS                                                           */
/* ══════════════════════════════════════════════════════════════════ */
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}

function getToken(){return localStorage.getItem('suscriptor_token')||''}
function setToken(t){localStorage.setItem('suscriptor_token',t)}
function clearToken(){localStorage.removeItem('suscriptor_token')}

async function apiPost(body){
  const res=await fetch('/api/suscriptor',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
    body:JSON.stringify(body)
  });
  const data=await res.json();
  if(res.status===401){clearToken();showAuth();throw new Error('Sesión expirada')}
  return data;
}

async function apiGet(params){
  const q=new URLSearchParams(params).toString();
  const res=await fetch('/api/suscriptor?'+q,{
    headers:{'Authorization':'Bearer '+getToken()}
  });
  const data=await res.json();
  if(res.status===401){clearToken();showAuth();throw new Error('Sesión expirada')}
  return data;
}

function showMsg(id,text,type){
  const el=document.getElementById(id);
  el.textContent=text;
  el.className='auth-msg '+type;
}
function hideMsg(id){
  const el=document.getElementById(id);
  el.className='auth-msg';
  el.textContent='';
}

function fmtDate(d){if(!d)return'—';return new Date(d).toLocaleDateString('es-CL')}
function fmtMoney(n){if(!n)return'—';return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n)}

/* ══════════════════════════════════════════════════════════════════ */
/* AUTH TABS                                                         */
/* ══════════════════════════════════════════════════════════════════ */
function switchTab(tab){
  document.querySelectorAll('.auth-tab').forEach((t,i)=>{
    t.classList.toggle('active',i===(tab==='login'?0:1));
  });
  document.getElementById('panelLogin').classList.toggle('active',tab==='login');
  document.getElementById('panelRegister').classList.toggle('active',tab==='register');
  hideMsg('loginMsg');hideMsg('registerMsg');
}

function showAuth(){
  document.getElementById('authWrap').style.display='';
  document.getElementById('dashboard').classList.remove('show');
}

function showDash(){
  document.getElementById('authWrap').style.display='none';
  document.getElementById('dashboard').classList.add('show');
}

/* ══════════════════════════════════════════════════════════════════ */
/* LOGIN                                                             */
/* ══════════════════════════════════════════════════════════════════ */
async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPass').value;
  if(!email||!password){showMsg('loginMsg','Completa todos los campos','error');return}

  const btn=document.getElementById('loginBtn');
  btn.disabled=true;btn.textContent='Ingresando...';
  hideMsg('loginMsg');

  try{
    const data=await apiPost({action:'login',email,password});
    if(!data.ok)throw new Error(data.error||'Error');
    setToken(data.token);
    showDash();
    loadDashboard();
  }catch(e){
    showMsg('loginMsg',e.message,'error');
  }finally{
    btn.disabled=false;btn.textContent='Iniciar sesión';
  }
}

/* ══════════════════════════════════════════════════════════════════ */
/* REGISTER                                                          */
/* ══════════════════════════════════════════════════════════════════ */
async function doRegister(){
  const nombre=document.getElementById('regNombre').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const pass=document.getElementById('regPass').value;
  const pass2=document.getElementById('regPass2').value;

  if(!nombre||!email||!pass){showMsg('registerMsg','Completa todos los campos','error');return}
  if(pass.length<6){showMsg('registerMsg','La contraseña debe tener al menos 6 caracteres','error');return}
  if(pass!==pass2){showMsg('registerMsg','Las contraseñas no coinciden','error');return}

  const btn=document.getElementById('regBtn');
  btn.disabled=true;btn.textContent='Creando cuenta...';
  hideMsg('registerMsg');

  try{
    const data=await apiPost({action:'register',nombre,email,password:pass});
    if(!data.ok)throw new Error(data.error||'Error');
    // Auto-login: server returns token on register
    if(data.token){
      setToken(data.token);
      showDash();
      loadDashboard();
    }else{
      showMsg('registerMsg','Cuenta creada. Ahora inicia sesión.','success');
      setTimeout(()=>switchTab('login'),1500);
    }
  }catch(e){
    showMsg('registerMsg',e.message,'error');
  }finally{
    btn.disabled=false;btn.textContent='Crear cuenta';
  }
}

/* ══════════════════════════════════════════════════════════════════ */
/* DASHBOARD                                                         */
/* ══════════════════════════════════════════════════════════════════ */
async function loadDashboard(){
  try{
    const data=await apiGet({action:'estado',token:getToken()});
    if(!data.ok)throw new Error(data.error||'Error');
    renderDashboard(data);
  }catch(e){
    // If session expired, apiGet already called showAuth() — just log it
    if(e.message==='Sesión expirada'){return}
    console.error('Dashboard error:',e);
  }
}

function renderDashboard(data){
  const{suscriptor,proveedor,suscripcion}=data;

  // Top bar
  const name=proveedor?proveedor.nombre:suscriptor.nombre;
  document.getElementById('dashName').textContent=name;

  const logoEl=document.getElementById('dashLogo');
  if(proveedor&&proveedor.logo_url){
    logoEl.innerHTML=`<img src="${esc(proveedor.logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
  }else if(proveedor&&proveedor.logo_emoji){
    logoEl.textContent=proveedor.logo_emoji;
  }

  const badge=document.getElementById('dashBadge');
  if(proveedor&&proveedor.posicion===1){
    badge.className='dash-badge badge-dest';
    badge.textContent='✦ Destacado';
  }else{
    badge.className='dash-badge badge-basico';
    badge.textContent='📋 Básico';
  }

  // Business info
  const infoEl=document.getElementById('infoRows');
  if(proveedor){
    const pageLink=proveedor.slug?`<div class="info-row"><span class="label">Mi página</span><span class="value"><a href="/prov/${esc(proveedor.slug)}" target="_blank" rel="noopener" style="color:var(--coral);font-weight:600;text-decoration:underline">Ver mi página pública →</a></span></div>`:'';
    infoEl.innerHTML=`
      <div class="info-row"><span class="label">Email</span><span class="value">${esc(suscriptor.email)}</span></div>
      <div class="info-row"><span class="label">Categoría</span><span class="value">${esc(proveedor.categoria)}</span></div>
      <div class="info-row"><span class="label">Estado</span><span class="value">${proveedor.activo?'Activo':'Inactivo'}</span></div>
      <div class="info-row"><span class="label">Plan actual</span><span class="value">${proveedor.posicion===1?'Destacado':'Básico'}</span></div>
      ${pageLink}
    `;
  }else{
    infoEl.innerHTML='<p style="color:var(--muted);font-size:14px">No se encontró proveedor vinculado.</p>';
  }

  // Subscription section
  const subEl=document.getElementById('subContent');

  if(suscripcion){
    renderActiveSub(subEl,suscripcion);
  }else{
    renderNoSub(subEl,name);
  }

  // Profile editor
  renderProfileEditor(proveedor);
}

/* ── Active subscription view ─────────────────────────────────── */
function renderActiveSub(container,sub){
  const planLabel=sub.plan==='anual'?'Anual':'Mensual';
  container.innerHTML=`
    <div class="sub-active-info">
      <div class="info-row"><span class="label">Plan</span><span class="value">${esc(planLabel)}</span></div>
      <div class="info-row"><span class="label">Monto</span><span class="value">${fmtMoney(sub.monto)}</span></div>
      <div class="info-row"><span class="label">Inicio</span><span class="value">${fmtDate(sub.fecha_inicio)}</span></div>
      <div class="info-row"><span class="label">Vencimiento</span><span class="value">${fmtDate(sub.fecha_vencimiento)}</span></div>
      <div class="info-row"><span class="label">Estado</span><span class="value" style="color:var(--teal);font-weight:600">✓ Activa</span></div>
    </div>

    <div class="toggle-row">
      <span class="toggle-label">Pago automático</span>
      <label class="toggle">
        <input type="checkbox" id="autoPay" ${sub.pago_automatico?'checked':''} onchange="toggleAutoPay(this.checked)">
        <span class="toggle-track"></span>
      </label>
    </div>

    <button class="btn-cancel" onclick="openCancelModal()">Cancelar suscripción</button>
    <p style="font-size:12px;color:var(--muted);margin-top:10px">Tu perfil Destacado se mantiene activo hasta la fecha de vencimiento aunque canceles.</p>
  `;
}

/* ── No subscription view (plan comparison) ───────────────────── */
function renderNoSub(container,bizName){
  const name=encodeURIComponent(bizName||'mi negocio');
  container.innerHTML=`
    <p style="font-size:14px;color:var(--ink2);margin-bottom:16px">No tienes una suscripción activa. Activa tu plan Destacado para obtener máxima visibilidad.</p>
    <div class="plan-compare">
      <div class="plan-opt">
        <h4>Mensual</h4>
        <div class="price">$9.990</div>
        <div class="price-sub">por mes</div>
        <p>Flexibilidad total. Cancela cuando quieras sin compromiso.</p>
        <a href="https://wa.me/56991999301?text=Hola%2C%20quiero%20contratar%20el%20plan%20Mensual%20para%20${name}%20en%20CotizaEventos.cl" class="btn-plan" target="_blank" rel="noopener">Contratar →</a>
      </div>
      <div class="plan-opt recommended">
        <div class="plan-opt-badge">Ahorra 2 meses</div>
        <h4>Anual</h4>
        <div class="price">$99.900</div>
        <div class="price-sub">por año ($8.325/mes)</div>
        <p>El equivalente a 2 meses gratis. La mejor opción para crecer todo el año.</p>
        <a href="https://wa.me/56991999301?text=Hola%2C%20quiero%20contratar%20el%20plan%20Anual%20para%20${name}%20en%20CotizaEventos.cl" class="btn-plan" target="_blank" rel="noopener">Contratar →</a>
      </div>
    </div>
    <p class="plan-note">El pago se coordina directamente con nuestro equipo por WhatsApp. Una vez confirmado, activamos tu plan Destacado en menos de 24 horas.</p>
  `;
}

/* ══════════════════════════════════════════════════════════════════ */
/* PROFILE EDITOR                                                    */
/* ══════════════════════════════════════════════════════════════════ */
let currentProv=null;

function renderProfileEditor(proveedor){
  if(!proveedor){document.getElementById('profileCard').style.display='none';document.getElementById('passwordCard').style.display='none';return}
  currentProv=proveedor;
  document.getElementById('profileCard').style.display='';
  document.getElementById('passwordCard').style.display='';
  const ed=document.getElementById('profileEditor');

  const f=(id,label,val,opts)=>{
    const disabled=opts&&opts.disabled?' disabled':'';
    const cls=opts&&opts.disabled?' disabled':'';
    const full=opts&&opts.full?' full':'';
    const type=opts&&opts.type||'text';
    const maxlen=opts&&opts.maxlength?` maxlength="${opts.maxlength}"`:'';
    const oninput=opts&&opts.onlyNumbers?` oninput="this.value=this.value.replace(/[^0-9]/g,'')"` :'';
    if(type==='textarea'){
      return `<div class="profile-field${full}${cls}"><label>${label}</label><textarea id="pf_${id}"${disabled}>${esc(val||'')}</textarea></div>`;
    }
    return `<div class="profile-field${full}${cls}"><label>${label}</label><input type="${type}" id="pf_${id}" value="${esc(val||'')}"${disabled}${maxlen}${oninput}></div>`;
  };

  ed.innerHTML=`
    <div class="profile-grid">
      ${f('nombre','Nombre del negocio (no editable)',proveedor.nombre,{disabled:true})}
      ${f('responsable','Responsable',proveedor.responsable)}
      ${f('descripcion','Descripción del servicio',proveedor.descripcion,{type:'textarea',full:true})}
      ${f('diferenciador','¿Qué nos diferencia?',proveedor.diferenciador,{type:'textarea',full:true})}
      ${f('tagline','Frase corta (tagline)',proveedor.tagline)}
      ${f('experiencia','Experiencia',proveedor.experiencia)}
      ${f('capacidad','Capacidad',proveedor.capacidad)}
      ${f('comunas','Comunas',proveedor.comunas,{full:true})}
      ${f('precio_minimo','Precio mínimo ($)',proveedor.precio_minimo,{onlyNumbers:true,maxlength:10})}
      ${f('precio_maximo','Precio máximo ($)',proveedor.precio_maximo,{onlyNumbers:true,maxlength:10})}
      ${f('incluye','¿Qué incluye?',proveedor.incluye,{type:'textarea',full:true})}
      ${f('no_incluye','¿Qué no incluye?',proveedor.no_incluye,{type:'textarea',full:true})}
      ${f('whatsapp','WhatsApp',proveedor.whatsapp,{maxlength:15,onlyNumbers:true})}
      ${f('telefono','Teléfono',proveedor.telefono,{maxlength:15,onlyNumbers:true})}
      ${f('email','Email de contacto',proveedor.email,{type:'email'})}
      ${f('web','Sitio web',proveedor.web)}
      ${f('instagram','Instagram',proveedor.instagram)}
      ${f('facebook','Facebook',proveedor.facebook)}
      ${f('tiktok','TikTok',proveedor.tiktok)}
      ${f('youtube','YouTube',proveedor.youtube)}
    </div>
    <div class="profile-uploads">
      <div class="profile-upload${proveedor.logo_url?' has-img':''}" onclick="document.getElementById('pfLogoFile').click()">
        <p>📷 Logo</p>
        ${proveedor.logo_url?'<img src="'+esc(proveedor.logo_url)+'" alt="Logo">':'<p class="up-label">Clic para subir</p>'}
        <input type="file" id="pfLogoFile" accept="image/jpeg,image/png,image/webp" onchange="uploadProfileImg('logo',this)">
      </div>
      <div class="profile-upload${proveedor.cover_url?' has-img':''}" onclick="document.getElementById('pfCoverFile').click()">
        <p>🖼️ Foto de portada</p>
        ${proveedor.cover_url?'<img src="'+esc(proveedor.cover_url)+'" alt="Portada">':'<p class="up-label">Clic para subir</p>'}
        <input type="file" id="pfCoverFile" accept="image/jpeg,image/png,image/webp" onchange="uploadProfileImg('cover',this)">
      </div>
    </div>
    <div class="profile-actions">
      <button class="btn-save" id="profileSaveBtn" onclick="saveProfile()">Guardar cambios</button>
    </div>
    <div class="profile-msg" id="profileMsg"></div>
  `;
}

let pfLogoUrl='';
let pfCoverUrl='';

async function uploadProfileImg(type,input){
  const file=input.files[0];
  if(!file)return;
  const wrap=input.closest('.profile-upload');
  wrap.querySelector('p').textContent='Subiendo...';
  try{
    const fd=new FormData();
    fd.append('file',file);
    const res=await fetch('/api/upload-image',{method:'POST',body:fd});
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||'Error');
    if(type==='logo'){pfLogoUrl=data.url}else{pfCoverUrl=data.url}
    wrap.classList.add('has-img');
    wrap.innerHTML=`<p>${type==='logo'?'📷 Logo':'🖼️ Portada'}</p><img src="${esc(data.url)}" alt=""><p class="up-label">✓ Subida</p><input type="file" id="${type==='logo'?'pfLogoFile':'pfCoverFile'}" accept="image/jpeg,image/png,image/webp" onchange="uploadProfileImg('${type}',this)" style="display:none">`;
  }catch(e){
    wrap.querySelector('p').textContent='Error: '+e.message;
  }
}

async function saveProfile(){
  const btn=document.getElementById('profileSaveBtn');
  btn.disabled=true;btn.textContent='Guardando...';
  const msgEl=document.getElementById('profileMsg');
  msgEl.className='profile-msg';

  const gv=(id)=>(document.getElementById('pf_'+id)||{}).value||'';
  const fields={
    responsable:gv('responsable'),
    descripcion:gv('descripcion'),
    diferenciador:gv('diferenciador'),
    tagline:gv('tagline'),
    experiencia:gv('experiencia'),
    capacidad:gv('capacidad'),
    comunas:gv('comunas'),
    precio_minimo:gv('precio_minimo'),
    precio_maximo:gv('precio_maximo'),
    incluye:gv('incluye'),
    no_incluye:gv('no_incluye'),
    whatsapp:gv('whatsapp'),
    telefono:gv('telefono'),
    email:gv('email'),
    web:gv('web'),
    instagram:gv('instagram'),
    facebook:gv('facebook'),
    tiktok:gv('tiktok'),
    youtube:gv('youtube'),
  };
  if(pfLogoUrl)fields.logo_url=pfLogoUrl;
  if(pfCoverUrl)fields.cover_url=pfCoverUrl;

  try{
    const data=await apiPost({action:'update_profile',token:getToken(),fields});
    if(!data.ok)throw new Error(data.error||'Error');
    msgEl.textContent='✓ Perfil actualizado correctamente';
    msgEl.className='profile-msg success';
    // Reset upload flags
    pfLogoUrl='';pfCoverUrl='';
    // Reload dashboard to reflect changes
    setTimeout(()=>loadDashboard(),1500);
  }catch(e){
    msgEl.textContent='Error: '+e.message;
    msgEl.className='profile-msg error';
  }finally{
    btn.disabled=false;btn.textContent='Guardar cambios';
  }
}

/* ══════════════════════════════════════════════════════════════════ */
/* ACTIONS                                                           */
/* ══════════════════════════════════════════════════════════════════ */
async function changePassword(){
  const cur=document.getElementById('pwCurrent').value;
  const nw=document.getElementById('pwNew').value;
  const nw2=document.getElementById('pwNew2').value;
  const msgEl=document.getElementById('pwMsg');
  const btn=document.getElementById('pwSaveBtn');
  msgEl.className='profile-msg';

  if(!cur||!nw){msgEl.textContent='Completa todos los campos';msgEl.className='profile-msg error';return}
  if(nw.length<6){msgEl.textContent='La nueva contraseña debe tener al menos 6 caracteres';msgEl.className='profile-msg error';return}
  if(nw!==nw2){msgEl.textContent='Las contraseñas nuevas no coinciden';msgEl.className='profile-msg error';return}

  btn.disabled=true;btn.textContent='Cambiando...';
  try{
    const data=await apiPost({action:'change_password',token:getToken(),current_password:cur,new_password:nw});
    if(!data.ok)throw new Error(data.error||'Error');
    msgEl.textContent='Contraseña cambiada correctamente';
    msgEl.className='profile-msg success';
    document.getElementById('pwCurrent').value='';
    document.getElementById('pwNew').value='';
    document.getElementById('pwNew2').value='';
  }catch(e){
    msgEl.textContent=e.message;
    msgEl.className='profile-msg error';
  }finally{
    btn.disabled=false;btn.textContent='Cambiar contraseña';
  }
}

async function toggleAutoPay(val){
  try{
    const data=await apiPost({action:'toggle_pago_automatico',token:getToken(),valor:val});
    if(!data.ok)throw new Error(data.error);
  }catch(e){
    alert('Error: '+e.message);
    document.getElementById('autoPay').checked=!val;
  }
}

function openCancelModal(){document.getElementById('cancelModal').classList.add('open')}
function closeCancelModal(){document.getElementById('cancelModal').classList.remove('open')}

async function confirmCancel(){
  const btn=document.getElementById('confirmCancelBtn');
  btn.disabled=true;btn.textContent='Cancelando...';
  try{
    const data=await apiPost({action:'cancelar',token:getToken()});
    if(!data.ok)throw new Error(data.error);
    closeCancelModal();
    loadDashboard();
  }catch(e){
    alert('Error: '+e.message);
  }finally{
    btn.disabled=false;btn.textContent='Sí, cancelar';
  }
}

function logout(){
  clearToken();
  showAuth();
  document.getElementById('loginEmail').value='';
  document.getElementById('loginPass').value='';
}

/* ══════════════════════════════════════════════════════════════════ */
/* RESET PASSWORD                                                    */
/* ══════════════════════════════════════════════════════════════════ */
function showResetPanel(){
  const p=document.getElementById('resetPanel');
  p.style.display=p.style.display==='none'?'':'none';
  if(p.style.display!=='none'){
    const loginEmail=document.getElementById('loginEmail').value.trim();
    if(loginEmail)document.getElementById('resetEmail').value=loginEmail;
  }
}

async function doReset(){
  const email=document.getElementById('resetEmail').value.trim();
  if(!email){showMsg('resetMsg','Ingresa tu email','error');return}
  const btn=document.getElementById('resetBtn');
  btn.disabled=true;btn.textContent='Enviando...';
  document.getElementById('resetMsg').className='auth-msg';
  try{
    const res=await fetch('/api/suscriptor',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'reset_password',email})
    });
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||'Error');
    showMsg('resetMsg','Si el email existe, recibirás una nueva contraseña en tu correo.','success');
  }catch(e){
    showMsg('resetMsg',e.message,'error');
  }finally{
    btn.disabled=false;btn.textContent='Enviar nueva contraseña';
  }
}

/* ══════════════════════════════════════════════════════════════════ */
/* INIT                                                              */
/* ══════════════════════════════════════════════════════════════════ */
(function init(){
  const token=getToken();
  if(token){
    showDash();
    loadDashboard();
  }else{
    showAuth();
  }

  // Enter key on login/register
  document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
  document.getElementById('regPass2').addEventListener('keydown',e=>{if(e.key==='Enter')doRegister()});
  // Escape closes cancel modal
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCancelModal()});
})();
</script>
</body>
</html>
