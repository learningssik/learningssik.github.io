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
/* Glassmorphism & Rounded Design */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  min-height: 100vh;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
  z-index: -1;
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 2rem 0;
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  padding: 4rem 3rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 32px;
  z-index: -1;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #ff9a9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 4s ease-in-out infinite;
  background-size: 200% 200%;
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
  font-weight: 300;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 2rem;
}

.stat {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9rem;
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-line {
  width: 80px;
  height: 4px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  margin: 0 auto;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.post-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
  border-radius: 24px 24px 0 0;
}

.post-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.post-title {
  margin-bottom: 1rem;
}

.post-title a {
  color: white;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-title a:hover {
  color: #4ecdc4;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.post-date {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
}

.post-category {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-excerpt {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-weight: 300;
}

.post-footer {
  display: flex;
  justify-content: flex-end;
}

.read-more {
  color: #4ecdc4;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.read-more:hover {
  color: #ff6b6b;
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.category-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  padding: 2.5rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  transition: all 0.4s ease;
  border-radius: 28px 28px 0 0;
}

.category-card.tech::before {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8, #60a5fa);
}

.category-card.projects::before {
  background: linear-gradient(45deg, #10b981, #059669, #34d399);
}

.category-card.daily::before {
  background: linear-gradient(45deg, #f59e0b, #d97706, #fbbf24);
}

.category-card:hover {
  transform: translateY(-12px) scale(1.03);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.category-card.tech:hover::before {
  height: 12px;
}

.category-card.projects:hover::before {
  height: 12px;
}

.category-card.daily:hover::before {
  height: 12px;
}

.category-icon {
  font-size: 3.5rem;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.category-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-content p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
  line-height: 1.5;
  font-weight: 300;
}

.category-count {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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