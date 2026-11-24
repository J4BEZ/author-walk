import {useState} from "react";
import {toApiUrl} from "#src/api/client.js";

/**
 * 표지 이미지 : 후보 주소를 앞에서부터 시도하고, 모두 실패하면 fallback 을 보여 줍니다
 * - 목록은 [썸네일, 원본], 상세와 수정은 [원본] 처럼 넘김
 * - 서버에 파일이 없거나 (지워짐, 다른 PC 의 서버), 주소가 비어 있으면 깨진 이미지 대신 fallback
 * - /covers/... 주소는 toApiUrl 로 API 서버 주소를 붙임
 * @param {{
 *   sources: Array<string | null | undefined>,
 *   alt: string,
 *   fallback?: import('react').ReactNode,
 * } & Omit<import('react').ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>} props
 */
function CoverImage({sources, alt, fallback = null, ...imgProps}) {
  // 쓸 수 있는 주소만, 같은 주소는 한 번만
  const urls = [...new Set(sources.map(toApiUrl).filter(Boolean))];
  const key = urls.join("|");

  // 실패한 개수 : 주소 목록이 바뀌면 (표지를 새로 만듦) 처음부터 다시 시도
  const [failed, setFailed] = useState({key, count: 0});
  const count = failed.key === key ? failed.count : 0;

  if (count >= urls.length) return fallback;

  return (
    <img
      {...imgProps}
      src={urls[count]}
      alt={alt}
      onError={() => setFailed({key, count: count + 1})}
    />
  );
}

export default CoverImage;
