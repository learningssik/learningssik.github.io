---
layout: default
title: Home
---

## 안녕하세요. learningssik 블로그에 오신걸 환영합니다.

이곳은 공개된 글들이 나타나는 메인 페이지입니다.

### 공개된 글 목록

<ul class="post-list">
  {% for post in site.public %}
    <li>
      <a href="{{ post.url | relative_url }}">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      </a>
    </li>
  {% endfor %}
</ul>