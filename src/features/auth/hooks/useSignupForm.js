// 가입 폼 : 입력 State, 칸별 메시지, 제출 (화면 마크업은 pages/SignUp.jsx)
import { useState } from 'react';
import { signup } from '../api/authApi.js';
import { validateSignupForm } from '../utils/authValidation.js';

/**
 * @param {{ onSuccess?: () => void }} [options]  가입에 성공하면 부를 함수 (예 : 로그인 화면으로 이동)
 */
export function useSignupForm({ onSuccess } = {}) {
  const [form, setForm] = useState({ userId: '', password: '', confirmPassword: '' });

  // 칸별 메시지 { userId, password, confirmPassword } : 화면 검사와 서버 400, 409 가 같은 모양
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));
  // 칸과 상관없는 실패 (서버가 꺼짐, 시간 초과 등)
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined })); // 고친 칸의 메시지만 지움
    setError('');
  };

  /** @param {import('react').SubmitEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const errors = validateSignupForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await signup(form.userId, form.password);
      onSuccess?.();
    } catch (err) {
      // 400 (규칙 위반), 409 (중복 아이디) 는 칸별 errors 로, 그 밖에는 폼 아래 메시지로
      const serverErrors = err instanceof Error ? err.cause?.errors : undefined;
      if (serverErrors) setFieldErrors(serverErrors);
      else setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return { form, fieldErrors, error, submitting, handleChange, handleSubmit };
}
