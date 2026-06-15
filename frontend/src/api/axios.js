// src/api/axios.js

import axios from 'axios';

// 백엔드 서버 주소!
// 개발: localhost:8080 직접 호출
// 운영: 빈 문자열 → Nginx 리버스 프록시가 /api 처리
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? ''
    : 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청할 때마다 토큰 자동 추가!
// 더존 dews.api 헤더 설정이랑 같은것!
api.interceptors.request.use((config) => {
  const token = localStorage
    .getItem('token');
  if (token) {
    config.headers.Authorization
      = `Bearer ${token}`;
  }
  return config;
});

export default api;
