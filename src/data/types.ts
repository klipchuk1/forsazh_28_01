// Types for Forsazh project
type KPIMetric = {
  target: number;
  fact: number;
};

type WeeklyData = {
  week: number;
  connectedPoints: number;
  salesVolume: number;
  skuCount: number;
};

type SegmentScores = {
  warmup: KPIMetric;
  lap1: KPIMetric;
  lap2: KPIMetric;
  lap3: KPIMetric;
};

type Crew = {
  id: number;
  teamName: string;
  driver: {
    name: string;
    avatar: string;
  };
  navigator: {
    name: string;
    avatar: string;
  };
  color: string;
  glowColor: string;
  metrics: {
    connectedPoints: KPIMetric;
    salesVolume: KPIMetric;
    skuCount: KPIMetric;
  };
  weeklyHistory: WeeklyData[];
  checkpoint1: boolean;
  checkpoint2: boolean;
  segmentScores: SegmentScores;
};

type AppState = {
  crews: Crew[];
  currentWeek: number;
  totalWeeks: number;
  selectedCrew: Crew | null;
};

export type { Crew, KPIMetric, WeeklyData, AppState, SegmentScores };
