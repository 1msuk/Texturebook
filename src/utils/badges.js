// src/utils/badges.js
// 칭호 설정 및 조건 계산

export const BADGE_CONFIG = {
  "마스터 테이스터": {
    emoji: "🏆",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    desc:  "게시물 15개 이상 & 긍정 리액션 300개 이상",
  },
  "북 소믈리에": {
    emoji: "🍷",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    desc:  "댓글 50개 이상 & 댓글 좋아요 150개 이상",
  },
};

/** 유저 프로필 데이터로 획득 칭호 목록 반환 */
export const computeBadges = (profile) => {
  const badges = [];
  if (profile.postCount >= 15 && profile.totalPositiveReactions >= 300) {
    badges.push("마스터 테이스터");
  }
  if (profile.commentCount >= 50 && profile.totalCommentLikes >= 150) {
    badges.push("북 소믈리에");
  }
  return badges;
};
