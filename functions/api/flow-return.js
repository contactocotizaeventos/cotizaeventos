/**
 * GET /api/flow-return?token=xxx
 *
 * User returns here after paying in Flow.
 * Redirects to suscripciones.html — the webhook (flow-confirm) 
 * already activated the subscription, so the dashboard will show
 * the updated status automatically.
 */

export async function onRequest() {
  return Response.redirect("https://www.cotizaeventos.cl/suscripciones.html?pago=ok", 302);
}
