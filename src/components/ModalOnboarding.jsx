import { useState, useEffect } from "react";

const ModalOnboarding = ({ currentStep, totalSteps, step, onNext, onSkip, containerRef }) => {
  const [pos, setPos] = useState(null);
  // 本来の対象要素が無いとき (入力フォームが無いプロンプト等) は代替テキストを出す。
  // ref は描画中に読めないため、DOM を調べた結果を state に持つ
  const [usesFallback, setUsesFallback] = useState(false);

  useEffect(() => {
    if (!step) return;
    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const primary = container.querySelector(step.selector);
      const el = primary || (step.fallbackSelector && container.querySelector(step.fallbackSelector));
      setUsesFallback(!!step.fallbackSelector && !primary);
      if (el) {
        const r = el.getBoundingClientRect();
        setPos({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setPos(null);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep, step, containerRef]);

  const isLast = currentStep >= totalSteps - 1;

  const tooltipStyle = {};
  if (pos) {
    const below = pos.top + pos.height + 12;
    if (below + 160 < window.innerHeight) {
      tooltipStyle.top = (pos.top + pos.height + 12) + 'px';
    } else {
      tooltipStyle.bottom = (window.innerHeight - pos.top + 12) + 'px';
    }
    tooltipStyle.left = Math.max(12, Math.min(pos.left, window.innerWidth - 340)) + 'px';
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="modal-onboarding-overlay" onClick={onSkip}>
      {pos && (
        <div className="modal-onboarding-highlight" style={{
          top: pos.top - 4,
          left: pos.left - 4,
          width: pos.width + 8,
          height: pos.height + 8,
        }} />
      )}
      <div className="onboarding-tooltip" style={{ ...tooltipStyle, zIndex: 10003 }} onClick={e => e.stopPropagation()}>
        <div className="onboarding-step-count">{currentStep + 1} / {totalSteps}</div>
        <h4>{step?.title}</h4>
        <p>{usesFallback ? step.fallbackText : step?.text}</p>
        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={onSkip}>スキップ</button>
          <button className="onboarding-next" onClick={onNext}>{isLast ? '始める' : '次へ →'}</button>
        </div>
      </div>
    </div>
  );
};

export default ModalOnboarding;
