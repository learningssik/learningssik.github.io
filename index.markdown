---
layout: default
title: learningssik's Blog
---

<section class="hero">
  <h1>안녕하세요! 👋</h1>
  <h2><span class="highlight">데이터 엔지니어 learningssik</span>입니다</h2>
  <p>빅데이터 처리와 머신러닝 파이프라인 구축에 전문성을 가지고 있는 한국의 데이터 엔지니어입니다 🇰🇷</p>
</section>

<h2>최근 글</h2>
<div class="posts-list">
  {%- assign recent_posts = site.public | sort: "date" | reverse | limit: 6 -%}
  {%- for post in recent_posts -%}
  <article class="post-card">
    <h3 class="post-title">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h3>
    <div class="post-meta">
      <time class="post-date">{{ post.date | date: "%Y년 %m월 %d일" }}</time>
      <span class="post-category">{{ post.category }}</span>
    </div>
    {%- if post.excerpt -%}
    <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 150 }}</p>
    {%- endif -%}
    <a href="{{ post.url | relative_url }}" class="read-more">자세히 보기 →</a>
  </article>
  {%- endfor -%}
</div>
