/* Configure these values after approving the site in AdSense. */
window.COTIZA_ADSENSE_CLIENT = "ca-pub-9257154700327932";
window.COTIZA_ADSENSE_SLOTS = {
  "directory-top": "5300097516",
  "directory-list": "3761881069",
  "provider-profile": "5893220388"
};

(function loadAds() {
  const client = window.COTIZA_ADSENSE_CLIENT;
  if (!client || !/^ca-pub-\d+$/.test(client)) return;

  document.querySelectorAll("[data-ad-slot]").forEach((slot) => {
    const slotId = window.COTIZA_ADSENSE_SLOTS[slot.dataset.adSlot];
    if (!slotId || !/^\d+$/.test(slotId)) return;
    slot.classList.add("adsbygoogle");
    slot.style.display = "block";
    slot.setAttribute("data-ad-client", client);
    slot.setAttribute("data-ad-slot", slotId);
    slot.setAttribute("data-ad-format", "auto");
    slot.setAttribute("data-full-width-responsive", "true");
    slot.classList.add("ad-ready");
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });

})();
