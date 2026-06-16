const https = require('https');
const jwt   = require('jsonwebtoken');
const User  = require('../models/User');

// ── 유틸: https POST (form-urlencoded) ──────────────────────────────────────
function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = https.request(
      { hostname, path, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded',
                   'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error('JSON parse error: ' + raw)); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── 유틸: https GET (Bearer) ─────────────────────────────────────────────────
function httpsGet(hostname, path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: 'GET',
        headers: { Authorization: `Bearer ${token}` } },
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error('JSON parse error: ' + raw)); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// ── STEP 1: 카카오 인증 페이지로 리다이렉트 ─────────────────────────────────
// GET /api/auth/kakao
exports.redirect = (req, res) => {
  const clientId    = process.env.KAKAO_CLIENT_ID;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code`;
  res.redirect(kakaoAuthUrl);
};

// ── STEP 2: 카카오 콜백 처리 ────────────────────────────────────────────────
// GET /api/auth/kakao/callback?code=...
exports.callback = async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://13.125.180.146';

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=kakao_cancelled`);
  }

  try {
    // 디버그
    console.log('[Kakao DEBUG] client_id:', process.env.KAKAO_CLIENT_ID);
    console.log('[Kakao DEBUG] redirect_uri:', process.env.KAKAO_REDIRECT_URI);
    console.log('[Kakao DEBUG] code length:', code?.length);

    // 1) 인가코드 → 카카오 액세스 토큰 교환
    const tokenData = await httpsPost('kauth.kakao.com', '/oauth/token', {
      grant_type:   'authorization_code',
      client_id:    process.env.KAKAO_CLIENT_ID,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code,
    });

    if (tokenData.error) {
      console.error('[Kakao] token error:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=kakao_token`);
    }

    // 2) 카카오 사용자 정보 조회
    const userInfo = await httpsGet(
      'kapi.kakao.com',
      '/v2/user/me',
      tokenData.access_token
    );

    const kakaoId = String(userInfo.id);
    const kakaoAccount = userInfo.kakao_account || {};
    const profile      = kakaoAccount.profile || {};
    const name  = profile.nickname || '카카오 사용자';
    const email = kakaoAccount.email || null;   // 이메일 제공 안 할 수도 있음

    // 3) DB에서 기존 카카오 사용자 조회
    let user = await User.findByKakaoId(kakaoId);

    // 4) 신규라면 자동 회원가입
    if (!user) {
      const newId = await User.createKakaoUser({ kakaoId, email, name });
      user = await User.findById(newId);
    }

    // 5) JWT 발급
    const accessToken = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '1h' }
    );

    // 6) 프론트엔드로 토큰 전달 (쿼리스트링)
    const params = new URLSearchParams({
      token: accessToken,
      name:  user.name,
      role:  user.role,
    });
    return res.redirect(`${frontendUrl}/auth/kakao/success?${params}`);

  } catch (err) {
    console.error('[Kakao] callback error:', err);
    return res.redirect(`${frontendUrl}/login?error=kakao_server`);
  }
};
