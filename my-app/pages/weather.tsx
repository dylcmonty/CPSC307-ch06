import { useState } from "react";

/*
 * Weather Forecast Component
 *
 * This React component provides a simple form for requesting a multi‑day
 * weather forecast from the OpenWeatherMap API.  Users enter a city
 * name and select how many days of forecast data they would like.  When
 * the form is submitted, the component performs a fetch call to the
 * OpenWeatherMap 5‑day/3‑hour forecast endpoint.  It then groups the
 * returned entries by date, computes simple averages for temperature
 * and probability of precipitation, and renders a summary list.
 *
 * API Key Configuration
 * ---------------------
 * To run this component on your own machine you need a free API key
 * from https://openweathermap.org.  Once obtained, create a file
 * called `.env.local` in the root of your Next.js project (at the
 * same level as package.json) and add the following line:
 *
 *   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
 *
 * By prefixing the variable name with `NEXT_PUBLIC_` you make it
 * available on the client side via `process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY`.
 */

const Weather: React.FC = () => {
  const [city, setCity] = useState("");
  const [days, setDays] = useState(4);
  const [results, setResults] = useState<
    { date: string; avgTemp: string; pop: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Read the API key from an environment variable.  If you prefer
  // hardcoding, replace `process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY`
  // with a string containing your API key.
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

  async function fetchWeather() {
    if (!API_KEY) {
      setError(
        "Missing API key. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY in your .env.local"
      );
      return;
    }
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }
    setError(null);
    setResults([]);
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&units=imperial&appid=${API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        setError("Failed to fetch weather data");
        return;
      }
      const data = await resp.json();
      // Group forecast entries by date (YYYY‑MM‑DD)
      const daily: Record<string, any[]> = {};
      data.list.forEach((entry: any) => {
        const date = entry.dt_txt.split(" ")[0];
        if (!daily[date]) daily[date] = [];
        daily[date].push(entry);
      });
      // Select the first N days
      const selectedDates = Object.keys(daily).slice(0, days);
      const summary = selectedDates.map((date) => {
        const entries = daily[date];
        const temps = entries.map((e: any) => e.main.temp);
        const pops = entries.map((e: any) => e.pop);
        const avgTemp =
          temps.reduce((acc: number, val: number) => acc + val, 0) / temps.length;
        const avgPop =
          pops.reduce((acc: number, val: number) => acc + val, 0) / pops.length;
        return {
          date,
          avgTemp: avgTemp.toFixed(1),
          pop: Math.round(avgPop * 100),
        };
      });
      setResults(summary);
    } catch (err) {
      setError("Unexpected error fetching weather data");
    }
  }

  return (
    <div style={{ maxWidth: "420px", margin: "2rem auto", padding: "1rem" }}>
      <h2>Weather Forecast</h2>
      <div style={{ marginBottom: "0.5rem" }}>
        <label style={{ marginRight: "0.5rem" }} htmlFor="city">
          City:
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <label style={{ marginRight: "0.5rem" }} htmlFor="days">
          Days:
        </label>
        <input
          id="days"
          type="number"
          min="1"
          max="5"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </div>
      <button onClick={fetchWeather}>Get Weather</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {results.map((r) => (
          <li key={r.date} style={{ margin: "0.5rem 0" }}>
            <strong>{r.date}</strong>: {r.avgTemp}°F &nbsp;|&nbsp; Rain chance: {r.pop}%
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Weather;