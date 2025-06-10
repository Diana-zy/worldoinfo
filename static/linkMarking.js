/* Cookie 操作 */
function getMainDomain() {
  const url = window.location.hostname; // 获取当前主机名
  const parts = url.split("."); // 按点分割
  if (parts.length > 2) {
    // 当主机名有子域时，取最后两个部分
    return parts.slice(-2).join("."); // 返回主域名
  }
  return url; // 没有子域时直接返回当前主机名
}

function setCookie(name, value, daysToExpire = 1) {
  const date = new Date();
  date.setTime(date.getTime() + daysToExpire * 24 * 60 * 60 * 1000); // 设置过期时间为指定的天数之后
  const expires = "; expires=" + date.toUTCString(); // 转换为GMT格式的字符串
  document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=" + getMainDomain(); // 设置cookie
}

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
      setCookie("hi_act_chain", cipherText);
    }
  }
});
