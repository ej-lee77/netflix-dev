"use client";

import Link from "next/link";
import "./sectionTitle.scss";
import { useSubscriptionGuard } from "@/lib/subscription";
import { useSubscribeModalStore } from "@/store/useSubscribeModalStore";

type SectionTitleProps = {
    title: string;
    subTitle?: string;
    showMore?: boolean;
    onMoreClick?: () => void;
    href?: string;
};

export default function SectionTitle({
    title,
    subTitle,
    showMore = true,
    onMoreClick,
    href,
}: SectionTitleProps) {
    const { isUnsubscribed } = useSubscriptionGuard();
    const openModal = useSubscribeModalStore((state) => state.openModal);

    const handleClick = (e: React.MouseEvent) => {
        if (isUnsubscribed) {
            e.preventDefault();
            openModal();
        }
    };

    return (
        <div className="section-header">
            <div className="section-title-wrap">
                <h2 className="section-title">
                    {title}
                </h2>

                {subTitle && (
                    <p className="section-sub">
                        {subTitle}
                    </p>
                )}
            </div>

            {showMore && (
                href
                    ? <Link href={href} className="see-all" onClick={handleClick}>전체보기 ›</Link>
                    : <button className="see-all" onClick={isUnsubscribed ? openModal : onMoreClick}>전체보기 ›</button>
            )}
        </div>
    );
}