import "./speakingAchievement.css";

const particles = Array.from({ length: 12 }, (_, index) => index + 1);

/** Decorative, one-shot fireworks anchored to the authoritative goal feedback row. */
export function AchievementFireworks({ major = false }: { major?: boolean }) {
  return <span aria-hidden="true" className={`achievement-fireworks ${major ? "achievement-fireworks--major" : ""}`}>
    <span className="achievement-fireworks__ring" />
    <span className="achievement-fireworks__core" />
    <span className="achievement-fireworks__particles">
      {particles.map(particle => <span key={particle}
        className={`achievement-fireworks__particle achievement-fireworks__particle--${particle}`} />)}
    </span>
  </span>;
}
