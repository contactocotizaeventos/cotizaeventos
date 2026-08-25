(() => {
  let siteKeyPromise;
  let widgetId;
  let pendingLink;
  let modal;

  function loadApi() {
    if (!siteKeyPromise) {
      siteKeyPromise = fetch('/api/recaptcha-config')
        .then(response => response.json())
        .then(data => {
          if (!data.ok || !data.siteKey) throw new Error(data.error || 'reCAPTCHA no configurado');
          return data.siteKey;
        });
    }
    return siteKeyPromise;
  }

  function createModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.innerHTML = `<div class="ce-captcha-backdrop"><div class="ce-captcha-box" role="dialog" aria-modal="true" aria-labelledby="ceCaptchaTitle"><button class="ce-captcha-close" type="button" aria-label="Cerrar">&times;</button><h2 id="ceCaptchaTitle">Confirma que eres una persona</h2><p>Completa la verificación para continuar a WhatsApp.</p><div class="ce-captcha-widget"></div><div class="ce-captcha-error" role="alert"></div></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.ce-captcha-close').addEventListener('click', close);
    modal.querySelector('.ce-captcha-backdrop').addEventListener('click', event => {
      if (event.target === event.currentTarget) close();
    });
    return modal;
  }

  function addStyles() {
    if (document.getElementById('ceCaptchaStyles')) return;
    const style = document.createElement('style');
    style.id = 'ceCaptchaStyles';
    style.textContent = '.ce-captcha-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(26,23,20,.62);backdrop-filter:blur(8px)}.ce-captcha-box{position:relative;width:min(100%,420px);padding:28px;background:#fff;border:1px solid #e8e4df;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.2);font-family:Outfit,sans-serif;color:#1a1714}.ce-captcha-box h2{margin:0 32px 8px 0;font:700 22px Fraunces,serif}.ce-captcha-box p{margin:0 0 20px;color:#756d66;font-size:14px}.ce-captcha-widget{min-height:78px}.ce-captcha-close{position:absolute;top:10px;right:12px;width:32px;height:32px;border:0;background:#f5f3ef;border-radius:50%;font-size:22px;cursor:pointer;color:#1a1714}.ce-captcha-error{min-height:20px;margin-top:8px;color:#dc2626;font-size:13px}';
    document.head.appendChild(style);
  }

  function close() {
    if (modal) modal.remove();
    modal = null;
    pendingLink = null;
    widgetId = undefined;
  }

  async function open(link) {
    pendingLink = link;
    addStyles();
    const currentModal = createModal();
    currentModal.style.display = '';
    try {
      const siteKey = await loadApi();
      await new Promise((resolve, reject) => {
        if (window.grecaptcha) return resolve();
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.onload = resolve;
        script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
        document.head.appendChild(script);
      });
      widgetId = grecaptcha.render(currentModal.querySelector('.ce-captcha-widget'), {
        sitekey: siteKey,
        callback: verify,
        'expired-callback': () => { currentModal.querySelector('.ce-captcha-error').textContent = 'La verificación expiró. Inténtalo nuevamente.'; },
        'error-callback': () => { currentModal.querySelector('.ce-captcha-error').textContent = 'No se pudo cargar la verificación.'; },
      });
    } catch (error) {
      currentModal.querySelector('.ce-captcha-error').textContent = error.message;
    }
  }

  async function verify(token) {
    const link = pendingLink;
    if (!link) return;
    const errorBox = modal.querySelector('.ce-captcha-error');
    const target = new URL(link.href, window.location.href);
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: target.pathname.split('/').filter(Boolean).pop(), text: target.searchParams.get('text') || '' }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo verificar el contacto');
      window.open(result.url, '_blank', 'noopener');
      close();
    } catch (error) {
      errorBox.textContent = error.message;
      if (window.grecaptcha && widgetId !== undefined) grecaptcha.reset(widgetId);
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="wa.me/"]');
    if (!link) return;
    const target = new URL(link.href, window.location.href);
    if (target.pathname.endsWith('/56991999301')) return;
    event.preventDefault();
    event.stopPropagation();
    open(link);
  }, true);
})();
