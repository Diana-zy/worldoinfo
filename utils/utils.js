// 模拟点击链接
export function simulateAFSSearch(value) {
  const targetPath = "/search/";

  const url = generateCustomPath(targetPath);

  const link = document.createElement("a");
  link.href = `${url}&query=${value}`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateCustomLink(url) {
  const targetPath = url;
  const currentParams = new URLSearchParams(window.location.search);
  const currentPathname = window.location.pathname;

  // 定义路径与类型的映射关系
  const pathTypeMappings = [
    { pattern: /^\/category\/[\w-]+\/$/, type: "category-detail" },
    { pattern: /^\/category\/$/, type: "category" },
    { pattern: /^\/detail\/.*/, type: "detail" },
    { pattern: /^\/$/, type: "home" }
  ];

  // 查找匹配的路径类型
  const matchedPathType = pathTypeMappings.find((mapping) => mapping.pattern.test(currentPathname));
  const from = matchedPathType ? matchedPathType.type : currentPathname.replaceAll("/", "");

  // 删除不需要的查询参数
  currentParams.delete("from");
  if (currentPathname === "/search/" || currentPathname === "/content/") {
    currentParams.delete("text");
  }

  const currentDomain = window.location.host;

  let targetDomain = "";

  // 提取主域名和顶级域名部分的正则表达式
  // eslint-disable-next-line no-useless-escape
  const domainPattern = /^(www[0-9]*|[0-9]*)\.?([^\.]+)\.([a-z]{2,})$/;
  const match = currentDomain.match(domainPattern);
  if (match) {
    const prefix = match[1]; // 提取前缀部分，如 "www", "www2", "2", ""

    if (!prefix) {
      // case: siteId.tld
      targetDomain = `www.${currentDomain}`;
    } else if (prefix.startsWith("www")) {
      if (prefix === "www") {
        // case: www.siteId.tld
        targetDomain = currentDomain.substring(4);
      } else {
        // case: wwwx.siteId.tld
        targetDomain = currentDomain.substring(3);
      }
    } else {
      // case: x.siteId.tld
      targetDomain = `www${currentDomain}`;
    }
  } else {
    // 如果不匹配期望的模式，保留当前域名
    targetDomain = currentDomain;
  }

  const protocol = window.location.protocol;

  // 生成新的查询参数字符串
  const queryString = currentParams.toString();
  return `${protocol}//${targetDomain}${targetPath}?${queryString}${
    queryString ? "&" : ""
  }from=${encodeURIComponent(from)}`;
}

export function generateCustomPath(url) {
  const targetPath = url;
  const currentParams = new URLSearchParams(window.location.search);
  const currentPathname = window.location.pathname;

  // 定义路径与类型的映射关系
  const pathTypeMappings = [
    { pattern: /^\/category\/[\w-]+\/$/, type: "category-detail" },
    { pattern: /^\/category\/$/, type: "category" },
    { pattern: /^\/detail\/.*/, type: "detail" },
    { pattern: /^\/$/, type: "home" }
  ];

  // 查找匹配的路径类型
  const matchedPathType = pathTypeMappings.find((mapping) => mapping.pattern.test(currentPathname));
  const from = matchedPathType ? matchedPathType.type : currentPathname.replaceAll("/", "");

  // 删除不需要的查询参数
  currentParams.delete("from");
  if (currentPathname === "/search/" || currentPathname === "/content/") {
    currentParams.delete("text");
    currentParams.delete("query");
  }

  // 生成新的查询参数字符串
  const queryString = currentParams.toString();
  return `${targetPath}?${queryString}${queryString ? "&" : ""}from=${encodeURIComponent(from)}`;
}

export function simulateClickLink(url) {
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 校验邮箱格式
export function validateEmail(email) {
  // 使用正则表达式验证邮箱格式
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 在数组中随机取值
export function getRandomValueFromArray(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 重新排序
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 生成一个随机索引，范围是 [0, i]
    [array[i], array[j]] = [array[j], array[i]]; // 交换当前位置和随机位置的元素
  }
  return array;
}

// 首字母大写
export function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 从"最新/推荐文章"这类列表接口的响应里过滤掉非SEO文章(投放落地页)，
// 避免污染首页/分类页/详情页侧边栏的正常展示、影响站点SEO效果。is_seo
// 缺失（接口没返回这个字段的极端情况）时默认保留，只有明确是false/0
// 才排除，避免因为缺字段误伤正常内容
export function filterSeoArticles(list) {
  if (!Array.isArray(list)) return list;
  return list.filter((item) => !(item && (item.is_seo === false || item.is_seo === 0)));
}

// 根据文章的path_v2字段构建正确的文章链接（相对路径，不含域名）。
// 2026-09-10确认：get_all_path_v2/文章列表接口里，SEO文章的path_v2是
// "分类/urlslug-id"（不带前导斜杠），非SEO文章(投放落地页)是
// "/urlslug-id"这种带前导斜杠、分类段为空的格式。之前各组件都是直接用
// `/${item.path_v2}/`拼链接，对非SEO文章会拼出两个斜杠开头的路径
// (`//urlslug-id/`)，浏览器会把这种协议相对URL的第一段当成域名去解析，
// 导致点击直接404/DNS错误。这里统一按跟nuxt.config.js的routes()同一套
// 规则处理：非SEO文章从slug里按最后一个"-"切出纯数字id，构建成
// /detail/{id}/（对齐ad_delivery投放链接实际格式）；SEO文章照旧
// /{分类}/{urlslug}/
export function buildArticleUrl(pathV2) {
  if (!pathV2) return "/";
  const s = String(pathV2).trim();
  if (s.startsWith("/")) {
    const slug = s.slice(1);
    const lastDashIndex = slug.lastIndexOf("-");
    const id = lastDashIndex >= 0 ? slug.substring(lastDashIndex + 1) : slug;
    return `/detail/${id}/`;
  }
  return `/${s}/`;
}

export function toAuthorSlug(name, id) {
  if (!name || !id) return `author-${id}`;
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `${slug}-${id}` : `author-${id}`;
}
