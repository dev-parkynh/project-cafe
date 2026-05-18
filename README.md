# ☕ BREWY (브루이 카페 픽업 주문)

> 개발 컨설턴트 포트폴리오를 위한 Node.js 백엔드 프로젝트  
> AI 바이브코딩 실습을 병행하며 실무형 API 설계를 학습하는 저장소입니다.

---

## 👨‍💻 프로젝트 개요

- **프로젝트명**: BREWY (브루이 카페 픽업 주문)
- **개발자**: 박용희
- **개발 목적**
  - 개발 컨설턴트 포트폴리오
  - Node.js 백엔드 학습
  - AI 바이브코딩 실습

---

## 🛠 기술 스택

- **Backend**: Node.js v20 + Express
- **Database**: MySQL 9.7
- **Auth/Security**: JWT 인증 + bcrypt 암호화
- **Etc**: dotenv, cors

---

## 🚀 개발 진행 단계

### ✅ Phase 1. 환경 세팅
- Node.js, MySQL 설치
- `brewy` DB + 테이블 6개 생성
- 샘플 데이터 입력

### ✅ Phase 2. 기본 API 개발
- 회원가입/로그인 (JWT)
- 내정보 조회 (JWT 인증)
- 지점/메뉴 목록 조회
- Postman 테스트 완료

### ✅ Phase 3. 에러 테스트 완료
- 의도적 에러 발생
- AI 활용 디버깅

### ✅ Phase 4. 주문 API 완료
- 주문 생성 (트랜잭션)
- 주문 조회/취소

### ✅ Phase 5. Python 데이터 분석 완료
- Python 3.13 환경 구축
- mysql-connector-python 연동
- pandas DataFrame 활용
- BREWY DB 통계 분석
  - 전체 주문 수
  - 지점별 매출
  - 인기 메뉴 TOP 5
  - 카테고리별 매출
  - 일별 주문 현황

### 🔜 Phase 6. AI 연동 (진행중)
- OpenAI API 연동
- 메뉴 추천 챗봇
- FastAPI 서버 구축

//AI Generate:parkynh2|20260518|16|

---

## 📡 API 목록

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/auth/register` | 회원가입 |
| `POST` | `/api/auth/login` | 로그인 JWT 발급 |
| `GET` | `/api/users/me` | 내정보 조회 (인증 필요) |
| `GET` | `/api/branches` | 지점 목록 |
| `GET` | `/api/products` | 메뉴 목록 |
| `GET` | `/api/products/:id` | 메뉴 상세 |

---

## 📁 폴더 구조

```bash
brewy-backend/
├── app.js
├── config/db.js
├── routes/
├── controllers/
├── models/
└── middlewares/
```

---

## ⚙️ 실행 방법 (설치/환경변수/서버 실행)

### 1) 📦 설치

```bash
npm install
```

> 권장 버전: **Node.js v20 이상**  
> (현재 프로젝트는 v22 환경에서도 동작 확인됨)

### 2) 🔐 환경변수 설정 (`.env`)

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 입력합니다.

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=brewy
JWT_SECRET=brewy-secret-key-2024
JWT_EXPIRES=1h
```

- `DB_PASS`는 비워둔 상태에서 시작 가능 (로컬 환경 기준)
- 실제 운영 환경에서는 `JWT_SECRET`을 반드시 강력한 값으로 변경하세요.

### 3) 🗄️ DB 준비

- MySQL에서 `brewy` 데이터베이스 생성
- `users`, `branches`, `categories`, `products`, `orders`, `order_items` 테이블 생성
- 테스트용 샘플 데이터 입력

### 3-1) 🧱 DB 스키마 SQL 블록

아래 SQL을 순서대로 실행하면 기본 테이블이 생성됩니다.

```sql
CREATE TABLE users (
  user_id     INT PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255),
  name        VARCHAR(50) NOT NULL,
  phone       VARCHAR(20),
  social_type ENUM('none','kakao') DEFAULT 'none',
  is_active   TINYINT DEFAULT 1,
  created_at  DATETIME DEFAULT NOW()
);

CREATE TABLE branches (
  branch_id  INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  address    VARCHAR(300) NOT NULL,
  phone      VARCHAR(20),
  open_time  TIME,
  close_time TIME,
  is_active  TINYINT DEFAULT 1
);

CREATE TABLE categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(50) NOT NULL,
  sort_order  INT DEFAULT 0,
  is_active   TINYINT DEFAULT 1
);

CREATE TABLE products (
  product_id  INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price       INT NOT NULL,
  image_url   VARCHAR(500),
  is_sold_out TINYINT DEFAULT 0,
  is_active   TINYINT DEFAULT 1,
  created_at  DATETIME DEFAULT NOW(),
  FOREIGN KEY (category_id)
    REFERENCES categories(category_id)
);

CREATE TABLE orders (
  order_id     INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT NOT NULL,
  branch_id    INT NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_price  INT NOT NULL,
  pickup_time  DATETIME NOT NULL,
  status       ENUM(
    'pending','paid','making',
    'ready','done','cancelled'
  ) DEFAULT 'pending',
  created_at   DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  FOREIGN KEY (branch_id)
    REFERENCES branches(branch_id)
);

CREATE TABLE order_items (
  item_id    INT PRIMARY KEY AUTO_INCREMENT,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL,
  FOREIGN KEY (order_id)
    REFERENCES orders(order_id),
  FOREIGN KEY (product_id)
    REFERENCES products(product_id)
);
```

### 4) 🚀 서버 실행

개발 모드(자동 재시작):

```bash
npm run dev
```

일반 실행:

```bash
npm start
```

기본 주소:

- API 서버: `http://localhost:8080`
- 헬스체크: `GET http://localhost:8080/health`

---

## 🧪 Postman 테스트 예시

### 1) 회원가입 - `POST /api/auth/register`

- URL: `http://localhost:8080/api/auth/register`
- Body (JSON):

```json
{
  "email": "test@brewy.com",
  "password": "12345678",
  "name": "브루이테스터",
  "phone": "010-1234-5678"
}
```

### 2) 로그인 - `POST /api/auth/login`

- URL: `http://localhost:8080/api/auth/login`
- Body (JSON):

```json
{
  "email": "test@brewy.com",
  "password": "12345678"
}
```

- 성공 시 응답의 `accessToken` 값을 복사합니다.

### 3) 내정보 조회 - `GET /api/users/me` (인증 필요)

- URL: `http://localhost:8080/api/users/me`
- Headers:
  - `Authorization: Bearer <accessToken>`

### 4) 지점 목록 조회 - `GET /api/branches`

- URL: `http://localhost:8080/api/branches`

### 5) 메뉴 목록 조회 - `GET /api/products`

- URL: `http://localhost:8080/api/products`

### 6) 메뉴 상세 조회 - `GET /api/products/:id`

- URL 예시: `http://localhost:8080/api/products/1`

### ✅ Postman 체크 포인트

- Body 타입은 반드시 `raw` + `JSON`으로 설정
- 로그인 후 발급받은 JWT를 `Bearer` 형식으로 전달
- 실패 응답 형식: `{ "success": false, "message": "에러 메시지" }`
- 서버 미기동/포트 충돌 시 `PORT` 값 또는 실행 로그 확인

---

## 🚨 에러 코드 가이드

| HTTP 코드 | 의미 | 주요 발생 상황 (예시) |
|---|---|---|
| `400 Bad Request` | 잘못된 요청 | 필수 파라미터 누락, 형식 오류, 잘못된 상품 ID |
| `401 Unauthorized` | 인증 실패 | 토큰 없음, 토큰 만료/위조, 로그인 정보 불일치 |
| `403 Forbidden` | 접근 거부 | 비활성화 계정 등 정책상 접근 불가 |
| `404 Not Found` | 리소스 없음 | 존재하지 않는 API 경로, 사용자/상품 미존재 |
| `409 Conflict` | 충돌 | 이미 가입된 이메일로 회원가입 시도 |
| `500 Internal Server Error` | 서버 내부 오류 | 예기치 못한 예외, DB 처리 중 미처리 오류 |

### 📌 공통 실패 응답 형식

```json
{
  "success": false,
  "message": "에러 메시지"
}
```

---

## 📚 학습 포인트

- RESTful API 설계 원칙
- JWT 인증/인가 구조
- bcrypt 단방향 암호화
- SQL Injection 방지
- 트랜잭션 처리
- AI 바이브코딩 활용법

---

## ✨ 한 줄 소개

**BREWY는 백엔드 기본기 + 실무 관점 + AI 협업 개발 방식을 함께 쌓아가는 카페 주문 API 프로젝트입니다.**

