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
  videoUrl?: string;
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

// Admin / DB types
type SegmentKey = 'warmup' | 'lap1' | 'lap2' | 'lap3';

type Segment = {
  id: number;
  key: SegmentKey;
  label: string;
  start_date: string;
  end_date: string;
  weight: number;
};

type CrewRow = {
  id: number;
  team_name: string;
  driver_name: string;
  driver_avatar: string;
  navigator_name: string;
  navigator_avatar: string;
  color: string;
  glow_color: string;
  checkpoint1: boolean;
  checkpoint2: boolean;
  sort_order: number;
  video_url?: string;
};

type MetricRow = {
  id: number;
  crew_id: number;
  metric: 'connected_points' | 'sales_volume' | 'sku_count';
  target: number;
  fact: number;
};

export type { Crew, KPIMetric, WeeklyData, AppState, SegmentScores, SegmentKey, Segment, CrewRow, MetricRow };
