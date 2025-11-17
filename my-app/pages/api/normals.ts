// pages/api/normals.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  DailyNormal,
  fetchNormalsForStation,
  filterNormalsByDate,
  summarizeNormals,
} from "../../lib/normalsClient";

export type NormalsResponse = {
  station: string;
  startDate?: string;
  endDate?: string;
  records: DailyNormal[];
  summary: {
    count: number;
    meanOfMeanTempF: number | null;
    minOfMinTempF: number | null;
    maxOfMaxTempF: number | null;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NormalsResponse | { error: string }>
) {
  const { station, startDate, endDate } = req.query;

  if (!station || typeof station !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'station' parameter" });
  }

  try {
    const all = await fetchNormalsForStation(station);
    const filtered = filterNormalsByDate(
      all,
      typeof startDate === "string" ? startDate : undefined,
      typeof endDate === "string" ? endDate : undefined
    );
    const summary = summarizeNormals(filtered);

    return res.status(200).json({
      station,
      startDate: typeof startDate === "string" ? startDate : undefined,
      endDate: typeof endDate === "string" ? endDate : undefined,
      records: filtered,
      summary,
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to fetch climate normals" });
  }
}
