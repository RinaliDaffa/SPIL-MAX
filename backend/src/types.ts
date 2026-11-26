export type CompetencyKind =
  | 'Core'
  | 'Technical'
  | 'Managerial'
  | 'Learn More';

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
  moduleId?: string;
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
  instructors: { name: string; role: string }[];
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

export interface EmployeeContext {
  employeeId: string;
  name: string;
  role: string;
  division: string;
  location: string;
  annualTargetHours: number;
  baseCompletedHours: number;
}
