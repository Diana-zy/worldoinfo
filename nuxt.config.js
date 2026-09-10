import TerserPlugin from "terser-webpack-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";

export default {
  target: "static",
  server: {
    host: "0.0.0.0"
  },
  env: {
    SITE_ID: process.env.SITE_ID
  },
  generate: {
    crawler: false,
    concurrency: 1,
    interval: 2000,
    async routes() {
      const pathData = await fetch(
        `${process.env.PROD_API_URL}/api/article/get_all_path_v2?site_id=${process.env.SITE_ID}`
      );
      const path = await pathData.json();
      const categoryPaths = path.data.seo_category
        .filter((item) => item && String(item).trim())
        .map((item) => `/category/${item}/`);
      const detailPaths = path.data.detail
        .filter((item) => item && String(item).trim())
        .map((item) => {
          const s = String(item).trim();
          // SEO文章的item本身就是"分类/urlslug"这种带斜杠的组合，走两段式
          // /:category/:detail路由（router.extendRoutes里注册的那条）；
          // 非SEO文章(投放落地页)没有分类，item不带斜杠，得走
          // pages/detail/_detail.vue默认文件路由/detail/:detail，这也正好
          // 是ad_delivery投放链接实际在用的URL格式(/detail/{id}/?channel=...)
          return s.includes("/") ? `/${s}/` : `/detail/${s}/`;
        });
      const urls = [...categoryPaths, ...detailPaths];
      return urls;
    }
  },
  axios: {
    baseURL:
      process.env.NODE_ENV === "production" ? process.env.PROD_API_URL : process.env.TEST_API_URL
  },
  router: {
    trailingSlash: true,
    extendRoutes(routes, resolve) {
      routes.push({
        name: "category-detail",
        path: "/:category/:detail",
        component: resolve(__dirname, "pages/detail/_detail.vue")
      });
    }
  },
  head: {
    title: "Worldoinfo - Global News at Your Fingertips!",
    meta: [
      {
        name: "version",
        content: process.env.APP_VERSION || "1.0"
      },
      {
        name: "viewport",
        content:
          "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,minimal-ui"
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes"
      },
      {
        name: "mobile-web-app-capable",
        content: "yes"
      },
      {
        hid: "description",
        name: "description",
        content:
          "We are committed to delivering you the latest developments in various fields, including politics, economy, technology, culture, sports, and more.!"
      },
      {
        hid: "keywords",
        name: "keywords",
        content:
          "news, Frontier news, latest news, IT news, sports news, fashion news, car news, healthy news"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Worldoinfo"
      },
      {
        property: "twitter:site_name",
        content: "Worldoinfo"
      },
      {
        hid: "twitter:description",
        name: "twitter:description",
        content:
          "We are committed to delivering you the latest developments in various fields, including politics, economy, technology, culture, sports, and more.!"
      }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]
  },
  image: {
    provider: "cloudflare",
    cloudflare: {
      baseURL: "https://bunchthings.com"
    }
  },
  plugins: [
    { src: "~/plugins/vue-infinite-scroll", ssr: false },
    "~/plugins/axios",
    "~/plugins/global-data",
    "~/plugins/nav-data"
  ],
  components: true,
  buildModules: ["@nuxt/image", "@nuxtjs/pwa"],
  css: ["@/assets/css/fonts.css", "@/assets/css/reset.css", "@/assets/css/common.scss"],
  modules: ["@nuxtjs/axios"],
  // SEO_FLAGS_FILE：详情页构建期(asyncData，process.server && process.static)
  // 顺手记录每个路径的is_seo，供下面sitemap生成时过滤用。这个文件名两处都
  // 引用到（这里 + pages/detail/_detail.vue），改动时要同步改
  hooks: {
    // 每次构建开始时先清空/重建，不能只依赖generate:done跑完后删除——
    // 用的是长期复用的自托管runner，上次构建如果中途崩溃(比如某个detail页
    // asyncData()抛异常)，删除那一步会跑不到，残留的旧数据可能被这一次
    // 构建误读，把已经不存在或is_seo已变化的路径混进新sitemap
    'generate:before'() {
      const nodePath = require('path')
      const fs = require('fs')
      const seoFlagsFile = nodePath.join(__dirname, '.seo-flags.jsonl')
      try {
        fs.writeFileSync(seoFlagsFile, '')
      } catch (e) {}
    },
    'generate:done'(generator) {
      const nodePath = require('path')
      const fs = require('fs')
      const hostname = 'https://worldoinfo.com'
      const today = new Date().toISOString().split('T')[0]
      const seoFlagsFile = nodePath.join(__dirname, '.seo-flags.jsonl')

      // 投放专用落地页文章(is_seo=false/0)不应该出现在sitemap里——读detail页
      // 构建期记录下来的is_seo，只有明确读到false/0才排除；没记录到的路径
      // (分类页本来就不走这套逻辑、或者某个detail页asyncData失败没记录到)
      // 默认放行，不能因为缺记录就误伤
      const seoFlags = new Map()
      try {
        const raw = fs.readFileSync(seoFlagsFile, 'utf8')
        raw.split('\n').filter(Boolean).forEach((line) => {
          try {
            const { path: p, is_seo } = JSON.parse(line)
            seoFlags.set(p, is_seo)
          } catch (e) {}
        })
      } catch (e) {}

      const routes = [...generator.generatedRoutes]
        .filter((r) => r && typeof r === 'string' && !r.includes(':'))
        .filter((r) => {
          if (!seoFlags.has(r)) return true
          const v = seoFlags.get(r)
          return !(v === false || v === 0)
        })

      const urlEntries = routes
        .map(
          (r) =>
            `  <url>\n    <loc>${hostname}${r}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
        )
        .join('\n')

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urlEntries +
        `\n</urlset>`

      const outputPath = nodePath.join(generator.options.generate.dir, 'sitemap.xml')
      fs.writeFileSync(outputPath, xml, 'utf8')

      try {
        fs.unlinkSync(seoFlagsFile)
      } catch (e) {}
    }
  },
  pwa: {
    manifest: {
      name: "Worldoinfo",
      short_name: "Worldoinfo",
      description:
        "We are committed to delivering you the latest developments in various fields, including politics, economy, technology, culture, sports, and more.!"
    },
    icon: {
      source: "./static/icon.png"
    }
  },
  build: {
    loaders: {
      scss: {
        additionalData: '@import "~/assets/css/_mixins.scss";'
      }
    },
    html: {
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    },
    extractCSS: {
      ignoreOrder: true
    },
    optimization: {
      splitChunks: {
        chunks: "all",
        automaticNameDelimiter: ".",
        name: true,
        minSize: 10000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            name: "vendors",
            test: /[\\/]node_modules[\\/]/,
            chunks: "all",
            maxSize: 244000,
            priority: -10
          },
          styles: {
            name: "styles",
            test: /\.(css|vue)$/,
            chunks: "all",
            enforce: true
          }
        }
      },
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true
            },
            output: {
              comments: false
            }
          }
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: { inline: false },
            discardComments: { removeAll: true }
          }
        })
      ]
    }
  },
  purgeCSS: {
    whitelistPatterns: [
      /^swiper-container/,
      /^swiper-wrapper/,
      /::v-deep/,
      /\/deep\//,
      />>>/
    ]
  }
};
