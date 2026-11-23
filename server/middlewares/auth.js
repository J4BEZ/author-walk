

// 인증 미들웨어 : Authorization 헤더의 토큰으로 "누구인지" 확인
import { verifyToken } from '../utils/token.js';
import { findUser } from '../utils/users.js';


/**
 * 인증 미들웨어
 * Authorization 헤더의 토큰으로 "누구인지" 확인
 */
export function requireAuth(router) {
  return async (req, res, next) => {
    try{

      const auth = req.headers.authorization;

      // 공통 거절 반환
      const refuseResponse = () => res.status(401).json({message: "로그인이 필요합니다."});

      // 토큰 없을 때 거절
      if (!auth) return refuseResponse();

      const [method, token] = auth.split(' ');

      // bearer 방식이 아니거나 token이 비어있을 때 거절 
      if (method.toLowerCase() !== 'bearer' || !token) return refuseResponse();

      // 토큰 검증, 없으면 거절
      const verifiedUserId = await verifyToken(token);
      if (!verifiedUserId) return refuseResponse();

      // 사용자 조회, 없으면 거절
      const user = findUser(router, verifiedUserId);
      if (!user) return refuseResponse();

      // 인증 완료, req.user에 사용자 정보 저장
      req.user = user;

      next();

    } catch (error) {
      next(error);
    }
  };
}