---
layout: default
title: learningssik's Blog
---

<div class="hero-section">
  <div class="container">
    <div class="hero-content">
      <h1 class="hero-title">
        안녕하세요! 👋<br>
        <span class="highlight">데이터 엔지니어 learningssik</span>입니다
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
</div>

<!-- 왼쪽 사이드바 -->
<div class="left-sidebar">
  <div class="container">
    <div class="sidebar-content">
      <div class="sidebar-section">
        <h3 class="sidebar-title">🏷️ 카테고리</h3>
        <div class="category-list">
          <a href="/tech/" class="category-item tech">
            <div class="category-icon">💻</div>
            <div class="category-info">
              <div class="category-name">기술</div>
              <div class="category-count">{{ site.public | where: "category", "tech" | size }}개 글</div>
            </div>
          </a>
          <a href="/projects/" class="category-item projects">
            <div class="category-icon">🚀</div>
            <div class="category-info">
              <div class="category-name">프로젝트</div>
              <div class="category-count">{{ site.public | where: "category", "projects" | size }}개 글</div>
            </div>
          </a>
          <a href="/daily/" class="category-item daily">
            <div class="category-icon">📝</div>
            <div class="category-info">
              <div class="category-name">일상</div>
              <div class="category-count">{{ site.public | where: "category", "daily" | size }}개 글</div>
            </div>
          </a>
        </div>
      </div>
      
      <div class="sidebar-section">
        <h3 class="sidebar-title">✍️ 새 글 작성</h3>
        <div class="write-post-section">
          <div class="category-buttons">
            <a href="https://github.com/learningssik/learningssik.github.io/new/main/_public/tech/?filename=YYYY-MM-DD-글제목.md&value=---%0Atitle: 여기에 글 제목을 입력하세요%0Adate: YYYY-MM-DD%0Acategory: tech%0Aexcerpt: 글 요약%0A---%0A%0A여기에 본문을 작성하세요." class="btn category-btn tech" target="_blank">💻 기술</a>
            <a href="https://github.com/learningssik/learningssik.github.io/new/main/_public/projects/?filename=YYYY-MM-DD-글제목.md&value=---%0Atitle: 여기에 글 제목을 입력하세요%0Adate: YYYY-MM-DD%0Acategory: projects%0Aexcerpt: 글 요약%0A---%0A%0A여기에 본문을 작성하세요." class="btn category-btn projects" target="_blank">🚀 프로젝트</a>
            <a href="https://github.com/learningssik/learningssik.github.io/new/main/_public/daily/?filename=YYYY-MM-DD-글제목.md&value=---%0Atitle: 여기에 글 제목을 입력하세요%0Adate: YYYY-MM-DD%0Acategory: daily%0Aexcerpt: 글 요약%0A---%0A%0A여기에 본문을 작성하세요." class="btn category-btn daily" target="_blank">📝 일상</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- 메인 콘텐츠 -->
<div class="main-content">
  <div class="container">
    <section class="posts-section">
      <h2 class="section-title">📝 최근 글</h2>
      <div class="posts-list">
        {%- assign recent_posts = site.public | sort: "date" | reverse | limit: 6 -%}
        {%- for post in recent_posts -%}
        <article class="post-card">
          <div class="post-header">
            <h3 class="post-title">
              <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            </h3>
            <div class="post-meta">
              <time class="post-date">{{ post.date | date: "%Y년 %m월 %d일" }}</time>
              <span class="post-category">{{ post.category }}</span>
            </div>
          </div>
          {%- if post.excerpt -%}
          <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 150 }}</p>
          {%- endif -%}
          <div class="post-footer">
            <a href="{{ post.url | relative_url }}" class="read-more">자세히 보기 →</a>
          </div>
        </article>
        {%- endfor -%}
      </div>
    </section>
  </div>
</div>
