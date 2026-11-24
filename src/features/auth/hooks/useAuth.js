import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, getMe } from '../api/authApi.js';

const TOKEN_KEY = 'author-walk-token';

/** 전역으로 인증 상태를 관리하기 위한 Context */
export const AuthContext = createContext(
  /** @type {ReturnType<typeof useAuthState> | null} */ (null)
);

/** 수신기 : 아래 어느 컴포넌트에서든 로그인 상태를 꺼냄 */
export function useAuth() {
  
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthProvider가 필요합니다');
  }
  return context;
}


// localStorage 는 사이트 데이터 차단, 일부 사생활 보호 모드에서 에러를 던집니다
// 그래도 앱 전체가 멈추지 않도록 읽기, 저장, 지우기를 모두 try/catch 로 감쌉니다 (저장 못 하면 새로고침 때 로그인이 풀릴 뿐)

/** 저장된 토큰을 읽습니다 (없거나 읽을 수 없으면 null) */
function readToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** @param {string} token */
function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* 저장 못 해도 이번 화면에서는 로그인 유지 */ }
}

function removeToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* 지울 수 없으면 무시 */ }
}


/** 방송할 내용 : 토큰, 로그인한 user, 로그인, 로그아웃 */
export function useAuthState() {

  // 토큰 정보 : 함수를 넘겨 처음 한 번만 localStorage 에서 읽음
  const [token, setToken] = useState(readToken);

  // { userId } 또는 null, 현재 로그인된 User 정보
  const [user, setUser] = useState(/** @type {{ userId: string } | null} */ (null));

  // getMe 확인을 마친 토큰 : 지금 token 과 다르면 아직 응답을 기다리는 중
  const [checkedToken, setCheckedToken] = useState(/** @type {string | null} */ (null));

  // 확인 중 : 토큰은 있는데 getMe 응답이 아직 안 옴 (새로고침 직후, 로그인 직후)
  // 이때 user 가 null 이라고 "로그아웃 상태" 로 그리면 '로그인' 버튼이 잠깐 보였다 바뀜
  const checking = token !== null && checkedToken !== token;

  // token 이 생기면 (새로고침, 로그인) getMe 로 주인을 확인해 user 를 채움
  useEffect(() => {
    if (!token) return;
    let ignore = false; // 이 요청이 아직 유효한가 (token 이 바뀌거나 로그아웃하면 true)

    const fetchMe = async () => {
      try {
        const me = await getMe(token);
        if (!ignore) setUser(me);
      } catch (e) {
        if (ignore) return;
        // 401 : 토큰이 만료되었거나 무효 -> 로그아웃 상태로 정리
        // 그 밖의 실패 (시간 초과, 네트워크) 는 토큰을 그대로 둠 (서버가 느릴 뿐 토큰은 멀쩡할 수 있음)
        if (e instanceof Error && e.cause?.status === 401) {
          removeToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) setCheckedToken(token); // 성공이든 실패든 이 토큰은 확인 끝
      }
    };

    fetchMe();
    return () => { ignore = true; }; // 늦게 도착한 이전 요청의 결과는 무시
  }, [token]);

  const login = async (userId, password) => {
    // 로그인 요청하여 token 받기
    const token = await apiLogin(userId, password);

    // 토큰 저장 (State + localStorage)
    // user 채우기는 token 이 바뀌면 실행되는 useEffect 에서 한 번만 (새로고침 때와 같은 길)
    saveToken(token);
    setToken(token);
  };

  const logout = () => {
    // 토큰, user 모두 비우기
    removeToken();
    setToken(null);
    setUser(null);
    
  };

  return { token, user, checking, login, logout };
}