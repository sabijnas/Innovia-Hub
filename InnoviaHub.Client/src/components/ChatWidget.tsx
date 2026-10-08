import { useState, type FormEvent } from "react";
import { askChat, type ChatResponse } from "../services/chatService";
import { createBooking } from "../services/bookingApiService";

type Message = {
  from: "user" | "assistant";
  text: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

//Konventerar användarens datum och tid, minskar risken för problem med tidszon
function toUtcIso(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

//Rendera fetmarkerad text i Ai:s svar
function renderAssistantText(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");

    return isBold ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    );
  });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [isLoading, setIsLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [message, setMessages] = useState<Message[]>([
    {
      from: "assistant",
      text: "Hej!😊 Jag kan hjälpa dig att hitta lediga resurser.",
    },
  ]);

  async function handleSumbit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim() || isLoading) return;

    const currentQuestion = question.trim();

    setMessages((current) => [
      ...current,
      { from: "user", text: currentQuestion },
    ]);
    setQuestion("");
    setIsLoading(true);

    const questionWithTime = `${currentQuestion}
    Sök efter lediga resurser för ${date} mellan ${startTime} och ${endTime}`;
    const startTimeUtc = toUtcIso(date, startTime);
    const endTimeUtc = toUtcIso(date, endTime);

    try {
      const answer = await askChat({
        question: questionWithTime,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        resourceTypeId: null,
      });

      const normalizedQuestion = currentQuestion.toLocaleLowerCase("sv-SE");

      const matchingResources = answer.resources.filter((resource) =>
        normalizedQuestion.includes(resource.name.toLocaleLowerCase("sv-SE")),
      );

      setChatResponse({
        ...answer,
        resources:
          matchingResources.length > 0 ? matchingResources : answer.resources,
      });

      setMessages((current) => [
        ...current,
        { from: "assistant", text: answer.answer },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          from: "assistant",
          text: error instanceof Error ? error.message : "Något gick fel",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function bookResource(resourceId: string) {
    if (!chatResponse) return;

    try {
      const booking = await createBooking({
        resourceId,
        startTime: chatResponse.startTime,
        endTime: chatResponse.endTime,
      });

      setMessages((current) => [
        ...current,
        {
          from: "assistant",
          text: `Bokningen är skapad för ${booking.resource.name}.`,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: "assistant",
          text: "Bokningen kunde inte skapas.",
        },
      ]);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <section className="mb-3 flex h-[540px] w-[360px] flex-col overflow-hidden rounded-xl border border-[#1e3347] bg-[#0d1824] shadow-2xl">
          <header className="flex items-center justify-between border-b border-[#1e3347] px-4 py-3">
            <div>
              <h2 className="font-semibold text-[#e2eaf2]">
                Innovia Hub-Assistenten
              </h2>
              <p className="text-xs text-[#7a94aa]">
                Sök efter lediga resurser
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xl text-[#7a94aa] hover:text-white"
              aria-label="Stäng chatten"
            >
              x
            </button>
          </header>

          <div className="grid grid-cols-2 gap-2 border-b border-[#1e3347] p-3">
            <label className="text-xs text-[#7a94aa]">
              Datum
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 w-full rounded border border-[#1e3347] bg-[#111e2d] p-2 text-sm text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[#7a94aa]">
                Från
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="mt-1 w-full rounded border border-[#1e3347] bg-[#111e2d] p-2 text-sm text-white"
                />
              </label>

              <label className="text-xs text-[#7a94aa]">
                Till
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="mt-1 w-full rounded border border-[#1e3347] bg-[#111e2d] p-2 text-sm text-white"
                />
              </label>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {message.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.from === "user"
                    ? "ml-auto bg-[#00d4aa] text-[#080e14]"
                    : "bg-[#111e2d] text-[#e2eaf2]"
                }`}
              >
                {message.from === "assistant" ? renderAssistantText(message.text) : message.text}
              </div>
            ))}

            {(chatResponse?.resources?.length ?? 0) > 0 && (
              <div className="space-y-2 border-b border-[#1e3347] p-3">
                {chatResponse?.resources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => bookResource(resource.id)}
                    className="w-full rounded bg-[#00d4aa] px-3 py-2 text-sm font-semibold text-[#080e14] hover:bg-[#00a882]"
                  >
                    Boka {resource.name}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="text-sm text-[#7a94aa]">Skriver...</div>
            )}
          </div>

          <form
            onSubmit={handleSumbit}
            className="flex gap-2 border-t border-[#1e3347] p-3"
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Skriv din fråga här"
              className="min-w-0 flex-1 rounded border border-[#1e3347] bg-[#111e2d] px-3 py-2 text-sm text-white outline-none"
            />

            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="rounded bg-[#00d4aa] px-3 py-2 text-sm font-semibold text-[#080e14] disabled:opacity-50"
            >
              Skicka
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ml-auto flex h-14 items-center justify-center"
        aria-label="Öppna chatten"
        style={{ cursor: "pointer", fontSize: "2rem" }}
      >
        💬
      </button>
    </div>
  );
}