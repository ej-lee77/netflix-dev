import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `당신은 넷플릭스 스타일 OTT 서비스 "CONNECT"의 AI 어시스턴트입니다.
사용자가 원하는 영화나 시리즈를 찾을 수 있도록 도와주는 역할을 합니다.

역할:
- 사용자의 취향, 기분, 상황에 맞는 콘텐츠를 추천합니다
- 특정 장르, 분위기, 특징을 가진 작품을 탐색해줍니다
- 비슷한 작품을 찾아줍니다

답변 규칙:
- 반드시 한국어로 답변합니다
- 친근하고 간결한 톤을 유지합니다
- 추천 작품은 번호 목록 형식으로 제시합니다
- 각 작품에 제목, 간단한 추천 이유, 장르를 포함합니다
- 답변은 최대 5개 작품으로 제한합니다
- 실제로 존재하는 작품만 추천합니다
- 넷플릭스나 OTT에서 볼 수 있는 작품 위주로 추천합니다`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  // Gemini는 role이 "user" / "model"
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
