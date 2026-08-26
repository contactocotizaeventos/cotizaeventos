(() => {
  const WORKER_URL = 'https://cotizaeventos-captcha.contactocotizaeventos.workers.dev';

  let siteKeyPromise;
  let googleReadyPromise;
  let modal;
  let widgetId;
  let pendingLink;

  async function getSiteKey() {
    if (!siteKeyPromise) {
      siteKeyPromise = fetch(WORKER_URL, {
        method: 'GET',
        cache: 'no-store',
      })
        .then(async response => {
          const data = await response.json();
          if (!response.ok || !data.ok || !data.siteKey) {
            throw new Error(data.error || 'No se pudo obtener la Site Key');
          }
          return data.siteKey;
        })
        .catch(error => {
          siteKeyPromise = undefined;
          throw error;
        });
    }

    return siteKeyPromise;
  }

  function waitForGoogleReady(resolve, reject) {
    const started = Date.now();

    const check = () => {
      if (
        window.grecaptcha &&
        typeof window.grecaptcha.render === 'function'
      ) {
        resolve();
        return;
      }

      if (Date.now() - started > 10000) {
        reject(new Error('reCAPTCHA tardó demasiado en cargar'));
        return;
      }

      setTimeout(check, 50);
    };

    check();
  }

  function ensureGoogleReady() {
    if (
      window.grecaptcha &&
      typeof window.grecaptcha.render === 'function'
    ) {
      return Promise.resolve();
    }

    if (!googleReadyPromise) {
      googleReadyPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(
          'script[src*="google.com/recaptcha/api.js"]',
        );

        if (existing) {
          waitForGoogleReady(resolve, reject);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => waitForGoogleReady(resolve, reject);
        script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
        document.head.appendChild(script);
      }).catch(error => {
        googleReadyPromise = undefined;
        throw error;
      });
    }

    return googleReadyPromise;
  }

  async function render(container, callbacks = {}) {
    const element = typeof container === 'string'
      ? document.getElementById(container)
      : container;

    if (!element) {
      throw new Error('No se encontró el contenedor de reCAPTCHA');
    }

    const [siteKey] = await Promise.all([
      getSiteKey(),
      ensureGoogleReady(),
    ]);

    return window.grecaptcha.render(element, {
      sitekey: siteKey,
      callback: callbacks.callback,
      'expired-callback': callbacks.expiredCallback,
      'error-callback': callbacks.errorCallback,
    });
  }

  function reset(id) {
    if (
      window.grecaptcha &&
      typeof window.grecaptcha.reset === 'function' &&
      id !== undefined &&
      id !== null
    ) {
      window.grecaptcha.reset(id);
    }
  }

  window.CotizaCaptcha = {
    workerUrl: WORKER_URL,
    getSiteKey,
    ensureGoogleReady,
    render,
    reset,
  };

  function createModal() {
    if (modal) return modal;

    modal = document.createElement('div');
    modal.innerHTML = `
      <div class="ce-captcha-backdrop">
        <div class="ce-captcha-box" role="dialog" aria-modal="true" aria-labelledby="ceCaptchaTitle">
          <button class="ce-captcha-close" type="button" aria-label="Cerrar">&times;</button>
          <h2 id="ceCaptchaTitle">Confirma que eres una persona</h2>
          <p>Completa la verificación para continuar a WhatsApp.</p>
          <div class="ce-captcha-widget"></div>
          <div class="ce-captcha-error" role="alert"></div>
        </div>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelector('.ce-captcha-close').addEventListener('click', closeModal);
    modal.querySelector('.ce-captcha-backdrop').addEventListener('click', event => {
      if (event.target === event.currentTarget) closeModal();
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

  function closeModal() {
    if (modal) modal.remove();
    modal = null;
    pendingLink = null;
    widgetId = undefined;
  }

  async function openWhatsAppCaptcha(link) {
    pendingLink = link;
    addStyles();

    const currentModal = createModal();
    currentModal.style.display = '';
    const errorBox = currentModal.querySelector('.ce-captcha-error');

    try {
      widgetId = await render(
        currentModal.querySelector('.ce-captcha-widget'),
        {
          callback: verifyWhatsApp,
          expiredCallback: () => {
            errorBox.textContent = 'La verificación expiró. Inténtalo nuevamente.';
          },
          errorCallback: () => {
            errorBox.textContent = 'No se pudo cargar la verificación.';
          },
        },
      );
    } catch (error) {
      errorBox.textContent = error.message || 'No se pudo cargar reCAPTCHA';
    }
  }

  async function verifyWhatsApp(token) {
    const link = pendingLink;
    if (!link || !modal) return;

    const errorBox = modal.querySelector('.ce-captcha-error');
    const target = new URL(link.href, window.location.href);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose: 'whatsapp',
          token,
          phone: target.pathname.split('/').filter(Boolean).pop(),
          text: target.searchParams.get('text') || '',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok || !result.url) {
        const detail = Array.isArray(result.captcha_errors) && result.captcha_errors.length
          ? ` (${result.captcha_errors.join(', ')})`
          : '';
        throw new Error((result.error || 'No se pudo verificar el contacto') + detail);
      }

      window.open(result.url, '_blank', 'noopener');
      closeModal();
    } catch (error) {
      errorBox.textContent = error.message || 'No se pudo verificar el contacto';
      reset(widgetId);
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="wa.me/"]');
    if (!link) return;

    event.preventDefault();
    event.stopPropagation();
    openWhatsAppCaptcha(link);
  }, true);
})();