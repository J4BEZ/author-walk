// 로그인 폼 : 입력 State, 제출, 실패 메시지 (화면 마크업은 pages/Login.jsx)
import { useState } from 'react';
import { useAuth } from './useAuth.js';

/**
 * @param {{ onSuccess?: () => void }} [options]  로그인에 성공하면 부를 함수 (예 : 메인으로 이동)
 */
export function useLoginForm({ onSuccess } = {}) {
  const { login } = useAuth();

  const [form, setForm] = useState({ userId: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  /** @param {import('react').SubmitEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // 두 번 눌러도 요청은 한 번

    // 로그인에서는 가입 규칙으로 검사하지 않음 (규칙이 바뀌어도 예전 계정이 들어올 수 있도록)
    if (!form.userId.trim() || !form.password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await login(form.userId.trim(), form.password);
      onSuccess?.();
    } catch (err) {
      // 401 : 서버가 보낸 '아이디 또는 비밀번호가 맞지 않습니다.' (어느 칸이 틀렸는지는 일부러 알려 주지 않음)
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return { form, error, submitting, handleChange, handleSubmit };
}
