import "./sectionTitle.scss";

type SectionTitleProps = {
    title: string;
    subTitle?: string;
    showMore?: boolean;
    onMoreClick?: () => void;
};

export default function SectionTitle({
    title,
    subTitle,
    showMore = true,
    onMoreClick,
}: SectionTitleProps) {
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
                <button
                    className="see-all"
                    onClick={onMoreClick}
                >
                    전체보기 ›
                </button>
            )}
        </div>
    );
}