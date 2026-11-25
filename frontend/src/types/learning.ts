export type CompetencyKind =
  | 'Core'
  | 'Managerial'
  | 'Operasional & K3'
  | 'Spesial'
  | 'Eksternal';

export interface RenditionSource {
  src: string;
  type: 'video/mp4' | 'application/x-mpegURL';
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
  levelLabel: string;
  title: string;
  description: string;
  durationSeconds: number;
  durationText: string;
  still: string;
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
  badge?: string;
  mandatoryFromSuperior?: boolean;
  topRank?: number;
  featuredInHero?: boolean;
  heroTagline?: string;
  summary: string;
  objectives: string[];
  poster: string;
  backdrop: string;
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
  employeeId?: string;
  name: string;
  role: string;
  division: string;
  location: string;
  annualTargetHours: number;
  baseCompletedHours: number;
}
