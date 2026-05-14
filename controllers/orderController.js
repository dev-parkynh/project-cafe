const pool = require("../config/db");
const Order = require("../models/Order");

const MYSQL_DUP_ENTRY = "ER_DUP_ENTRY";

/**
 * POST /api/orders
 * - 픽업 지점·시간·장바구니(items)를 받아 주문을 생성합니다.
 * - 품절/비활성 상품은 주문 전에 차단합니다.
 * - orders + order_items 삽입은 반드시 같은 트랜잭션에서 처리합니다.
 */
exports.create = async (req, res, next) => {
  let conn;
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return next({ status: 401, message: "인증 정보가 없습니다." });
    }

    const { branchId, pickupTime, items } = req.body || {};

    // --- 요청값 검증 (필수 필드) ---
    if (branchId === undefined || branchId === null) {
      return next({ status: 400, message: "지점(branchId)을 입력해 주세요." });
    }
    const branchIdNum = Number(branchId);
    if (!Number.isInteger(branchIdNum) || branchIdNum <= 0) {
      return next({ status: 400, message: "올바른 지점 ID가 아닙니다." });
    }

    if (!pickupTime || typeof pickupTime !== "string") {
      return next({ status: 400, message: "픽업 시간(pickupTime)을 입력해 주세요." });
    }
    // MySQL DATETIME에 넣을 수 있는지 간단 검증 (ISO 문자열 또는 'YYYY-MM-DD HH:MM:SS' 형태 허용)
    const pickupDate = new Date(pickupTime);
    if (Number.isNaN(pickupDate.getTime())) {
      return next({ status: 400, message: "픽업 시간 형식이 올바르지 않습니다." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return next({
        status: 400,
        message: "주문 상품(items)을 1개 이상 입력해 주세요.",
      });
    }

    for (let i = 0; i < items.length; i += 1) {
      const row = items[i];
      const pid = Number(row?.productId);
      const qty = Number(row?.quantity);
      if (!Number.isInteger(pid) || pid <= 0) {
        return next({
          status: 400,
          message: `주문 상품 목록 ${i + 1}번째: 올바른 상품 ID가 아닙니다.`,
        });
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        return next({
          status: 400,
          message: `주문 상품 목록 ${i + 1}번째: 수량은 1 이상의 정수여야 합니다.`,
        });
      }
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // --- 지점 확인 (활성 지점만 주문 가능) ---
    const branch = await Order.lockBranchIfActive(conn, branchIdNum);
    if (!branch || Number(branch.is_active) !== 1) {
      await conn.rollback();
      return next({ status: 400, message: "주문할 수 없는 지점입니다." });
    }

    // --- 상품별 품절/활성 검증 + 총액 계산 ---
    let totalPrice = 0;
    const lineSnapshots = [];

    for (let i = 0; i < items.length; i += 1) {
      const { productId, quantity } = items[i];
      const pid = Number(productId);
      const qty = Number(quantity);

      const product = await Order.lockProductForOrder(conn, pid);
      if (!product) {
        await conn.rollback();
        return next({
          status: 400,
          message: `존재하지 않는 상품이 포함되어 있습니다. (productId: ${pid})`,
        });
      }
      if (Number(product.is_active) !== 1) {
        await conn.rollback();
        return next({
          status: 400,
          message: `판매 중이 아닌 상품이 포함되어 있습니다. (productId: ${pid})`,
        });
      }
      if (Number(product.is_sold_out) === 1) {
        await conn.rollback();
        return next({
          status: 400,
          message: `품절된 상품이 포함되어 있습니다. (productId: ${pid})`,
        });
      }

      const unitPrice = Number(product.price);
      totalPrice += unitPrice * qty;
      lineSnapshots.push({ productId: pid, quantity: qty, unitPrice });
    }

    // --- 주문번호 중복 시 재시도 (UNIQUE order_number) ---
    const maxAttempts = 8;
    let orderId;
    let orderNumber;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      orderNumber = Order.generateOrderNumber();
      try {
        orderId = await Order.insertOrder(conn, {
          userId,
          branchId: branchIdNum,
          orderNumber,
          totalPrice,
          pickupTime: pickupDateToMysqlDatetime(pickupDate),
        });
        break;
      } catch (err) {
        if (err?.code === MYSQL_DUP_ENTRY && attempt < maxAttempts - 1) {
          continue;
        }
        throw err;
      }
    }

    if (!orderId) {
      await conn.rollback();
      return next({
        status: 500,
        message: "주문번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }

    // --- 주문 상세(라인) INSERT ---
    for (const line of lineSnapshots) {
      await Order.insertOrderItem(conn, {
        orderId,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      });
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      order: {
        order_id: orderId,
        order_number: orderNumber,
        total_price: totalPrice,
        status: "pending",
      },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        // 롤백 실패는 로그만 남기고 원래 에러를 우선 전달합니다.
      }
    }
    return next(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

/**
 * Date → MySQL DATETIME 문자열 ('YYYY-MM-DD HH:MM:SS')
 * - 서버 로컬 타임존 기준으로 저장합니다.
 */
function pickupDateToMysqlDatetime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * GET /api/orders
 * - 로그인한 사용자 본인의 주문만 조회합니다.
 */
exports.list = async (req, res, next) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return next({ status: 401, message: "인증 정보가 없습니다." });
    }

    // 쿼리 파라미터 받기 추가
    const {status, from, to} = req.query;

    const orders = await Order
    .listByUserId(userId, {
      status, from, to
    });
    // filters 넘김

    return res.json({
      success: true,
      orders,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/orders/:id
 * - 본인 주문만 조회 가능 (타인 주문 ID로는 404)
 */
exports.detail = async (req, res, next) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return next({ status: 401, message: "인증 정보가 없습니다." });
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return next({ status: 400, message: "올바른 주문 ID가 아닙니다." });
    }

    const order = await Order.findHeaderByIdForUser(orderId, userId);
    if (!order) {
      return next({ status: 404, message: "주문을 찾을 수 없습니다." });
    }

    const items = await Order.listItemsWithProducts(orderId);

    return res.json({
      success: true,
      order: {
        ...order,
        items,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/orders/:id/cancel
 * - pending 상태만 취소 가능
 * - 본인 주문만 취소 가능
 */
exports.cancel = async (req, res, next) => {
  let conn;
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return next({ status: 401, message: "인증 정보가 없습니다." });
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return next({ status: 400, message: "올바른 주문 ID가 아닙니다." });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const affected = await Order.cancelPendingForUser(conn, orderId, userId);

    if (affected === 0) {
      await conn.rollback();
      const row = await Order.findStatusByIdForUser(orderId, userId);
      if (!row) {
        return next({ status: 404, message: "주문을 찾을 수 없습니다." });
      }
      return next({
        status: 400,
        message: "대기(pending) 상태의 주문만 취소할 수 있습니다.",
      });
    }

    await conn.commit();

    return res.json({
      success: true,
      message: "주문이 취소되었습니다.",
      order: { order_id: orderId, status: "cancelled" },
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        /* ignore */
      }
    }
    return next(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
};
