import {useCallback, useEffect, useRef, useState} from "react";
import "../styles/BookContentPager.css";

const SWIPE_DISTANCE = 50;

function BookContentPager({content}) {
  const viewRef = useRef(null);
  const touchStartX = useRef(null);

  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [width, setWidth] = useState(0);

  // 페이지 수 / 박스 폭 계산
  const measure = useCallback(() => {
    const el = viewRef.current;
    if (!el) return;

    const w = el.getBoundingClientRect().width;
    if (w === 0) return;

    const count = Math.max(1, Math.ceil((el.scrollWidth - 1) / w));
    setPageCount(count);
    setWidth(w);
    setPage((p) => Math.min(p, count - 1));
    }, []);

  // 내용, 크기, 폰트 로딩이 바뀌면 다시 계산
  useEffect(() => {
    measure();

    const el = viewRef.current;
    if (!el) return;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, [content, measure]);

  // 현재 페이지 위치로 이동
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;

    el.scrollLeft = page * el.getBoundingClientRect().width;
  }, [page, pageCount, width]);

  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;

    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (diff <= -SWIPE_DISTANCE) next();
    if (diff >= SWIPE_DISTANCE) prev();
  };

  if (!content?.trim()) {
    return <p className="book-pager-empty">작품 내용이 없습니다.</p>;
  }

  return (
    <div className="book-pager" onKeyDown={handleKeyDown}>
      <div className="book-pager-page">
        <div
          className="book-pager-view"
          ref={viewRef}
          tabIndex={0}
          aria-label="작품 내용"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}>
          <div className="book-pager-text">{content}</div>
        </div>
      </div>

      <div className="book-pager-controls">
        <button
          type="button"
          onClick={prev}
          disabled={page === 0}
          aria-label="이전 페이지">
          ‹ 이전
        </button>

        <span className="book-pager-count" aria-live="polite">
          {page + 1} / {pageCount}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={page >= pageCount - 1}
          aria-label="다음 페이지">
          다음 ›
        </button>
      </div>

      <div className="book-pager-progress" aria-hidden="true">
        <span style={{width: `${((page + 1) / pageCount) * 100}%`}} />
      </div>
    </div>
  );
}

export default BookContentPager;