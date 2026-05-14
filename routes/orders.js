const express = require("express");
const orderController = require("../controllers/orderController");
const auth = require("../middlewares/auth");

const router = express.Router();

// 모든 주문 API는 JWT로 본인 식별(user_id)이 필요합니다.

// POST /api/orders — 주문 생성 (트랜잭션은 컨트롤러 + 풀 커넥션)
router.post("/", auth, orderController.create);

// GET /api/orders — 내 주문 목록 (지점명 JOIN)
router.get("/", auth, orderController.list);

// PATCH /api/orders/:id/cancel — 취소 (pending만). :id 라우트보다 먼저 등록해 경로 충돌을 피합니다.
router.patch("/:id/cancel", auth, orderController.cancel);

// GET /api/orders/:id — 주문 상세 (본인만)
router.get("/:id", auth, orderController.detail);

module.exports = router;
