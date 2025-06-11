/* Cookie 操作 */
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function getDetailIsClickAc() {
  const cipherData = getCookie("hi_act_chain");
  if (cipherData) {
    const decoded = JSON.parse(atob(cipherData));
    if (Date.now() - decoded.timestamp < 3600000) {
      return true;
    }
  }
  return false;
}

window.addEventListener("blur", () => {
  const activeElement = document.activeElement;
  const src = activeElement.getAttribute("src");
  if (src && src.includes("afs/ads?")) {
    /* 内容页点击词条 */
    if (!activeElement.getAttribute("title") && location.pathname.includes("/detail/")) {
      const cipherText = btoa(
        JSON.stringify({
          timestamp: Date.now()
        })
      );
      window.setCookie("hi_act_chain", cipherText);
    }
  }
});
// eslint-disable-next-line no-unused-vars
function pushEventParamsToGtm(eventName, ttclid) {
  window.dataLayer.push({
    event: eventName,
    hi_country: window.youknowwho_ip_country || "unknown",
    hi_ip: window.youknowwho_ip || "unknown",
    hi_ttclid: ttclid || window.getCookie("hi_ttclid") || "unknown"
  });
}
