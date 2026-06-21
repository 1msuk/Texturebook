// src/components/BadgeTag.jsx
// 칭호 태그 컴포넌트

import { BADGE_CONFIG } from "../utils/badges";

const BadgeTag = ({ badge }) => {
  const cfg = BADGE_CONFIG[badge];
  if (!cfg) return null;
  return (
    <span
      title={cfg.desc}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  text-xs font-semibold border cursor-default select-none ${cfg.color}`}
    >
      {cfg.emoji} {badge}
    </span>
  );
};

export default BadgeTag;
