export type CompetencyKind =
  | 'Core'
  | 'Managerial'
  | 'Operasional & K3'
  | 'Spesial'
  | 'Eksternal';

export interface RenditionSource {
  src: string;
  type: 'video/mp4';
  label: string;
  height: number;
}

export interface CaptionTrack {
  src: string;
  language: string;
  label: string;
  default?: boolean;
}

export interface LearningEpisode {
  id: string;
  levelNumber: number;
  levelLabel: string; // e.g. "Level 1 · Dasar", "Level 2 · Praktik"
  title: string;
  description: string;
  durationSeconds: number;
  durationText: string; // e.g. "12 mnt"
  still: string; // 16:9 thumbnail
  renditions: RenditionSource[];
  captions: CaptionTrack[];
  chaptersVtt: string;
  introEndSeconds?: number;
  creditsStartSeconds?: number;
  keyTakeaways: string[];
}

export interface LearningModule {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  competency: string;
  kind: CompetencyKind;
  year: number;
  badge?: string; // e.g. "WAJIB K3", "DARI ATASAN", "LARA Q1", "EKSTERNAL", "BARU"
  mandatoryFromSuperior?: boolean;
  topRank?: number; // 1..10 for Top 10 SPIL Modules
  featuredInHero?: boolean;
  heroTagline?: string;
  summary: string;
  objectives: string[];
  poster: string; // 2:3 vertical card art
  backdrop: string; // 16:9 widescreen hero/card art
  totalDurationText: string;
  division: string;
  instructors: {
    name: string;
    role: string;
  }[];
  episodes: LearningEpisode[];
}

export interface EpisodeProgress {
  moduleId: string;
  moduleSlug: string;
  episodeId: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
  hiddenFromContinue?: boolean;
}

export interface EmployeeProfile {
  name: string;
  role: string;
  division: string;
  location: string;
  annualTargetHours: number;
  baseCompletedHours: number;
}
