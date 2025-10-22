---
layout: default
title: learningssik's Blog
---

<div class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">안녕하세요! 👋</h1>
    <h2 class="hero-subtitle">데이터 엔지니어 <strong>learningssik</strong>입니다</h2>
    <p class="hero-description">
      빅데이터 처리와 머신러닝 파이프라인 구축에 전문성을 가지고 있는<br>
      <img src="https://raw.githubusercontent.com/learningssik/learningssik/main/south-korea.png" width="20"/> <strong>한국</strong>의 데이터 엔지니어입니다
    </p>
    <div class="hero-stats">
      <div class="stat-item">
        <span class="stat-number">{{ site.public | size }}</span>
        <span class="stat-label">게시글</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">3</span>
        <span class="stat-label">카테고리</span>
      </div>
    </div>
  </div>
</div>

<div class="main-content-section">
  <div class="content-grid">
    <div class="recent-posts-card">
      <h3>📝 최근 글</h3>
      <div class="posts-list">
        {%- assign recent_posts = site.public | sort: "date" | reverse | limit: 5 -%}
        {%- for post in recent_posts -%}
        <div class="post-item">
          <a href="{{ post.url | relative_url }}" class="post-link">{{ post.title }}</a>
          <span class="post-date">{{ post.date | date: "%m/%d" }}</span>
        </div>
        {%- endfor -%}
      </div>
    </div>
    
    <div class="categories-card">
      <h3>🏷️ 카테고리</h3>
      <div class="category-links">
        <a href="/tech/" class="category-link tech">
          <span class="category-icon">💻</span>
          <span class="category-name">기술</span>
          <span class="category-count">{{ site.public | where: "category", "tech" | size }}개</span>
        </a>
        <a href="/projects/" class="category-link projects">
          <span class="category-icon">🚀</span>
          <span class="category-name">프로젝트</span>
          <span class="category-count">{{ site.public | where: "category", "projects" | size }}개</span>
        </a>
        <a href="/daily/" class="category-link daily">
          <span class="category-icon">📝</span>
          <span class="category-name">일상</span>
          <span class="category-count">{{ site.public | where: "category", "daily" | size }}개</span>
        </a>
      </div>
    </div>
  </div>
</div>

<style>
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
  margin: -30px -30px 40px -30px;
  border-radius: 0 0 20px 20px;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.hero-title {
  font-size: 3em;
  margin-bottom: 20px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.5em;
  margin-bottom: 20px;
  font-weight: 400;
  opacity: 0.9;
}

.hero-description {
  font-size: 1.1em;
  line-height: 1.6;
  margin-bottom: 40px;
  opacity: 0.8;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.main-content-section {
  margin-top: 40px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.recent-posts-card,
.categories-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 1px solid #f0f0f0;
}

.recent-posts-card h3,
.categories-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3em;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.post-item:last-child {
  border-bottom: none;
}

.post-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  flex: 1;
}

.post-link:hover {
  color: #667eea;
}

.post-date {
  color: #999;
  font-size: 0.9em;
  font-weight: 500;
}

.category-links {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.category-link {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.category-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.category-link.tech {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #1976d2;
}

.category-link.projects {
  background: linear-gradient(135deg, #e8f5e8, #a5d6a7);
  color: #388e3c;
}

.category-link.daily {
  background: linear-gradient(135deg, #fff3e0, #ffcc02);
  color: #f57c00;
}

.category-icon {
  font-size: 1.5em;
  margin-right: 15px;
}

.category-name {
  flex: 1;
  font-weight: 600;
  font-size: 1.1em;
}

.category-count {
  background: rgba(255,255,255,0.7);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: 500;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: 2.5em;
  }
  
  .hero-stats {
    gap: 20px;
  }
}
</style>