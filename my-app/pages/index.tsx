// pages/index.tsx
import { useState } from "react";
import type { NormalsResponse } from "./api/normals";

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "system"; text: string }
  | { role: "data"; payload: NormalsResponse };

const defaultStation = "USW00014820"; // Akron-ish station
const defaultStart = "19910101";
const defaultEnd = "19910131";

const HomePage = () => {
  const [input, setInput] = useState(
    `Compare January 1991 normals for station ${defaultStation}`
  );
  const [station, setStation] = useState(defaultStation);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // For now, we don't parse natural language; we just use the current controls
    const userMessage: ChatMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const params = new URLSearchParams({
        station,
        startDate,
        endDate,
      });

      const res = await fetch(`/api/normals?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as NormalsResponse;
      const dataMessage: ChatMessage = { role: "data", payload: json };
      setMessages((prev) => [...prev, dataMessage]);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Climate Normals Explorer (Lab-04)</h1>
      <p>
        Ask questions about long-term daily climate normals by varying station and date
        range. This demonstrates sensitivity analysis over a third-party NOAA dataset.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 3fr",
          gap: "1rem",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
        }}
      >
        {/* Left: controls */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "0.75rem",
          }}
        >
          <h2>Query Controls</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Station ID
                <input
                  style={{ width: "100%" }}
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  placeholder="USW00014820"
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Start Date (YYYYMMDD)
                <input
                  style={{ width: "100%" }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                End Date (YYYYMMDD)
                <input
                  style={{ width: "100%" }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Chat Prompt
                <textarea
                  style={{ width: "100%", minHeight: "60px" }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </label>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Querying..." : "Send Query"}
            </button>
          </form>
          {error && (
            <div style={{ color: "red", marginTop: "0.5rem" }}>Error: {error}</div>
          )}
        </div>

        {/* Right: chat history */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "0.75rem",
            minHeight: "200px",
            maxHeight: "480px",
            overflowY: "auto",
          }}
        >
          <h2>Conversation</h2>
          {messages.length === 0 && (
            <p style={{ color: "#666" }}>
              No queries yet. Try the default prompt and then tweak station/date.
            </p>
          )}
          {messages.map((msg, idx) => {
            if (msg.role === "user") {
              return (
                <div key={idx} style={{ marginBottom: "0.5rem" }}>
                  <strong>User:</strong> {msg.text}
                </div>
              );
            }
            if (msg.role === "system") {
              return (
                <div key={idx} style={{ marginBottom: "0.5rem", color: "#555" }}>
                  <strong>System:</strong> {msg.text}
                </div>
              );
            }
            // data
            const { summary, station, startDate, endDate } = msg.payload;
            return (
              <div
                key={idx}
                style={{
                  marginBottom: "0.75rem",
                  background: "#f5f5f5",
                  borderRadius: "6px",
                  padding: "0.5rem",
                }}
              >
                <strong>Data response for {station}</strong>
                {startDate || endDate ? (
                  <div>
                    Range: {startDate ?? "…"} – {endDate ?? "…"}
                  </div>
                ) : null}
                <ul style={{ margin: "0.25rem 0 0 1rem" }}>
                  <li>Days in range: {summary.count}</li>
                  <li>
                    Mean of daily mean temps:{" "}
                    {summary.meanOfMeanTempF !== null
                      ? `${summary.meanOfMeanTempF.toFixed(1)} °F`
                      : "N/A"}
                  </li>
                  <li>
                    Minimum of daily mins:{" "}
                    {summary.minOfMinTempF !== null
                      ? `${summary.minOfMinTempF.toFixed(1)} °F`
                      : "N/A"}
                  </li>
                  <li>
                    Maximum of daily maxes:{" "}
                    {summary.maxOfMaxTempF !== null
                      ? `${summary.maxOfMaxTempF.toFixed(1)} °F`
                      : "N/A"}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
