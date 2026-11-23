/**
 * 모든 응답을 ms 만큼 늦춥니다 (로딩 화면, 버튼 비활성화 확인용. json-server 의 --delay 대신)
 * @param {number} ms  늦출 시간 (밀리초)
 * @returns {(req: any, res: any, next: () => void) => void}
 */
export function delay(ms) {
  return (req, res, next) => {
    setTimeout(next, ms);
  };
}
