import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// ─── Onboarding Overlay ──────────────────────────────────────────────────────
const OnboardingOverlay = ({ steps, currentStep, onNext, onSkip }) => {
  const [pos, setPos] = useState(null);
  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // 位置計測は描画後のフレームで行い、effect 内で同期的に再レンダーを連鎖させない
    const frame = requestAnimationFrame(() => {
      if (el) {
        const r = el.getBoundingClientRect();
        setPos({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setPos(null);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep, step]);

  const isLast = currentStep >= steps.length - 1;
  const tooltipStyle = {};
  if (pos) {
    const below = pos.top + pos.height + 12;
    const above = pos.top - 12;
    if (below + 160 < window.innerHeight) {
      tooltipStyle.top = below + 'px';
    } else {
      tooltipStyle.bottom = (window.innerHeight - above) + 'px';
    }
    tooltipStyle.left = Math.max(12, Math.min(pos.left, window.innerWidth - 340)) + 'px';
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return createPortal(
    <div className="onboarding-overlay" onClick={onSkip}>
      {pos && <div className="onboarding-highlight" style={{ top: pos.top - 4, left: pos.left - 4, width: pos.width + 8, height: pos.height + 8 }} />}
      <div className="onboarding-tooltip" style={tooltipStyle} onClick={e => e.stopPropagation()}>
        <div className="onboarding-step-count">{currentStep + 1} / {steps.length}</div>
        <h4>{step?.title}</h4>
        <p>{step?.text}</p>
        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={onSkip}>スキップ</button>
          <button className="onboarding-next" onClick={onNext}>{isLast ? '始める' : '次へ →'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OnboardingOverlay;
