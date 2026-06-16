# ── 1단계: 베이스 이미지 (Node.js 20 경량 버전) ──────────────
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 먼저 복사 → npm install (레이어 캐시 활용)
COPY package*.json ./
RUN npm install --production

# 나머지 소스코드 복사
COPY . .

# 업로드 파일 저장 폴더 생성
RUN mkdir -p uploads logs

# 포트 오픈
EXPOSE 8080

# 서버 실행
CMD ["node", "app.js"]
