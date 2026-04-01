<template>
  <div class="page">
    <Header />
    <main class="main">
      <div class="layout-left">
        <div class="page-layout">
          <breadcrumb :info="newInfo"></breadcrumb>
          <article class="article" v-if="newInfo">
            <h1 class="article-title">{{ newInfo.name }}</h1>
            <div class="news-author">
              <div>{{ newInfo.author && newInfo.author.name }}</div>
              <div>{{ newInfo.updated_at }}</div>
            </div>
            <div class="news-detail first_paragraph">{{ newInfo.first_paragraph }}</div>

            <!-- Article Summary Box -->
            <div class="article-summary" v-if="newInfo.seo_desc">
              <div class="summary-icon">📋</div>
              <div class="summary-content">
                <h3 class="summary-title">Article Summary</h3>
                <p class="summary-text">{{ newInfo.seo_desc }}</p>
              </div>
            </div>

            <div id="relatedsearches1"> </div>
            <aside class="toc-container" v-if="toc.length">
              <h3 class="toc-title">Table of Contents</h3>
              <nav class="toc-nav">
                <ul class="toc-list">
                  <li
                    v-for="item in toc"
                    :key="item.id"
                    :class="['toc-item', `toc-level-${item.level}`]"
                    @click="scrollToAnchor(item.id)"
                  >
                    {{ item.text }}
                  </li>
                </ul>
              </nav>
            </aside>
            <NuxtImg
              format="auto"
              fit="cover"
              width="600"
              :src="newInfo.cover"
              :alt="newInfo.cover_seo_alt || newInfo.name"
              class="article-img"
              preload
            />
            <!-- eslint-disable vue/no-v-html -->
            <div class="news-detail" v-html="htmlWithAnchor"></div>
            <!--eslint-enable-->

            <!-- FAQ Section -->
            <section class="faq-section" v-if="articleFaqs && articleFaqs.length">
              <h2 class="faq-title">Related Questions</h2>
              <div class="faq-list">
                <div v-for="(faq, index) in articleFaqs" :key="index" class="faq-item">
                  <h3 class="faq-question">{{ faq.question }}</h3>
                  <p class="faq-answer">{{ faq.answer }}</p>
                </div>
              </div>
            </section>
          </article>
          <section v-if="newInfo && newInfo.related_articles && newInfo.related_articles.length">
            <h3 class="title-h2">Related Articles</h3>
            <div class="related-articles">
              <news-item-5 v-for="(item, i) in newInfo.related_articles" :key="i" :item="item">
              </news-item-5>
            </div>
          </section>
        </div>
      </div>
      <div class="layout-right">
        <right-side-box :rec-news="recNews" :trending-news="trendingNews" />
      </div>
    </main>
    <footer-seo :info="newInfo || {}" />
  </div>
</template>

<script>
import { shuffleArray } from "../../utils/utils";
import Breadcrumb from "../../components/Breadcrumb";
import { processHtmlWithToc, generateNestedToc } from "../../utils/cheerio-toc.js";

export default {
  components: { Breadcrumb },
  async asyncData({ $axios, params, env }) {
    const slug = params.slug;
    const lastDashIndex = slug.lastIndexOf("-");
    const id = slug.substring(lastDashIndex + 1, slug.length);

    try {
      let data = null;
      try {
        data = await $axios.$get("/api/article/detail", {
          params: {
            site_id: env.SITE_ID,
            article_id: id,
            related_num: 3
          }
        });
      } catch (detailError) {
        console.error(`Failed to fetch detail for ID ${id}:`, detailError);
        return {
          newInfo: null,
          floatArray: [],
          toc: [],
          id,
          htmlWithAnchor: "",
          recNews: [],
          trendingNews: [],
          articleFaqs: []
        };
      }

      if (!data || !data.content) {
        return {
          newInfo: null,
          floatArray: [],
          toc: [],
          id,
          htmlWithAnchor: "",
          recNews: [],
          trendingNews: [],
          articleFaqs: []
        };
      }

      let recNewsResponse = null;
      let trendingNewsResponse = null;
      let allResponse = null;

      try {
        [recNewsResponse, trendingNewsResponse, allResponse] = await Promise.all([
          $axios.$get("/api/article/menu", {
            params: { site_id: env.SITE_ID, mod_id: "rec" }
          }).catch(() => null),
          $axios.$get("/api/article/get_all_articles", {
            params: { site_id: env.SITE_ID, size: 4, page: 1 }
          }).catch(() => null),
          $axios.$get("/api/article/menu", {
            params: { site_id: env.SITE_ID, mod_id: "all", page: 1, size: 20 }
          }).catch(() => null)
        ]);
      } catch (error) {
        console.error("Parallel fetch error:", error);
      }

      const extractList = (response) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.list) return response.list;
        if (response.data && response.data.list) return response.data.list;
        if (response.data && Array.isArray(response.data)) return response.data;
        if (response.items) return response.items;
        if (response.result) return response.result;
        return [];
      };

      data.content = data.content.replace(/font-family:\s*['"]? 宋体 ['"]?;/g, "");
      data.content = data.content.replace(/<\/h4><p><br><br>|<br><br><\/p><h4>/g, (match) => {
        return match.includes("</h4><p>") ? "</h4><p>" : "</p><h4>";
      });

      const { toc: flatToc, htmlWithAnchor } = processHtmlWithToc(data.content, [2]);
      const toc = generateNestedToc(flatToc);

      const articleFaqs = data.faqs || [
        {
          question: "Want to learn more about this topic?",
          answer: "Worldoinfo covers the latest news and information across politics, economy, technology, culture, sports, and more."
        },
        {
          question: "Where can I find more related articles?",
          answer: "Browse our category pages to find more articles on topics that interest you."
        }
      ];

      return {
        newInfo: data,
        floatArray: shuffleArray((allResponse && allResponse.list && allResponse.list.slice()) || []),
        toc,
        id,
        htmlWithAnchor,
        recNews: extractList(recNewsResponse),
        trendingNews: extractList(trendingNewsResponse),
        articleFaqs
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return {
        newInfo: null,
        floatArray: [],
        toc: [],
        id,
        htmlWithAnchor: "",
        recNews: [],
        trendingNews: [],
        articleFaqs: []
      };
    }
  },
  data() {
    return {
      channelId: ""
    };
  },
  head() {
    return {
      title: this.newInfo && this.newInfo.name ? this.newInfo.name + " - Worldoinfo" : "Worldoinfo",
      meta: [
        {
          hid: "description",
          name: "description",
          content: this.newInfo && this.newInfo.seo_desc
        },
        {
          hid: "og:title",
          property: "og:title",
          content: this.newInfo && this.newInfo.seo_title
        },
        {
          hid: "og:description",
          property: "og:description",
          content: this.newInfo && this.newInfo.seo_desc
        },
        {
          hid: "og:url",
          property: "og:url",
          content: `https://worldoinfo.com/${this.newInfo && this.newInfo.path_v2}/`
        },
        {
          hid: "og:locale",
          property: "og:locale",
          content: this.newInfo && this.newInfo.language
        },
        {
          hid: "og:image",
          property: "og:image",
          content: `https://bunchthings.com/cdn-cgi/image/w=600,f=auto,fit=cover/${this.newInfo && this.newInfo.cover}`
        },
        {
          hid: "og:type",
          property: "og:type",
          content: "article"
        },
        {
          hid: "twitter:image",
          property: "twitter:image",
          content: `https://bunchthings.com/cdn-cgi/image/w=600,f=auto,fit=cover/${this.newInfo && this.newInfo.cover}`
        },
        {
          hid: "twitter:title",
          property: "twitter:title",
          content: this.newInfo && this.newInfo.seo_title
        },
        {
          hid: "twitter:description",
          property: "twitter:description",
          content: this.newInfo && this.newInfo.seo_desc
        }
      ],
      link: [
        {
          rel: "canonical",
          href: `https://worldoinfo.com/${this.newInfo && this.newInfo.path_v2}/`
        }
      ]
    };
  },
  methods: {
    scrollToAnchor(id) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }
};
</script>
