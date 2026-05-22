import Image from "next/image";

export default function Home() {
  return (
    <div className="inner">
      <h2>여기는 첫번쨰 화면입니다.</h2>

      <section>
        <h2>영상</h2>
        <div>
          <ul className="grid grid-cols-4 gap-8">
          </ul>
        </div>
      </section>
    </div>
  );
}
