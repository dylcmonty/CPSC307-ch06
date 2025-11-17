// lib/normalsClient.ts
import https from "https";

export type DailyNormal = {
  station: string;
  date: string;       // YYYYMMDD as string
  meanTempF: number | null;
  minTempF: number | null;
  maxTempF: number | null;
  precipIn: number | null;
};

function parseNumber(value: string): number | null {
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

// NOTE: adjust column indices for the actual NOAA CSV layout.
// This is a simple placeholder assuming first 5 columns: date, mean, max, min, precip.
function parseCsv(station: string, csvText: string): DailyNormal[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
  // skip header if present; if not, keep all
  const dataLines = lines[0].toLowerCase().includes("date") ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const [date, mean, max, min, precip] = line.split(",");
    return {
      station,
      date: date, // maybe transform to YYYY-MM-DD later
      meanTempF: parseNumber(mean),
      maxTempF: parseNumber(max),
      minTempF: parseNumber(min),
      precipIn: parseNumber(precip),
    };
  });
}

// Fetch CSV via HTTPS from NOAA S3
export async function fetchNormalsForStation(station: string): Promise<DailyNormal[]> {
  const url = `https://noaa-normals-pds.s3.amazonaws.com/normals-daily/${station}.csv`;

  const csvText: string = await new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} from NOAA for station ${station}`));
          return;
        }
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => resolve(raw));
      })
      .on("error", reject);
  });

  return parseCsv(station, csvText);
}

export function filterNormalsByDate(
  records: DailyNormal[],
  startDate?: string,
  endDate?: string
): DailyNormal[] {
  let filtered = records;
  if (startDate) {
    filtered = filtered.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((r) => r.date <= endDate);
  }
  return filtered;
}

export function summarizeNormals(records: DailyNormal[]): {
  count: number;
  meanOfMeanTempF: number | null;
  minOfMinTempF: number | null;
  maxOfMaxTempF: number | null;
} {
  const temps = records
    .map((r) => r.meanTempF)
    .filter((v): v is number => v !== null);

  if (temps.length === 0) {
    return {
      count: 0,
      meanOfMeanTempF: null,
      minOfMinTempF: null,
      maxOfMaxTempF: null,
    };
  }

  const meanOfMeanTempF = temps.reduce((a, b) => a + b, 0) / temps.length;
  const minOfMinTempF = Math.min(
    ...records
      .map((r) => r.minTempF)
      .filter((v): v is number => v !== null)
  );
  const maxOfMaxTempF = Math.max(
    ...records
      .map((r) => r.maxTempF)
      .filter((v): v is number => v !== null)
  );

  return {
    count: records.length,
    meanOfMeanTempF,
    minOfMinTempF,
    maxOfMaxTempF,
  };
}
