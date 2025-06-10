<template>
  <div class="page">
    <Header :lang="newInfo.language" />
    <article class="article">
      <h1 class="article-title">{{ newInfo.name }}</h1>
      <div class="news-detail">{{ newInfo.first_paragraph }}</div>
      <div id="relatedsearches1"> </div>
      <NuxtImg
        format="auto"
        fit="cover"
        width="900"
        :src="newInfo.cover"
        :alt="newInfo.name"
        class="article-img"
        preload
      />
      <!-- eslint-disable vue/no-v-html -->
      <!--      <div class="news-detail" v-html="newInfo.content"></div>-->
      <div class="news-detail">
        <div v-for="(item, index) in contentItems" :key="index">
          <div v-if="item.type === 'content'" v-html="item.content"></div>
          <div v-else id="relatedsearches2"></div>
        </div>
      </div>
      <!--eslint-enable-->
    </article>
    <Footer :lang="newInfo.language" />
  </div>
</template>

<script>
export default {
  async asyncData({ $axios, params, env }) {
    const path = params.detail;
    const lastDashIndex = path.lastIndexOf("-");
    const id = path.substring(lastDashIndex + 1, path.length);
    const [data] = await Promise.all([
      $axios.$get("/api/article/detail", {
        params: {
          site_id: env.SITE_ID,
          article_id: id
        }
      })
    ]);
    data.content = data.content.replace(/<\/h4><p><br><br>|<br><br><\/p><h4>/g, (match) => {
      return match.includes("</h4><p>") ? "</h4><p>" : "</p><h4>";
    });
    return { newInfo: data };
  },
  data() {
    return {
      channelId: "",
      maxScrollPercentage: 0
    };
  },
  head() {
    return {
      htmlAttrs: {
        lang: this.newInfo.language
      },
      title: this.newInfo.name + " - Worldoinfo",
      meta: [
        {
          hid: "description",
          name: "description",
          content: this.newInfo.first_paragraph
        },
        {
          hid: "keywords",
          name: "keywords",
          content: this.newInfo.terms
        },
        {
          hid: "og:title",
          property: "og:title",
          content: this.newInfo.name
        },
        {
          hid: "og:description",
          property: "og:description",
          content: this.newInfo.first_paragraph
        },
        {
          hid: "og:url",
          property: "og:url",
          content: `https://worldoinfo.com/detail/${this.newInfo.path}/`
        },
        {
          hid: "og:locale",
          property: "og:locale",
          content: this.newInfo.language
        },
        {
          hid: "og:image",
          property: "og:image",
          content: this.newInfo.cover
        },
        {
          hid: "og:type",
          property: "og:type",
          content: "article"
        }
      ]
    };
  },
  computed: {
    contentItems() {
      const self = this;
      const parts = this.newInfo.content.split(/(<p[^>]*>.*?<\/p>)/gs);
      let charCount = 0;
      const items = [];
      const buffer = parts
        .filter((part) => !(!part.trim() || !part.startsWith("<p")))
        .map((part) => part.replace(/<[^>]+>/g, ""));
      // eslint-disable-next-line no-unused-vars
      let splitNum = Math.floor(buffer.join("").length / 3);
      parts.forEach((part) => {
        if (!part.trim()) return; // 跳过空字符串

        // 添加内容
        items.push({
          type: "content",
          content: part
        });

        // 如果不是p标签，不计算字符数和插入广告
        if (!part.startsWith("<p")) return;

        // 计算纯文本长度
        const textContent = part.replace(/<[^>]+>/g, "");
        charCount += textContent.length;
        if (charCount >= splitNum && self.$route.query.doubleEntries === "true") {
          items.push({
            type: "ad"
          });
          splitNum = buffer.join("").length + 1;
        }
      });

      return items;
    }
  },
  mounted: function () {
    // 获取 URL 查询参数
    const searchParams = new URLSearchParams(window.location.search);
    // AdSense 配置参数
    if (searchParams.has("channel")) {
      this.channelId = searchParams.get("channel");
    } else {
      this.channelId = this.newInfo.channel || "";
      if (this.channelId !== "") {
        searchParams.set("channel", this.channelId);
        const newUrl = `${window.location.origin}${
          window.location.pathname
        }?${searchParams.toString()}`;
        window.history.replaceState({}, "", newUrl);
      }
    }

    setTimeout(() => {
      this.addAdSenseScript();
    }, 0);

    this.handleListenerScroll();

    window.addEventListener("beforeunload", () => {
      window.dataLayer.push({
        event: "scroll_depth" + "_" + this.handleFormat(this.maxScrollPercentage),
        hi_depth: this.handleFormat(this.maxScrollPercentage)
      });
    });
  },
  methods: {
    addAdSenseScript() {
      const self = this;
      console.log("addAdSenseScript", this.newInfo.terms);
      // 获取 URL 查询参数
      const searchParams = new URLSearchParams(window.location.search);
      let terms = searchParams.has("terms") ? searchParams.get("terms") : "";
      terms = terms.replace(/[，]/g, ",");
      const paramKeys = [];
      // 遍历查询参数并将其添加到 paramKeys 数组中
      for (const param of searchParams) {
        paramKeys.push(param[0]);
      }
      const ignoredPageParams = paramKeys.join(",");

      let adSenseConfig = {
        channel: this.channelId,
        pubId: "partner-pub-1853000876464912",
        styleId: "3911226554",
        adsafe: "low",
        ignoredPageParams,
        relatedSearchTargeting: "content",
        resultsPageBaseUrl: `${window.location.origin}/search/?afs&channel=${this.channelId}${
          self.$route.query?.doubleEntries === "true" ? "&doubleEntries=true" : ""
        }`,
        resultsPageQueryParam: "query",
        terms: terms || this.newInfo.terms,
        referrerAdCreative: terms || this.newInfo.referrer_ad_creative,
        ivt: false,
        adtest: "off"
      };
      if (window.location.hostname.includes("s.")) {
        adSenseConfig = {
          channel: this.channelId,
          pubId: "partner-pub-1853000876464912",
          styleId: "3911226554",
          adsafe: "low",
          ignoredPageParams,
          relatedSearchTargeting: "query",
          query: terms ? terms.split(",")[0] : this.newInfo.terms.split(",")[0],
          ivt: false,
          resultsPageBaseUrl: `${window.location.origin}/search/?afs&channel=${this.channelId}${
            self.$route.query?.doubleEntries === "true" ? "&doubleEntries=true" : ""
          }`,
          resultsPageQueryParam: "query"
        };
      }

      // 初始化 _googCsa 并加载相关搜索广告
      // eslint-disable-next-line no-undef
      _googCsa(
        "relatedsearch",
        adSenseConfig,
        {
          container: "relatedsearches1", // 广告容器 ID
          relatedSearches: self.$route.query.doubleEntries === "true" ? 5 : 10, // 相关搜索广告数量
          adLoadedCallback: function (loaded, response, isExperimentVariant, callbackOptions) {
            console.log("adLoadedCallback", loaded, response, isExperimentVariant, callbackOptions);
            if (response) {
              // eslint-disable-next-line no-undef
              dataLayer.push({ event: "C_AC" }); // 事件推送到 dataLayer
              try {
                let numberOfKeys = 0;
                let concatenatedKeys = "miss";
                if (callbackOptions.termPositions) {
                  const keys = Object.keys(callbackOptions.termPositions);
                  numberOfKeys = keys.length;
                  concatenatedKeys = keys.join(",");
                }
                const element = document.getElementById("master-1");
                const height = parseFloat(element.style.height);
                const result = Math.round(height / 105);

                // eslint-disable-next-line no-undef
                dataLayer.push({
                  event: "C_AC_IN",
                  num: result,
                  queryNum: self.$route.query.doubleEntries === "true" ? 5 : 10,
                  key1: numberOfKeys,
                  key2: concatenatedKeys
                }); // 事件推送到 dataLayer
              } catch (e) {
                console.log(e);
              }
            }
          }
        },
        self.$route.query?.doubleEntries === "true" && {
          container: "relatedsearches2", // 广告容器 ID
          relatedSearches: 5, // 相关搜索广告数量
          adLoadedCallback: function (loaded, response, isExperimentVariant, callbackOptions) {
            if (response) {
              // eslint-disable-next-line no-undef
              dataLayer.push({ event: "C_AC_SECOND" }); // 事件推送到 dataLayer
              try {
                let numberOfKeys = 0;
                let concatenatedKeys = "miss";
                if (callbackOptions.termPositions) {
                  const keys = Object.keys(callbackOptions.termPositions);
                  numberOfKeys = keys.length;
                  concatenatedKeys = keys.join(",");
                }
                const element = document.getElementById("relatedsearches2");
                const height = parseFloat(element.clientHeight);
                const result = Math.round(height / 105);

                // eslint-disable-next-line no-undef
                dataLayer.push({
                  event: "C_AC_IN_SECOND",
                  queryNum: 5,
                  num: result,
                  key1: numberOfKeys,
                  key2: concatenatedKeys
                }); // 事件推送到 dataLayer
              } catch (e) {
                console.log(e);
              }
            }
          }
        }
      );
    },
    handleListenerScroll() {
      const self = this;
      window.addEventListener("scroll", (e) => {
        // 获取当前滚动位置
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

        // 获取文档总高度（减去视口高度得到可滚动高度）
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
        // 计算滚动百分比（0-100）
        const currentScrollPercentage =
          scrollHeight > clientHeight
            ? Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100).toFixed(0) // 确保不超过100%
            : 0;
        if (Number(currentScrollPercentage) > Number(self.maxScrollPercentage)) {
          self.maxScrollPercentage = currentScrollPercentage;
        }
      });
    },
    handleFormat(val) {
      if (val <= 20) {
        return "0_20%";
      } else if (val >= 80) {
        return "81_100%";
      } else {
        return `${Math.floor(val / 20) * 2}1_${Math.floor(val / 20) * 2 + 2}0%`;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.article-img {
  width: 100%;
  margin-bottom: 1em;
}
.article {
  padding-bottom: 32px;
  border-bottom: 1px solid #ececee;
  min-height: calc(100vh - 72px - 56px - 64px);
}
.article-title {
  font-size: 26px;
  font-family: "rssb";
  font-weight: bold;
  line-height: 30px;
  margin-bottom: 24px;
}
.read-more {
  line-height: 4;
}
.hide {
  display: none;
  &.show {
    display: block;
  }
}
.news-box-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.google-ad-preload {
  margin-bottom: 4px;
}
@media screen and (max-width: 750px) {
  .news-box-2 {
    display: flex;
    flex-wrap: wrap;
    gap: vw(32);
  }
  .article {
    line-height: vw(38);
    padding-bottom: vw(32);
    border-bottom: vw(2) solid #ececee;
    min-height: calc(100vh - vw(304));
  }
  .article-title {
    font-size: vw(40);
    line-height: vw(56);
    margin-bottom: vw(32);
  }
  .article-desc {
    margin-bottom: vw(48);
  }
  .google-ad-preload {
    margin-bottom: vw(10);
  }
}
</style>
