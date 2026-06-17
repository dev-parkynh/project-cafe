# ☕ BREWY (브루이 카페 픽업 주문)

> 개발 컨설턴트를 위한 JAVA + Node.js 백엔드 + React 프론트엔드 풀스택 프로젝트
> 카카오 소셜 로그인, 장바구니/주문, AWS EC2 구현한 카페 주문 서비스
---
## 👨‍💻 프로젝트 개요

- **프로젝트명**: BREWY (브루이 카페 픽업 주문)
- **개발자**: 박용희
- **개발 목적**
  - 개발 컨설턴트 포트폴리오
  - 풀스택(Node.js + React) 실습
  - 카카오, 도메인 연동 실전 경험

---

## 🛠 기술 스택

### Backend
- JAVA Node.js v20 + Express
- MySQL 8.4 + ORACLE
- JWT 인증 + bcrypt 암호화
- Kakao OAuth 2.0 (소셜 로그인)
- dotenv, cors
- multer (이미지 업로드)
- morgan (HTTP 요청 로깅)
- express-rate-limit (보안 / Brute Force 방어)
- PM2 (프로세스 관리 / 클러스터 모드)

### Frontend
- React.js (CRA)
- React Router DOM
- Tailwind CSS v3 (Apple 스타일 UI)
- Axios
- Recharts (차트 라이브러리)

### AI / 분석
- Python 3.13
- pandas, mysql-connector-python
- OpenAI API (AI 메뉴 추천 챗봇)

### 인프라 / 배포
- AWS EC2 t3.micro (서울 리전)
- Ubuntu 26.04 LTS
- Nginx (정적 파일 서빙 + 리버스 프록시)
- Let's Encrypt + Certbot (HTTPS 인증서)
- GitHub (버전 관리 + 배포 경로)

---

## 🚀 개발 진행 단계

### ✅ Phase 1. 환경 세팅
- Node.js, MySQL 설치
- `brewy` DB + 테이블 생성
- 샘플 데이터 입력

### ✅ Phase 2. 기본 API 개발
- 회원가입 / 로그인 (JWT)
- 내정보 조회 (JWT 인증)
- 지점 / 메뉴 목록 조회
- Postman 테스트 완료

### ✅ Phase 3. 에러 테스트 및 디버깅
- 의도적 에러 발생 → AI 활용 디버깅 실습

### ✅ Phase 4. 주문 API
- 주문 생성 (트랜잭션 처리)
- 주문 조회 / 취소
- 동적 쿼리 필터링 (status / 날짜)

### ✅ Phase 5. Python 데이터 분석
- Python 환경 구축 + MySQL 연동
- pandas로 DB 통계 분석
- 지점별 매출 / 인기 메뉴 TOP5 / 카테고리별 분석

### ✅ Phase 6. 스탬프 / 쿠폰 시스템
- 주문 완료 시 스탬프 자동 적립
- 스탬프 10개 달성 시 쿠폰 자동 발급
- 쿠폰 사용 API

### ✅ Phase 7. React 프론트엔드
- 로그인 / 메인 / 마이페이지
- AI 메뉴 추천 챗봇 (우측 하단)

### ✅ Phase 8. 매출 통계 API
- 일별 / 월별 / 지점별 / 메뉴별 통계
- 관리자 전용 미들웨어

### ✅ Phase 9~10. 관리자 API + 대시보드
- 메뉴 등록 / 수정 / 비활성화 (Soft Delete)
- 주문 상태 관리 (pending→paid→making→ready→done)
- 관리자 대시보드 React UI (3탭)
- Recharts 차트 (막대 / 라인 / 파이 / 가로막대)

### ✅ Phase 11~12. 보안 미들웨어
- multer 이미지 업로드 (메뉴 썸네일)
- Morgan 로깅 / Rate Limiting / PM2 설정

### ✅ Phase 13. AWS EC2 배포
- EC2 t3.micro + Ubuntu + Nginx + PM2 설정
- React 프로덕션 빌드 + Nginx 정적 서빙
- Nginx 리버스 프록시 (/api → Node.js 8080)

### ✅ Phase 14. 카카오 소셜 로그인
- Kakao OAuth 2.0 (REST API 인가코드 방식)
- 신규 사용자 자동 회원가입
- 클라이언트 시크릿 보안 처리
- DB: users 테이블 kakao_id 컬럼 추가

### ✅ Phase 15. 장바구니 + 주문 기능
- 메뉴 카드 [담기] 버튼
- 하단 고정 장바구니 바
- 바텀 시트: 수량 조절 / 지점 선택 / 픽업 시간 선택
- 주문 완료 화면 (주문번호 / 금액 확인)

### ✅ Phase 16. 도메인 + HTTPS
- 도메인: brewy.store (가비아, 연 2,200원)
- DNS A 레코드 → EC2 IP 연결
- Let's Encrypt 인증서 발급 (Certbot)
- 자동 갱신 설정 완료

---

## 📡 API 목록

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 JWT 발급 |
| GET | /api/auth/kakao | 카카오 로그인 시작 |
| GET | /api/auth/kakao/callback | 카카오 콜백 처리 |

### 회원
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | /api/users/me | 내정보 조회 | ✅ |

### 지점 / 메뉴
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/branches | 지점 목록 |
| GET | /api/products | 메뉴 목록 |
| GET | /api/products/:id | 메뉴 상세 |

### 주문
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /api/orders | 주문 생성 | ✅ |
| GET | /api/orders | 주문 목록 | ✅ |
| GET | /api/orders/:id | 주문 상세 | ✅ |
| PATCH | /api/orders/:id/cancel | 주문 취소 | ✅ |

### 관리자 전용 🔒
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/admin/stats/daily | 일별 매출 |
| GET | /api/admin/stats/monthly | 월별 매출 |
| GET | /api/admin/stats/branch | 지점별 매출 |
| GET | /api/admin/stats/menu | 메뉴별 통계 |
| GET/POST | /api/admin/products | 메뉴 목록 / 등록 |
| PUT/DELETE | /api/admin/products/:id | 메뉴 수정 / 비활성화 |
| POST | /api/admin/products/:id/image | 이미지 업로드 |
| GET | /api/admin/orders | 전체 주문 목록 |
| PATCH | /api/admin/orders/:id/status | 주문 상태 변경 |

---

## 👤 테스트 계정

| 역할 | 이메일 | 비밀번호 | 이동 경로 |
|------|--------|---------|----------|
| 관리자 | test@brewy.com | 12341234 | `/admin` |
| 일반유저 | user1@brewy.com | 12341234 | `/main` |
| 카카오 | 카카오 계정으로 로그인 | - | `/main` |

---

## 📁 폴더 구조

```
brewy-fullstack/
├── app.js
├── .env                         # 환경변수 (GitHub 미포함)
├── config/db.js
├── routes/
│   ├── auth.js                  # 일반 + 카카오 로그인 라우트
│   ├── users.js
│   ├── branches.js
│   ├── products.js
│   ├── orders.js
│   ├── stamps.js
│   ├── coupons.js
│   └── admin.js
├── controllers/
│   ├── authController.js
│   ├── kakaoController.js       # 카카오 OAuth 처리
│   ├── orderController.js
│   └── adminController.js
├── models/
│   ├── User.js                  # findByKakaoId, createKakaoUser 포함
│   ├── Order.js
│   └── ...
├── middlewares/
│   ├── auth.js
│   ├── errorHandler.js
│   └── upload.js
├── uploads/
├── python/
│   ├── db/connection.py
│   ├── analysis/brewy_stats.py
│   └── chatbot/menu_recommend.py
└── frontend/src/
    ├── App.js                   # /auth/kakao/success 라우트 포함
    ├── api/axios.js
    ├── pages/
    │   ├── LoginPage.js         # 카카오 버튼 포함
    │   ├── MainPage.js          # 장바구니 + 주문 포함
    │   ├── MyPage.js
    │   ├── AdminPage.js         # 모바일 반응형
    │   └── KakaoCallback.js     # 카카오 콜백 처리
    └── components/
        └── ChatBot.js
```

---

## ⚙️ 실행 방법

### 1) 패키지 설치

```bash
npm install
cd frontend && npm install
```

### 2) 환경변수 설정 (`.env`)

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=brewy
JWT_SECRET=your-secret-key
JWT_EXPIRES=1h
FRONTEND_URL=http://localhost:3000
KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_REDIRECT_URI=http://localhost:8080/api/auth/kakao/callback
KAKAO_CLIENT_SECRET=카카오_클라이언트_시크릿
```

### 3) 서버 실행

```bash
node app.js          # 백엔드 (포트 8080)
cd frontend && npm start  # 프론트엔드 (포트 3000)
```

---

## 📚 학습 포인트

- RESTful API 설계 / JWT 인증 / bcrypt 암호화
- SQL 트랜잭션 / FOR UPDATE 행 잠금 / 동적 쿼리
- Kakao OAuth 2.0 (인가코드 방식) / 클라이언트 시크릿
- MVC 패턴 (routes / controllers / models)
- role 기반 접근 제어 (admin / user)
- Soft Delete 패턴 (is_active = 0 논리 삭제)
- multer 파일 업로드 / express.static 정적 서빙
- Morgan 로깅 / Rate Limiting / PM2 클러스터
- React useState / useEffect / 컴포넌트 설계
- Tailwind CSS 반응형 (모바일 / 태블릿 / PC)
- OpenAI API 챗봇 연동

---

## ✨ 한 줄 소개

**BREWY는 카카오 소셜 로그인 · 장바구니 주문 · AWS EC2 서버를 갖춘 카페주문 풀스택 실습 프로젝트입니다.**
