export interface DailyTask {
  id: string;
  name: string;
  checks: { [day: string]: string | boolean | null }; // name of the spouse who completed it, or boolean for backward compatibility
  isCustom?: boolean;
}

export interface NTimesTask {
  id: string;
  name: string;
  targetCount: number;
  completedCount: number; // compatible with basic tracking
  completedBy?: string[]; // Array of spouse names who completed each execution (e.g., ['지민', '수현'])
  isCustom?: boolean;
  note: string;
}

export interface WeeklyTask {
  id: string;
  category: string;
  name: string;
  completed: boolean;
  completedBy?: string; // name of the spouse who completed it
  isCustom?: boolean;
}

export interface MonthlyRotationItem {
  id: string;
  category: string;
  name: string;
  isSelected: boolean;
  completed: boolean;
  completedBy?: string; // name of the spouse who completed it
  isCustom?: boolean;
}

export interface RelationshipQuest {
  id: string;
  name: string;
  completed: boolean;
  completedBy?: string; // 'A' | 'B' | 'together' or Spouse names
  xp: number;
}

export interface CleaningState {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  dailyTasks: DailyTask[];
  nTimesTasks: NTimesTask[];
  weeklyTasks: WeeklyTask[];
  monthlyTasks: MonthlyRotationItem[];
  memo: string;
  // Gamified newlywed extensions
  spouseAName?: string;
  spouseBName?: string;
  spouseAXp?: number; // Cumulative husband/spouseA score
  spouseBXp?: number; // Cumulative wife/spouseB score
  relationshipQuests?: RelationshipQuest[];
}

