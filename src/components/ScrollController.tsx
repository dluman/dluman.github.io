import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollControllerProps {
  total: number;
  labels: string[];
}

const ScrollController: React.FC<ScrollControllerProps> = ({ total, labels }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const wheelAccumRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  const trackRef = useRef<HTMLElement | null>(null);
  const spacesRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    trackRef.current = document.querySelector('.spaces-track');
    spacesRef.current = Array.from(document.querySelectorAll<HTMLElement>('.space'));
  }, []);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= total) return;
    const spaces = spacesRef.current;
    if (spaces[index]) {
      spaces[index].scrollIntoView({ inline: 'start', behavior: 'smooth' });
    }
  }, [total]);

  const setActive = useCallback((index: number) => {
    setCurrentIndex(index);
    const track = trackRef.current;
    if (track) {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const pct = maxScroll > 0 ? (track.scrollLeft / maxScroll) * 100 : 0;
      setProgressWidth(pct);
    }
    const spaces = spacesRef.current;
    spaces.forEach((s, i) => s.classList.toggle('is-active', i === index));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isScrolling: number | null = null;

    const onScroll = () => {
      if (isScrolling !== null) window.clearTimeout(isScrolling);
      isScrolling = window.setTimeout(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        const spaces = spacesRef.current;
        let closest = 0;
        let closestDist = Infinity;
        spaces.forEach((s, i) => {
          const mid = s.offsetLeft + s.clientWidth / 2;
          const dist = Math.abs(center - mid);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        setActive(closest);
      }, 60);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      if (isScrolling !== null) window.clearTimeout(isScrolling);
    };
  }, [setActive]);

  useEffect(() => {
    const WHEEL_THRESHOLD = 60;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      let delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      else if (e.deltaMode === 2) delta *= 800;

      wheelAccumRef.current += delta;

      if (wheelAccumRef.current >= WHEEL_THRESHOLD) {
        goTo(currentIndex + 1);
        wheelAccumRef.current = 0;
      } else if (wheelAccumRef.current <= -WHEEL_THRESHOLD) {
        goTo(currentIndex - 1);
        wheelAccumRef.current = 0;
      }

      window.clearTimeout(scrollTimeoutRef.current ?? undefined);
      scrollTimeoutRef.current = window.setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 150);
    };

    document.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', onWheel);
      window.clearTimeout(scrollTimeoutRef.current ?? undefined);
    };
  }, [currentIndex, goTo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goTo(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(currentIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(total - 1);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, goTo, total]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = touchStartX - e.changedTouches[0].screenX;
      const dy = touchStartY - e.changedTouches[0].screenY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
      }
    };

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchend', onTouchEnd);
    };
  }, [currentIndex, goTo]);

  useEffect(() => {
    setActive(0);
  }, [setActive]);

  return (
    <>
      {/* Progress bar */}
      <div
        className="progress-bar"
        style={{ width: `${progressWidth}%` }}
      />

      {/* Top menu */}
      <nav className="top-menu" aria-label="Space navigation">
        {labels.map((label, i) => (
          <React.Fragment key={i}>
            <button
              className={`top-menu-item ${currentIndex === i ? 'is-active' : ''}`}
              aria-label={`Go to space ${i + 1}: ${label}`}
              onClick={() => goTo(i)}
            >
              <span className="item-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="item-label">
                {label}
              </span>
            </button>
            {i < total - 1 && (
              <span className="top-menu-divider" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Nav arrows */}
      <button
        className={`nav-arrow prev ${currentIndex === 0 ? 'is-hidden' : ''}`}
        aria-label="Previous space"
        onClick={() => goTo(currentIndex - 1)}
      >
        &#8592;
      </button>
      <button
        className={`nav-arrow next ${currentIndex === total - 1 ? 'is-hidden' : ''}`}
        aria-label="Next space"
        onClick={() => goTo(currentIndex + 1)}
      >
        &#8594;
      </button>

      {/* Scroll hint */}
      <div className={`scroll-hint ${currentIndex === 0 ? 'is-visible' : ''}`}>
        <span className="scroll-hint-text">Scroll</span>
        <div className="scroll-hint-chevron" />
      </div>
    </>
  );
};

export default ScrollController;
