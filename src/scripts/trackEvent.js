function isDebug() {
  return document.location.hostname === "localhost";
}

function getDefaultParams(eventParams) {
  const session_id = Math.ceil(Math.random() * 1000000000);

  const defaultParams = {
    event_name: eventParams.event_name || "default_event_name",
    page_location:
      eventParams.page_location || window?.document?.location?.href || "",
    page_title: eventParams.page_title || window?.document?.title || "",
    page_referrer:
      eventParams.page_referrer || window?.document?.referrer || "",
    session_id: session_id,
    client_id: Math.ceil(Math.random() * 1000000000) + "." + session_id,
  };
  return defaultParams;
}

function getPixelPayload(eventParams) {
  const eventPayload = { ...getDefaultParams(eventParams) };

  if (eventParams) {
    for (const key in eventParams) {
      if (eventParams.hasOwnProperty(key)) {
        eventPayload[key] = eventParams[key];
      }
    }
  }

  if (isDebug()) {
    eventPayload.debug_mode = true;
  }
  return eventPayload;
}

function trackEvent(eventParams) {
  window.__pid =
    window.__pid ||
    Math.ceil(Math.random() * 1000) + "." + new Date().getTime();
  eventParams.page_load_id = eventParams.page_load_id || window.__pid;

  const pixelPayload = getPixelPayload(eventParams);
  const transportUrl = "https://sgtm.hannes.cool/btnt";

  if (isDebug()) {
    eventParams.debug_mode = true;
    console.log("track event: ");
    console.table(eventParams);
  }

  navigator.sendBeacon(transportUrl, JSON.stringify([pixelPayload]));

  return;
}

export { trackEvent };
