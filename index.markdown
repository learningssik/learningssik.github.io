---
layout: default
title: learningssik's Blog
---

<div class="hero">
  <div class="hero-content">
    <div class="hero-text">
      <h1 class="hero-title">
        <span class="gradient-text">안녕하세요!</span>
        <br>데이터 엔지니어 <strong>learningssik</strong>입니다
      </h1>
      <p class="hero-description">
        빅데이터 처리와 머신러닝 파이프라인 구축에 전문성을 가지고 있는<br>
        <img src="https://raw.githubusercontent.com/learningssik/learningssik/main/south-korea.png" width="20"/> <strong>한국</strong>의 데이터 엔지니어입니다
      </p>
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-number">{{ site.public | size }}</div>
          <div class="stat-label">게시글</div>
        </div>
        <div class="stat">
          <div class="stat-number">3</div>
          <div class="stat-label">카테고리</div>
        </div>
      </div>
    </div>
  </div>
  <div class="hero-bg">
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>
  </div>
</div>

<div class="content">
  <div class="section">
    <div class="section-header">
      <h2>📝 최근 글</h2>
      <div class="section-line"></div>
    </div>
    <div class="posts-grid">
      {%- assign recent_posts = site.public | sort: "date" | reverse | limit: 6 -%}
      {%- for post in recent_posts -%}
      <article class="post-card">
        <div class="post-content">
          <h3 class="post-title">
            <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          </h3>
          <div class="post-meta">
            <time class="post-date">{{ post.date | date: "%Y년 %m월 %d일" }}</time>
            <span class="post-category">{{ post.category }}</span>
          </div>
          {%- if post.excerpt -%}
          <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 100 }}</p>
          {%- endif -%}
        </div>
        <div class="post-footer">
          <a href="{{ post.url | relative_url }}" class="read-more">읽기 →</a>
        </div>
      </article>
      {%- endfor -%}
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>🏷️ 카테고리</h2>
      <div class="section-line"></div>
    </div>
    <div class="categories-grid">
      <a href="/tech/" class="category-card tech">
        <div class="category-icon">💻</div>
        <div class="category-content">
          <h3>기술</h3>
          <p>데이터 엔지니어링, 머신러닝, 개발 관련 글</p>
          <div class="category-count">{{ site.public | where: "category", "tech" | size }}개 글</div>
        </div>
      </a>
      <a href="/projects/" class="category-card projects">
        <div class="category-icon">🚀</div>
        <div class="category-content">
          <h3>프로젝트</h3>
          <p>개인/팀 프로젝트, 포트폴리오</p>
          <div class="category-count">{{ site.public | where: "category", "projects" | size }}개 글</div>
        </div>
      </a>
      <a href="/daily/" class="category-card daily">
        <div class="category-icon">📝</div>
        <div class="category-content">
          <h3>일상</h3>
          <p>개발 일상, 학습 기록, 생각</p>
          <div class="category-count">{{ site.public | where: "category", "daily" | size }}개 글</div>
        </div>
      </a>
    </div>
  </div>
</div>

<style>
/* Amazing Website Style */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #fafbfc;
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.hero-text {
  color: white;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-description {
  font-size: 1.25rem;
  margin-bottom: 3rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.8;
  font-weight: 500;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 80%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 30%;
  right: 30%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.content {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 4rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2d3748;
}

.section-line {
  width: 60px;
  height: 4px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  margin: 0 auto;
  border-radius: 2px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.post-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(45deg, #667eea, #764ba2);
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.post-title {
  margin-bottom: 1rem;
}

.post-title a {
  color: #2d3748;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.post-title a:hover {
  color: #667eea;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.post-date {
  color: #718096;
}

.post-category {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.post-excerpt {
  color: #4a5568;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.post-footer {
  display: flex;
  justify-content: flex-end;
}

.read-more {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.read-more:hover {
  color: #764ba2;
  transform: translateX(4px);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: all 0.3s ease;
}

.category-card.tech::before {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
}

.category-card.projects::before {
  background: linear-gradient(45deg, #10b981, #059669);
}

.category-card.daily::before {
  background: linear-gradient(45deg, #f59e0b, #d97706);
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.category-card.tech:hover::before {
  height: 8px;
}

.category-card.projects:hover::before {
  height: 8px;
}

.category-card.daily:hover::before {
  height: 8px;
}

.category-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.category-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.category-content p {
  color: #718096;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.category-count {
  background: #f7fafc;
  color: #4a5568;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-block;
}

@media (max-width: 768px) {
  .hero-stats {
    gap: 2rem;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .category-card {
    flex-direction: column;
    text-align: center;
  }
  
  .content {
    padding: 2rem 1rem;
  }
}
</style>