const pool = require("../config/db");

/**
 * 주문번호 생성: ORD-YYYYMMDD-랜덤4자리
 * - 같은 날·같은 랜덤이 겹치면 DB UNIQUE 제약에 걸릴 수 있어,
 *   컨트롤러 쪽에서 중복 시 재시도하는 방식과 함께 씁니다.
 */
function generateOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${y}${m}${day}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `ORD-${dateStr}-${rand}`;
}

/**
 * 트랜잭션용: 활성 지점인지 확인 (FOR UPDATE로 동시 주문 시 지점 존재 여부를 일관되게 읽음)
 */
async function lockBranchIfActive(conn, branchId) {
  const [rows] = await conn.query(
    `
    SELECT branch_id, name, is_active
    FROM branches
    WHERE branch_id = ?
    FOR UPDATE
    `,
    [branchId]
  );
  return rows[0] || null;
}

/**
 * 트랜잭션용: 주문 가능한 상품인지 확인 + 행 잠금
 * - 품절(is_sold_out)이면 주문 불가
 * - 비활성 메뉴도 주문 불가
 */
async function lockProductForOrder(conn, productId) {
  const [rows] = await conn.query(
    `
    SELECT product_id, price, is_sold_out, is_active
    FROM products
    WHERE product_id = ?
    FOR UPDATE
    `,
    [productId]
  );
  return rows[0] || null;
}

/**
 * 주문 1건 INSERT (트랜잭션 커넥션 사용)
 * @returns {number} 삽입된 order_id
 */
async function insertOrder(conn, params) {
  const { userId, branchId, orderNumber, totalPrice, pickupTime } = params;
  const [result] = await conn.query(
    `
    INSERT INTO orders (user_id, branch_id, order_number, total_price, pickup_time, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
    `,
    [userId, branchId, orderNumber, totalPrice, pickupTime]
  );
  return result.insertId;
}

/**
 * 주문 상세 품목 INSERT
 */
async function insertOrderItem(conn, params) {
  const { orderId, productId, quantity, unitPrice } = params;
  await conn.query(
    `
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
    `,
    [orderId, productId, quantity, unitPrice]
  );
}

/**
 * 내 주문 목록 (지점명 JOIN)
 */
async function listByUserId(userId, filters = {}) {
  const { status, from, to } = filters;
    // 동적 조건 배열
  const conditions = ['o.user_id = ?'];
  const params = [userId];

  // status 필터
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }

  // 날짜 from 필터
  if (from) {
    conditions.push('o.created_at >= ?');
    params.push(from);
  }

  // 날짜 to 필터
  if (to) {
    conditions.push('o.created_at <= ?');
    params.push(to);
  }

  const where = conditions.join(' AND ');

  const [rows] = await pool.query(`
    SELECT o.*,
           b.name AS branch_name
    FROM orders o
    JOIN branches b
    ON o.branch_id = b.branch_id
    WHERE ${where}
    ORDER BY o.created_at DESC
  `, params);

  return rows;
}

/**
 * 주문 헤더 + 지점명 (본인 것만)
 */
async function findHeaderByIdForUser(orderId, userId) {
  const [rows] = await pool.query(
    `
    SELECT
      o.order_id,
      o.user_id,
      o.branch_id,
      b.name AS branch_name,
      o.order_number,
      o.total_price,
      o.pickup_time,
      o.status,
      o.created_at
    FROM orders o
    JOIN branches b ON b.branch_id = o.branch_id
    WHERE o.order_id = ? AND o.user_id = ?
    LIMIT 1
    `,
    [orderId, userId]
  );
  return rows[0] || null;
}

/**
 * 주문 상세 품목 (상품명 등 JOIN)
 */
async function listItemsWithProducts(orderId) {
  const [rows] = await pool.query(
    `
    SELECT
      oi.item_id,
      oi.order_id,
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      p.name AS product_name,
      p.image_url AS product_image_url
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id = ?
    ORDER BY oi.item_id ASC
    `,
    [orderId]
  );
  return rows;
}

/**
 * 취소 UPDATE (pending + 본인만 성공)
 * @returns {number} affectedRows
 */
async function cancelPendingForUser(conn, orderId, userId) {
  const [result] = await conn.query(
    `
    UPDATE orders
    SET status = 'cancelled'
    WHERE order_id = ?
      AND user_id = ?
      AND status = 'pending'
    `,
    [orderId, userId]
  );
  return result.affectedRows;
}

/**
 * 주문 존재 여부 + 소유자만 (상태 무관) — 취소 실패 시 사유 분기용
 */
async function findStatusByIdForUser(orderId, userId) {
  const [rows] = await pool.query(
    `
    SELECT order_id, status
    FROM orders
    WHERE order_id = ? AND user_id = ?
    LIMIT 1
    `,
    [orderId, userId]
  );
  return rows[0] || null;
}

module.exports = {
  generateOrderNumber,
  lockBranchIfActive,
  lockProductForOrder,
  insertOrder,
  insertOrderItem,
  listByUserId,
  findHeaderByIdForUser,
  listItemsWithProducts,
  cancelPendingForUser,
  findStatusByIdForUser,
};
