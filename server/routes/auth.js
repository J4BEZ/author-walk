
import express from "express";

import { validatePassword, validateUserId } from "#src/utils/validation/users.js"
import { findUser, createUser } from "../utils/users.js";

/**
 * 인증 관련 라우트 설정
 * @param {import("express").Router} router
 */
export function authRoutes(router){

  const auth = express.Router();

  auth.post('/signup', async (req, res, next) => {

    try{

      // 구조 분해로 req.body에서 필요한 값 추출
      const {userId, password} = req.body;
      
      // id 및 비밀번호 유효성 검사
      const userIdError = validateUserId(userId);
      const passwordError = validatePassword(password);

      // 둘 중 하나라도 에러가 있으면 400 반환
      if (userIdError || passwordError) {
        return res.status(400).json({
          errors: {
            // null이 아니면 ...로 펼쳐서 전달
            ...(userIdError && { userId: userIdError }),
            ...(passwordError && { password: passwordError }),
          }
        });
      }

      // 이미 존재하는 ID일 경우 등록불가
      if (findUser(router, userId)) {
        return res.status(409).json({

          // text-field 아래 빨간색 에러 메시지 표시 하기 위해 key를 userId로 설정
          errors: { userId: '이미 사용 중인 아이디입니다.' }
       });
      }

      // 새로운 사용자 등록
      const newUser = await createUser(router, userId, password);
      const registeredUserId = newUser?.userId;
      if (!registeredUserId) {
        return res.status(409).json({ errors: { userId: '이미 사용 중인 아이디입니다.' } });
      }
      return res.status(201).json( { message: `${registeredUserId} 성공적으로 생성되었습니다.` } );

    }catch(error){

      next(error);
    }
  })


  return auth;

}