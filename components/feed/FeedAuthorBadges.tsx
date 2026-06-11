import Image from "next/image";
import { BADGE_LIST } from "@/data/badge";

interface FeedAuthorBadgesProps {
  badgeIds?: string[];
}

const badgeMap = new Map(BADGE_LIST.map((badge) => [badge.id, badge]));

export default function FeedAuthorBadges({
  badgeIds = [],
}: FeedAuthorBadgesProps) {
  const badges = badgeIds
    .slice(0, 3)
    .map((badgeId) => badgeMap.get(badgeId))
    .filter((badge) => badge !== undefined);

  if (badges.length === 0) return null;

  return (
    <span className="feed-author-badges" aria-label="획득한 뱃지">
      {badges.map((badge) => (
        <span
          key={badge.id}
          className="feed-author-badge-item"
          tabIndex={0}
          aria-label={badge.title}
          data-tooltip={badge.title}
        >
          <Image
            className="feed-author-badge"
            src={badge.imgUrl}
            alt={`${badge.name} 뱃지`}
            width={40}
            height={40}
          />
        </span>
      ))}
    </span>
  );
}
