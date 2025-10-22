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

<div class="main-content">
  <div class="container">
    <div class="content-grid">
      <div class="main-column">
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
      
      <div class="sidebar">
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
      </div>
    </div>
  </div>
</div>

<style>
/* Modern Blog Template - Clean & Professional */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  line-height: 1.6;
  color: #333;
  background: #fafafa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.2rem;
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

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: #4ecdc4;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 500;
}

/* Main Content */
.main-content {
  padding: 4rem 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
}

/* Posts Section */
.posts-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #2d3748;
  border-bottom: 3px solid #667eea;
  padding-bottom: 0.5rem;
  display: inline-block;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 12px 12px 0 0;
}

.post-title {
  margin-bottom: 1rem;
}

.post-title a {
  color: #2d3748;
  text-decoration: none;
  font-size: 1.3rem;
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
  background: #667eea;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
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
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: #f7fafc;
}

.read-more:hover {
  color: #764ba2;
  background: #edf2f7;
}

/* Sidebar */
.sidebar {
  position: sticky;
  top: 2rem;
}

.sidebar-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
}

.sidebar-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #2d3748;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.category-item:hover {
  background: #f7fafc;
  border-color: #e2e8f0;
  transform: translateX(4px);
}

.category-item.tech:hover {
  background: #e6f3ff;
  border-color: #3b82f6;
}

.category-item.projects:hover {
  background: #f0fdf4;
  border-color: #10b981;
}

.category-item.daily:hover {
  background: #fffbeb;
  border-color: #f59e0b;
}

.category-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.category-count {
  font-size: 0.9rem;
  color: #718096;
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .hero-stats {
    gap: 2rem;
  }
  
  .stat-item {
    padding: 1rem 1.5rem;
  }
  
  .hero-section {
    padding: 60px 0;
  }
  
  .main-content {
    padding: 2rem 0;
  }
  
  .sidebar {
    position: static;
  }
}

@media (max-width: 480px) {
  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .post-card {
    padding: 1.5rem;
  }
  
  .sidebar-section {
    padding: 1.5rem;
  }
}
</style>