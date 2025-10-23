---
layout: default
title: Wonlog
---

<div class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">
      안녕하세요! 👋<br>
      <span class="highlight">데이터 엔지니어 wonsik</span>입니다
    </h1>
    <p class="hero-description">
      빅데이터 처리와 머신러닝 파이프라인 구축에 전문성을 가지고 있는<br>
      <img src="https://raw.githubusercontent.com/learningssik/learningssik/main/south-korea.png" width="20"/> <strong>한국</strong>의 데이터 엔지니어입니다
    </p>
    <div class="hero-stats">
      <div class="stat-item">
        <div class="stat-number">{{ site.public | size }}</div>
        <div class="stat-label">게시글</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">3</div>
        <div class="stat-label">카테고리</div>
      </div>
    </div>
  </div>
</div>

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
