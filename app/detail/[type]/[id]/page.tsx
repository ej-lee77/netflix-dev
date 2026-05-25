import DetailClient from "@/components/detail/Detail";

interface PageProps {
  params: Promise<{
    type: 'movie' | 'tv';
    id: string;
  }>;
}

export default async function DetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const mediaId = Number(id);

  return (
    <div className="sub-page pt-25">
      <div className="inner">
        {/* 클라이언트 컴포넌트에 필요한 정보만 props로 전달 */}
        <DetailClient type={type} mediaId={mediaId} />
      </div>
    </div>
  );
}