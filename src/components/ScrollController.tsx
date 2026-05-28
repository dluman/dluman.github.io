import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollControllerProps {
  total: number;
  labels: string[];
}

const ScrollController: React.FC<ScrollControllerProps> = ({ total, labels }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  const spacesRef = useRef<HTMLElement[]>([]);
  const trackRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    spacesRef.current = Array.from(document.querySelectorAll<HTMLElement>('.space'));
    trackRef.current = document.querySelector<HTMLElement>('.spaces-track');
  }, []);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= total) return;
    const spaces = spacesRef.current;
    if (spaces[index]) {
      spaces[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }, [total]);

  const setActive = useCallback((index: number) => {
    setCurrentIndex(index);
    const track = trackRef.current;
    if (!track) return;
    const scrollLeft = track.scrollLeft;
    const scrollWidth = track.scrollWidth - track.clientWidth;
    const pct = scrollWidth > 0 ? (scrollLeft / scrollWidth) * 100 : 0;
    setProgressWidth(pct);
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
        const scrollCenter = track.scrollLeft + track.clientWidth / 2;
        const spaces = spacesRef.current;
        let closest = 0;
        let closestDist = Infinity;
        spaces.forEach((s, i) => {
          const mid = s.offsetLeft + s.clientWidth / 2;
          const dist = Math.abs(scrollCenter - mid);
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
    let touchStartX = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [currentIndex, goTo]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const scrollCenter = track.scrollLeft + track.clientWidth / 2;
    const spaces = spacesRef.current;
    let closest = 0;
    let closestDist = Infinity;
    spaces.forEach((s, i) => {
      const mid = s.offsetLeft + s.clientWidth / 2;
      const dist = Math.abs(scrollCenter - mid);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActive(closest);
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
