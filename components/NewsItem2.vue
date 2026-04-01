<template>
  <CustomLink class="news-style-2" :to="`/detail/${item.path}/`">
    <NuxtImg
      format="auto"
      fit="cover"
      width="658"
      height="440"
      :src="item.cover"
      :alt="item.name"
      loading="lazy"
      class="img"
    />
    <p class="category">{{ capitalizeFirstLetter(item.seo_category_name || item.category_locale_name) }}</p>
    <p class="title">{{ item.name }}</p>
    <div class="news-author">
      <div>{{ item.author.name }}</div>
      <div>{{ item.updated_at }}</div>
    </div>
  </CustomLink>
</template>

<script>
import { capitalizeFirstLetter } from "~/utils/utils";
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  methods: {
    capitalizeFirstLetter
  }
};
</script>

<style lang="scss" scoped>
.news-style-2 {
  padding-right: 16px;
  .img {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 8px 8px 8px 8px;
  }
  .category {
    display: inline-block;
    padding: 0 4px;
    height: 20px;
    line-height: 20px;
    font-size: 12px;
    font-family: "rssb";
    color: $color1;
    background: rgba($color1, 0.2);
    border-radius: 4px 4px 4px 4px;
    margin: 10px 0 0;
  }
  .title {
    font-size: 16px;
    font-family: "se3";
    line-height: 22px;
    @include ellipsis(3);
  }
  .news-author {
    display: none;
  }
  &:hover {
    .title {
      // color: $color1;
      text-decoration: underline;
    }
  }
}
@media screen and (max-width: 1100px) {
  .news-style-2 {
    width: 100%;
  }
}
@media screen and (max-width: 750px) {
  .news-style-2 {
    padding-right: 0;
    padding-bottom: vw(32);
    border-bottom: vw(2) solid #ececee;
    .img {
      width: 100%;
      height: auto;
      border-radius: vw(16);
    }
    .title {
      margin: vw(8) 0 vw(8);
      font-size: vw(26);
      line-height: vw(36);
    }
    .news-author {
      display: flex;
      gap: vw(12);
      font-size: vw(22);
      font-weight: 300;
      padding-bottom: vw(4);
      @include author-icon(vw(22), vw(22));
    }
  }
}
</style>
