---
layout: default
title: learningssik's Blog
---

<div class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">안녕하세요! 👋</h1>
    <h2 class="hero-subtitle">데이터 엔지니어 <strong>learningssik</strong>입니다</h2>
    <p class="hero-description">
      데이터 파이프라인 구축과 머신러닝 모델 개발에 관심이 많은<br>
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



<h2>My project </h2>

- <a href = "https://github.com/learningssik/Computer-Vision-Project-Report">**Computer-Vision-Project-Report**</a>: When I was an undergraduate at university, I conducted research on `image detection` and `image classfication` as an undergraduate research student in the <a href = "https://sites.google.com/view/mispl"> `AI/image processing lab` </a>
- <a href = "https://github.com/learningssik/OOP-ATMmachine">**OOP-ATMmachine**</a>: Team project in object oriented programming class.
- <a href = "https://github.com/learningssik/OOP-CoffeeShop">**OOP-CoffeeShop**</a>: Personal project in object oriented programming class.
- <a href = "https://velog.io/@learningssik/PCA-t-SNE-%EC%B0%A8%EC%9B%90-%EB%B6%84%EC%84%9D1">**ETRI fassion data analysis**</a>: ETRI fassion data analysis and visualization through dimension reduction(`PCA`, `t-SNE`)


<h2>Things I code with</h2>
  
  <h3>Level 3(Can write code without assistance)</h3>
  <p>
  <img alt="python" src="https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img alt="Jupyter" src="https://img.shields.io/badge/-Jupyter-F37626?style=flat-square&logo=Jupyter&logoColor=white" />
  </p>
  
  
  <h3>Level 2(Know how to use it, and is able to interpret code)</h3>
  <p>
  <img alt="PyTorch" src="https://img.shields.io/badge/-PyTorch-EE4C2C?style=flat-square&logo=PyTorch&logoColor=white" />
  <img alt="TensorFlow" src="https://img.shields.io/badge/-TensorFlow-FF6F00?style=flat-square&logo=TensorFlow&logoColor=white" />
  
  <img alt="NumPy" src="https://img.shields.io/badge/-NumPy-013243?style=flat-square&logo=NumPy&logoColor=white" />
  <img alt="Pandas" src="https://img.shields.io/badge/-Pandas-150458?style=flat-square&logo=Pandas&logoColor=white" />
  
  <img alt="C++" src="https://img.shields.io/badge/-C++-00599C?style=flat-square&logo=c%2B%2B&logoColor=white" />
  
  <img alt="mysql" src="https://img.shields.io/badge/-MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" />
  
  <img alt="git" src="https://img.shields.io/badge/-Git-F05032?style=flat-square&logo=git&logoColor=white" />
  <img alt="github" src="https://img.shields.io/badge/-GitHub-181717?style=flat-square&logo=github&logoColor=white" />
  </p>
  
  
  <h3>Level 1(Know only basic usage and I can code it by referring to the internet)</h3>
  <p>
  <img alt="OpenCV" src="https://img.shields.io/badge/-OpenCV-5C3EE8?style=flat-square&logo=OpenCV&logoColor=white" />
  <img alt="scikit-learn" src="https://img.shields.io/badge/-scikit_learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" />
  
  <img alt="Java" src="https://img.shields.io/badge/-Java-007396?style=flat-square&logo=Java&logoColor=white" />
  


  <img alt="Django" src="https://img.shields.io/badge/-Django-092e20?style=flat-square&logo=Django&logoColor=white" />
  <img alt="Flask" src="https://img.shields.io/badge/-Flask-000000?style=flat-square&logo=Flask&logoColor=white" />
  <img alt="PHP" src="https://img.shields.io/badge/-PHP-777BB4?style=flat-square&logo=PHP&logoColor=white" />
  
  <img alt="html5" src="https://img.shields.io/badge/-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" />
  <img alt="css" src="https://img.shields.io/badge/-CSS-1572B6?style=flat-square&logo=css3&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/-JavaScript-yellow?style=flat-square&logo=JavaScript&logoColor=white" />
  
  <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=Linux&logoColor=white" />
  </p>

<h2>ETC.</h2>

![learningssik's github stats](https://github-readme-stats.vercel.app/api?username=learningssik&show_icons=true) <tab> [![learningssik's github stats](https://github-readme-stats.vercel.app/api/top-langs/?username=learningssik&show_icons=true&hide_border=true&title_color=004386&icon_color=004386&layout=compact)](https://github.com/learningssik)     
  
[![Solved.ac Profile](http://mazassumnida.wtf/api/v2/generate_badge?boj=yoon6624)](https://solved.ac//)
  
  
<!--
Hh
**MegaGnar13/MegaGnar13** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

-  I’m currently working on ...




-  I’m currently learning ...
-  I’m looking to collaborate on ...
-  I’m looking for help with ...
-  Ask me about ...
-  How to reach me: ...
-  Pronouns: ...dd
- ⚡ Fun fact: ...
-->