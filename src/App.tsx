import React, { useState, useEffect, useRef } from 'react';
import { DailyChecklist } from './components/DailyChecklist';
import { NTimeChecklist } from './components/NTimeChecklist';
import { WeeklyChecklist } from './components/WeeklyChecklist';
import { MonthlyRotation } from './components/MonthlyRotation';
import { MemoSection } from './components/MemoSection';
import { StatsSummary } from './components/StatsSummary';
import { DailyTask, NTimesTask, WeeklyTask, MonthlyRotationItem, RelationshipQuest } from './types';
import { db, saveHouseState, checkHouseExists, generateSyncCode } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  INITIAL_DAILY_SUBMISSIONS,
  INITIAL_N_TIMES_TASKS,
  INITIAL_WEEKLY_TASKS,
  INITIAL_MONTHLY_TASKS,
  INITIAL_RELATIONSHIP_QUESTS,
  getWeekDates,
} from './data';
import { RelationshipQuestList } from './components/RelationshipQuestList';
import { HouseInterior } from './components/HouseInterior';
import { Trophy } from 'lucide-react';
import { 
  Printer, 
  RotateCcw, 
  Calendar, 
  Trash2, 
  Plus, 
  Heart, 
  CalendarDays, 
  Sparkles,
  Info,
  CheckCircle,
  TrendingUp,
  Sliders,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
  Check,
  X,
  Link,
  Copy,
  Share2,
  Github
} from 'lucide-react';

// UTF-8 compatible robust base64 serialization
const encodeStateToBase64 = (stateObj: any) => {
  try {
    const json = JSON.stringify(stateObj);
    const utf8Bytes = new TextEncoder().encode(json);
    let binary = "";
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Base64 encode failed", e);
    return "";
  }
};

const decodeBase64ToState = (base64Str: string) => {
  try {
    const binary = atob(base64Str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (e) {
    console.error("Base64 decode failed", e);
    return null;
  }
};

// URL State reader helper
const getInitialStateFromUrlOrStorage = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlState = params.get('state');
    if (urlState) {
      const decoded = decodeBase64ToState(urlState);
      if (decoded && typeof decoded === 'object') {
        // Hydrate to localStorage and remove from query string to clean the URL bar
        try {
          localStorage.setItem('house_cleaning_state_v2', JSON.stringify(decoded));
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
          return decoded;
        } catch (e) {
          console.warn("Could not save hydrated state to localStorage", e);
          return decoded;
        }
      }
    }
    
    // Fallback to existing localStorage state
    const saved = localStorage.getItem('house_cleaning_state_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing existing localstorage state", e);
      }
    }
  }
  return null;
};

// Robust state migration helpers to force-apply the user's requested structural modifications
const migrateNTimesTasks = (tasks: NTimesTask[]): NTimesTask[] => {
  if (!tasks || !Array.isArray(tasks)) return INITIAL_N_TIMES_TASKS;
  
  // Safe filtering: keep only valid objects with an id and a name
  const validTasks = tasks.filter(t => t && typeof t === 'object' && t.id && typeof t.name === 'string');
  
  const hasToilet = validTasks.some(t => t.name.replace(/\s+/g, '') === '변기청소');
  if (!hasToilet) {
    // Check if there is an id 'ntimes_5' already
    const hasId5 = validTasks.some(t => t.id === 'ntimes_5');
    const newId = hasId5 ? `ntimes_${Date.now()}` : 'ntimes_5';
    return [
      ...validTasks,
      {
        id: newId,
        name: '변기 청소',
        targetCount: 1,
        completedCount: 0,
        note: '주 1회'
      }
    ];
  }
  return validTasks;
};

const migrateWeeklyTasks = (tasks: WeeklyTask[]): WeeklyTask[] => {
  if (!tasks || !Array.isArray(tasks)) return INITIAL_WEEKLY_TASKS;
  
  return tasks
    .filter(t => t && typeof t === 'object' && t.id)
    .map(t => {
      const name = typeof t.name === 'string' ? t.name : '';
      // If the task matches old name '변기 + 세면대 + 수전 물때 닦기' or weekly_1, change it to include '세면대 배수구 청소'
      if (t.id === 'weekly_1' || name.includes('변기 + 세면대 + 수전 물때 닦기')) {
        return {
          ...t,
          name: '세면대 배수구 청소 + 수전 물때 닦기'
        };
      }
      return {
        ...t,
        name: name || '새 욕실 작업'
      };
    });
};

export default function App() {
  // 0. Cloud Firebase Real-time Sync States
  const [houseCode, setHouseCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('house');
      if (urlCode && /^\d{6}$/.test(urlCode)) {
        return urlCode;
      }
      return localStorage.getItem('house_cleaning_sync_code') || '';
    }
    return '';
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'connected'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  
  // Robust refs to track the latest state and last synced state to prevent infinite sync loops
  const latestStateRef = useRef<any>(null);
  const lastSyncedStateRef = useRef<any>(null);

  // 1. Core States with Bulletproof Lazy State Initialization to prevent storage flickers
  const [weekStart, setWeekStart] = useState<string>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded?.weekStart || getWeekDates().start;
  });

  const [weekEnd, setWeekEnd] = useState<string>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded?.weekEnd || getWeekDates().end;
  });
  
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded && Array.isArray(loaded.dailyTasks) && loaded.dailyTasks.length > 0 ? loaded.dailyTasks : INITIAL_DAILY_SUBMISSIONS;
  });

  const [nTimesTasks, setNTimesTasks] = useState<NTimesTask[]>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    const tasks = loaded && Array.isArray(loaded.nTimesTasks) && loaded.nTimesTasks.length > 0 ? loaded.nTimesTasks : INITIAL_N_TIMES_TASKS;
    return migrateNTimesTasks(tasks);
  });

  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    const tasks = loaded && Array.isArray(loaded.weeklyTasks) && loaded.weeklyTasks.length > 0 ? loaded.weeklyTasks : INITIAL_WEEKLY_TASKS;
    return migrateWeeklyTasks(tasks);
  });

  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyRotationItem[]>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded && Array.isArray(loaded.monthlyTasks) && loaded.monthlyTasks.length > 0 ? loaded.monthlyTasks : INITIAL_MONTHLY_TASKS;
  });

  const [memo, setMemo] = useState<string>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded?.memo !== undefined ? loaded.memo : '';
  });

  // Gamified Newlyweds configuration states
  const [spouseAName, setSpouseAName] = useState<string>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded?.spouseAName || '지민';
  });

  const [spouseBName, setSpouseBName] = useState<string>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded?.spouseBName || '수현';
  });

  const [relationshipQuests, setRelationshipQuests] = useState<RelationshipQuest[]>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return loaded && Array.isArray(loaded.relationshipQuests) && loaded.relationshipQuests.length > 0 
      ? loaded.relationshipQuests 
      : INITIAL_RELATIONSHIP_QUESTS;
  });

  // Cumulative RPG progression values
  const [cumulativeHomeXp, setCumulativeHomeXp] = useState<number>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return typeof loaded?.cumulativeHomeXp === 'number' ? loaded.cumulativeHomeXp : 0;
  });

  const [spouseAOverallXp, setSpouseAOverallXp] = useState<number>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return typeof loaded?.spouseAOverallXp === 'number' ? loaded.spouseAOverallXp : 0;
  });

  const [spouseBOverallXp, setSpouseBOverallXp] = useState<number>(() => {
    const loaded = getInitialStateFromUrlOrStorage();
    return typeof loaded?.spouseBOverallXp === 'number' ? loaded.spouseBOverallXp : 0;
  });

  // 2. Control/View States
  const [printModel, setPrintModel] = useState<'blank' | 'checked'>('blank');
  const [copiedState, setCopiedState] = useState<'none' | 'share' | 'direct'>('none');
  const [showGitGuide, setShowGitGuide] = useState(false);
  
  // 3. Custom Friendly Modal dialogs to bypass Chrome Sandbox Frame rules
  const [isNextWeekModalOpen, setIsNextWeekModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPrintGuideOpen, setIsPrintGuideOpen] = useState(false);
  const [isSettlementResultOpen, setIsSettlementResultOpen] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);

  // Keep the latestStateRef up-to-date with current component states on every single render
  latestStateRef.current = {
    weekStart,
    weekEnd,
    dailyTasks,
    nTimesTasks,
    weeklyTasks,
    monthlyTasks,
    memo,
    spouseAName,
    spouseBName,
    relationshipQuests,
    cumulativeHomeXp,
    spouseAOverallXp,
    spouseBOverallXp,
  };

  // Save houseCode to localStorage whenever it changes (e.g., when loaded from URL query param)
  useEffect(() => {
    if (houseCode) {
      localStorage.setItem('house_cleaning_sync_code', houseCode);
    }
  }, [houseCode]);

  // 1-A. Real-time Firebase Subscriber Effect
  useEffect(() => {
    if (!houseCode) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('syncing');
    const docRef = doc(db, 'houses', houseCode);
    
    // Register live Firestore snapshot subscription for instant bi-directional updates
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Compare incoming Firestore data with the current up-to-date state from the ref
        const currentLocal = latestStateRef.current;
        if (!currentLocal) return;
        
        const incomingNTimes = migrateNTimesTasks(data.nTimesTasks);
        const incomingWeekly = migrateWeeklyTasks(data.weeklyTasks);
        
        const isSame = 
          JSON.stringify(data.dailyTasks) === JSON.stringify(currentLocal.dailyTasks) &&
          JSON.stringify(incomingNTimes) === JSON.stringify(currentLocal.nTimesTasks) &&
          JSON.stringify(incomingWeekly) === JSON.stringify(currentLocal.weeklyTasks) &&
          JSON.stringify(data.monthlyTasks) === JSON.stringify(currentLocal.monthlyTasks) &&
          data.memo === currentLocal.memo &&
          data.spouseAName === currentLocal.spouseAName &&
          data.spouseBName === currentLocal.spouseBName &&
          JSON.stringify(data.relationshipQuests) === JSON.stringify(currentLocal.relationshipQuests) &&
          data.cumulativeHomeXp === currentLocal.cumulativeHomeXp &&
          data.spouseAOverallXp === currentLocal.spouseAOverallXp &&
          data.spouseBOverallXp === currentLocal.spouseBOverallXp &&
          data.weekStart === currentLocal.weekStart &&
          data.weekEnd === currentLocal.weekEnd;

        if (!isSame) {
          const newState = {
            weekStart: data.weekStart || currentLocal.weekStart,
            weekEnd: data.weekEnd || currentLocal.weekEnd,
            dailyTasks: data.dailyTasks || currentLocal.dailyTasks,
            nTimesTasks: incomingNTimes,
            weeklyTasks: incomingWeekly,
            monthlyTasks: data.monthlyTasks || currentLocal.monthlyTasks,
            memo: data.memo !== undefined ? data.memo : currentLocal.memo,
            spouseAName: data.spouseAName || currentLocal.spouseAName,
            spouseBName: data.spouseBName || currentLocal.spouseBName,
            relationshipQuests: data.relationshipQuests || currentLocal.relationshipQuests,
            cumulativeHomeXp: typeof data.cumulativeHomeXp === 'number' ? data.cumulativeHomeXp : currentLocal.cumulativeHomeXp,
            spouseAOverallXp: typeof data.spouseAOverallXp === 'number' ? data.spouseAOverallXp : currentLocal.spouseAOverallXp,
            spouseBOverallXp: typeof data.spouseBOverallXp === 'number' ? data.spouseBOverallXp : currentLocal.spouseBOverallXp,
          };
          
          lastSyncedStateRef.current = newState;
          
          if (data.weekStart) setWeekStart(data.weekStart);
          if (data.weekEnd) setWeekEnd(data.weekEnd);
          if (data.dailyTasks) setDailyTasks(data.dailyTasks);
          setNTimesTasks(incomingNTimes);
          setWeeklyTasks(incomingWeekly);
          if (data.monthlyTasks) setMonthlyTasks(data.monthlyTasks);
          if (data.memo !== undefined) setMemo(data.memo);
          if (data.spouseAName) setSpouseAName(data.spouseAName);
          if (data.spouseBName) setSpouseBName(data.spouseBName);
          if (data.relationshipQuests) setRelationshipQuests(data.relationshipQuests);
          if (typeof data.cumulativeHomeXp === 'number') setCumulativeHomeXp(data.cumulativeHomeXp);
          if (typeof data.spouseAOverallXp === 'number') setSpouseAOverallXp(data.spouseAOverallXp);
          if (typeof data.spouseBOverallXp === 'number') setSpouseBOverallXp(data.spouseBOverallXp);
        } else {
          lastSyncedStateRef.current = currentLocal;
        }
        
        setSyncStatus('connected');
        setSyncErrorMessage(null);
      } else {
        setSyncStatus('error');
        setSyncErrorMessage('연동된 방이 서버에서 존재하지 않습니다.');
      }
    }, (err) => {
      console.error("Firestore sync subscription error:", err);
      setSyncStatus('error');
      setSyncErrorMessage('서버 연동 도중 통신 장애가 발생했습니다.');
    });

    return () => {
      unsubscribe();
    };
  }, [houseCode]);

  // Auto save to localStorage only when states are properly hydrated, and sync to Firebase Firestore if connected
  useEffect(() => {
    if (weekStart && weekEnd && dailyTasks.length > 0) {
      const stateObject = {
        weekStart,
        weekEnd,
        dailyTasks,
        nTimesTasks,
        weeklyTasks,
        monthlyTasks,
        memo,
        spouseAName,
        spouseBName,
        relationshipQuests,
        cumulativeHomeXp,
        spouseAOverallXp,
        spouseBOverallXp,
      };
      localStorage.setItem('house_cleaning_state_v2', JSON.stringify(stateObject));

      // Realtime Cloud Synchronization
      if (houseCode) {
        // Compare with what was last synced (either read from Firestore or written to Firestore)
        const lastSynced = lastSyncedStateRef.current;
        
        const isSameAsSynced = lastSynced &&
          JSON.stringify(stateObject.dailyTasks) === JSON.stringify(lastSynced.dailyTasks) &&
          JSON.stringify(stateObject.nTimesTasks) === JSON.stringify(lastSynced.nTimesTasks) &&
          JSON.stringify(stateObject.weeklyTasks) === JSON.stringify(lastSynced.weeklyTasks) &&
          JSON.stringify(stateObject.monthlyTasks) === JSON.stringify(lastSynced.monthlyTasks) &&
          stateObject.memo === lastSynced.memo &&
          stateObject.spouseAName === lastSynced.spouseAName &&
          stateObject.spouseBName === lastSynced.spouseBName &&
          JSON.stringify(stateObject.relationshipQuests) === JSON.stringify(lastSynced.relationshipQuests) &&
          stateObject.cumulativeHomeXp === lastSynced.cumulativeHomeXp &&
          stateObject.spouseAOverallXp === lastSynced.spouseAOverallXp &&
          stateObject.spouseBOverallXp === lastSynced.spouseBOverallXp &&
          stateObject.weekStart === lastSynced.weekStart &&
          stateObject.weekEnd === lastSynced.weekEnd;

        if (isSameAsSynced) {
          // Skip saving since this state is already synced with Firestore
          return;
        }

        // Debounce writes to prevent overloading database when typing memo
        const timer = setTimeout(() => {
          lastSyncedStateRef.current = stateObject;
          saveHouseState(houseCode, stateObject);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [
    weekStart, 
    weekEnd, 
    dailyTasks, 
    nTimesTasks, 
    weeklyTasks, 
    monthlyTasks, 
    memo, 
    spouseAName, 
    spouseBName, 
    relationshipQuests,
    cumulativeHomeXp,
    spouseAOverallXp,
    spouseBOverallXp,
    houseCode
  ]);

  // Handle Date range manual update
  const handleDateChange = (start: string, end: string) => {
    setWeekStart(start);
    setWeekEnd(end);
  };

  // Quick Date calculation helper (previous, current, next)
  const setRelativeWeek = (offsetWeeks: number) => {
    const baseDate = new Date(weekStart || new Date());
    baseDate.setDate(baseDate.getDate() + offsetWeeks * 7);
    const range = getWeekDates(baseDate);
    setWeekStart(range.start);
    setWeekEnd(range.end);
  };

  // Section 0. Realtime Cloud Synchronization Handlers
  const handleCreateSyncSession = async () => {
    try {
      setSyncStatus('syncing');
      setSyncErrorMessage(null);
      const newCode = generateSyncCode();
      const stateObject = {
        weekStart,
        weekEnd,
        dailyTasks,
        nTimesTasks,
        weeklyTasks,
        monthlyTasks,
        memo,
        spouseAName,
        spouseBName,
        relationshipQuests,
        cumulativeHomeXp,
        spouseAOverallXp,
        spouseBOverallXp,
      };
      await saveHouseState(newCode, stateObject);
      localStorage.setItem('house_cleaning_sync_code', newCode);
      setHouseCode(newCode);
      setSyncStatus('connected');
    } catch (e) {
      console.error("Create sync session error:", e);
      setSyncStatus('error');
      setSyncErrorMessage('연동 세션 생성 중 오류가 발생했습니다.');
    }
  };

  const handleJoinSyncSession = async (codeToJoin: string) => {
    const trimmed = codeToJoin.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setSyncErrorMessage('6자리 숫자 코드를 정확히 입력해 주세요.');
      return;
    }

    try {
      setSyncStatus('syncing');
      setSyncErrorMessage(null);
      const exists = await checkHouseExists(trimmed);
      if (exists) {
        localStorage.setItem('house_cleaning_sync_code', trimmed);
        setHouseCode(trimmed);
      } else {
        setSyncStatus('error');
        setSyncErrorMessage('존재하지 않거나 만료된 연동 코드입니다. 다시 확인해 주세요.');
      }
    } catch (e) {
      console.error("Join sync session error:", e);
      setSyncStatus('error');
      setSyncErrorMessage('연동 방 연결 중 서버 오류가 발생했습니다.');
    }
  };

  const handleDisconnectSyncSession = () => {
    localStorage.removeItem('house_cleaning_sync_code');
    setHouseCode('');
    setSyncStatus('idle');
    setSyncErrorMessage(null);
    setSyncCodeInput('');
  };

  const [copiedSyncCode, setCopiedSyncCode] = useState(false);
  const handleCopySyncCode = () => {
    if (!houseCode) return;
    const inviteLink = `${window.location.origin}${window.location.pathname}?house=${houseCode}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedSyncCode(true);
      setTimeout(() => setCopiedSyncCode(false), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  };

  // Section ➊ Daily Routine handlers - Cycles through [null, spouseAName, spouseBName]
  const handleToggleDailyCheck = (taskId: string, day: string) => {
    setDailyTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const current = task.checks[day];
          let nextValue: string | null = null;
          if (!current || current === true) {
            nextValue = spouseAName;
          } else if (current === spouseAName) {
            nextValue = spouseBName;
          } else {
            nextValue = null;
          }
          return {
            ...task,
            checks: {
              ...task.checks,
              [day]: nextValue,
            },
          };
        }
        return task;
      })
    );
  };

  const handleDailyAddTask = (name: string) => {
    const newTask: DailyTask = {
      id: `daily_custom_${Date.now()}`,
      name,
      checks: { '월': false, '화': false, '수': false, '목': false, '금': false, '토': false, '일': false },
      isCustom: true,
    };
    setDailyTasks((prev) => [...prev, newTask]);
  };

  const handleDailyDeleteTask = (taskId: string) => {
    setDailyTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Section ➋ N-Times Task handlers - cycles CompletedBy through [null, spouseAName, spouseBName]
  const handleToggleNTimesCheck = (taskId: string, checkboxIndex: number) => {
    setNTimesTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const completedBy = task.completedBy ? [...task.completedBy] : new Array(task.targetCount).fill(null);
          // safeguard size matching targetCount
          while (completedBy.length < task.targetCount) {
            completedBy.push(null);
          }
          const current = completedBy[checkboxIndex];
          let nextValue: string | null = null;
          if (!current) {
            nextValue = spouseAName;
          } else if (current === spouseAName) {
            nextValue = spouseBName;
          } else {
            nextValue = null;
          }
          completedBy[checkboxIndex] = nextValue;
          const completedCount = completedBy.filter(Boolean).length;
          return {
            ...task,
            completedBy,
            completedCount,
          };
        }
        return task;
      })
    );
  };

  const handleNTimesAddTask = (name: string, targetCount: number, note: string) => {
    const newTask: NTimesTask = {
      id: `ntimes_custom_${Date.now()}`,
      name,
      targetCount,
      completedCount: 0,
      completedBy: new Array(targetCount).fill(null),
      note,
      isCustom: true,
    };
    setNTimesTasks((prev) => [...prev, newTask]);
  };

  const handleNTimesDeleteTask = (taskId: string) => {
    setNTimesTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Section ➌ Weekly Task handlers - Cycles through [uncompleted, spouseA, spouseB]
  const handleToggleWeeklyCheck = (taskId: string) => {
    setWeeklyTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const currentCompleted = task.completed;
          const currentBy = task.completedBy;
          
          let nextCompleted = false;
          let nextBy: string | undefined = undefined;
          
          if (!currentCompleted) {
            nextCompleted = true;
            nextBy = spouseAName;
          } else if (currentBy === spouseAName) {
            nextCompleted = true;
            nextBy = spouseBName;
          } else {
            nextCompleted = false;
            nextBy = undefined;
          }
          
          return {
            ...task,
            completed: nextCompleted,
            completedBy: nextBy,
          };
        }
        return task;
      })
    );
  };

  const handleWeeklyAddTask = (category: string, name: string) => {
    const newTask: WeeklyTask = {
      id: `weekly_custom_${Date.now()}`,
      category,
      name,
      completed: false,
      isCustom: true,
    };
    setWeeklyTasks((prev) => [...prev, newTask]);
  };

  const handleWeeklyDeleteTask = (taskId: string) => {
    setWeeklyTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Section ➍ Monthly Routine handlers - Multiple selection supported
  const handleSelectMonthlyTask = (taskId: string) => {
    setMonthlyTasks((prev) =>
      prev.map((task) => ({
        ...task,
        isSelected: task.id === taskId ? !task.isSelected : task.isSelected, 
      }))
    );
  };

  const handleToggleMonthlyComplete = (taskId: string) => {
    setMonthlyTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const currentBy = task.completedBy;
          let nextCompleted = false;
          let nextBy: string | undefined = undefined;
          
          if (!task.completed) {
            nextCompleted = true;
            nextBy = spouseAName;
          } else if (currentBy === spouseAName) {
            nextCompleted = true;
            nextBy = spouseBName;
          } else {
            nextCompleted = false;
            nextBy = undefined;
          }
          
          return {
            ...task,
            completed: nextCompleted,
            completedBy: nextBy,
          };
        }
        return task;
      })
    );
  };

  // Relationship Quests - Cycles completedBy through [null, spouseAName, spouseBName, 'together']
  const handleToggleQuest = (questId: string) => {
    setRelationshipQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const currentBy = q.completedBy;
          let nextCompleted = false;
          let nextBy: string | undefined = undefined;
          
          if (!q.completed) {
            nextCompleted = true;
            nextBy = spouseAName;
          } else if (currentBy === spouseAName) {
            nextCompleted = true;
            nextBy = spouseBName;
          } else if (currentBy === spouseBName) {
            nextCompleted = true;
            nextBy = 'together';
          } else {
            nextCompleted = false;
            nextBy = undefined;
          }
          
          return {
            ...q,
            completed: nextCompleted,
            completedBy: nextBy,
          };
        }
        return q;
      })
    );
  };

  // EXECUTE ACTIONS FROM CUSTOM MODALS (Zero usage of native prompt blocks)
  const getWeeklySettleSummary = () => {
    // 1. Daily tasks
    let dailyPossible = dailyTasks.length * 7;
    let dailyCompleted = 0;
    dailyTasks.forEach(t => {
      Object.keys(t.checks).forEach(day => {
        if (t.checks[day]) {
          dailyCompleted++;
        }
      });
    });

    // 2. N-Times tasks
    let nTimesPossible = nTimesTasks.reduce((sum, t) => sum + t.targetCount, 0);
    let nTimesCompleted = nTimesTasks.reduce((sum, t) => sum + Math.min(t.completedCount, t.targetCount), 0);

    // 3. Weekly tasks
    let weeklyPossible = weeklyTasks.length;
    let weeklyCompleted = weeklyTasks.filter(t => t.completed).length;

    // 4. Monthly tasks (Only selected ones count towards current week's targets!)
    const activeSelectedMonthly = monthlyTasks.filter(t => t.isSelected);
    let monthlyPossible = activeSelectedMonthly.length;
    let monthlyCompleted = activeSelectedMonthly.filter(t => t.completed).length;

    let totalPossible = dailyPossible + nTimesPossible + weeklyPossible + monthlyPossible;
    let totalCompleted = dailyCompleted + nTimesCompleted + weeklyCompleted + monthlyCompleted;

    let completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    let bonusXp = 0;
    let gradeTitle = '노력형 신혼집';

    if (completionRate >= 90) {
      grade = 'S';
      bonusXp = 100;
      gradeTitle = '🏆 완벽한 신선함! 명품 살림단';
    } else if (completionRate >= 80) {
      grade = 'A';
      bonusXp = 50;
      gradeTitle = '✨ 화사하고 아늑한 반짝반짝 하우스';
    } else if (completionRate >= 70) {
      grade = 'B';
      bonusXp = 30;
      gradeTitle = '👍 깔끔하고 살기 좋은 다정한 하우스';
    } else if (completionRate >= 60) {
      grade = 'C';
      bonusXp = 10;
      gradeTitle = '🌱 시작이 반! 포근한 하우스';
    } else {
      grade = 'D';
      bonusXp = 0;
      gradeTitle = '🍃 환기가 필요한 내추럴 하우스';
    }

    // Calculate actual XP earned by chores this week
    let spouseAChoreXp = 0;
    let spouseBChoreXp = 0;

    // Daily checks parser
    dailyTasks.forEach(t => {
      Object.keys(t.checks).forEach(day => {
        const val = t.checks[day];
        if (val) {
          if (val === spouseAName) spouseAChoreXp += 10;
          else if (val === spouseBName) spouseBChoreXp += 10;
          else {
            spouseAChoreXp += 5;
            spouseBChoreXp += 5;
          }
        }
      });
    });

    // N-Times parser
    nTimesTasks.forEach(t => {
      if (t.completedBy) {
        t.completedBy.forEach(p => {
          if (p === spouseAName) spouseAChoreXp += 15;
          else if (p === spouseBName) spouseBChoreXp += 15;
        });
      } else {
        spouseAChoreXp += t.completedCount * 15;
      }
    });

    // Weekly parser
    weeklyTasks.forEach(t => {
      if (t.completed) {
        if (t.completedBy === spouseAName) spouseAChoreXp += 30;
        else if (t.completedBy === spouseBName) spouseBChoreXp += 30;
        else {
          spouseAChoreXp += 15;
          spouseBChoreXp += 15;
        }
      }
    });

    // Monthly parser
    monthlyTasks.forEach(t => {
      if (t.completed && t.isSelected) {
        if (t.completedBy === spouseAName) spouseAChoreXp += 50;
        else if (t.completedBy === spouseBName) spouseBChoreXp += 50;
        else {
          spouseAChoreXp += 25;
          spouseBChoreXp += 25;
        }
      }
    });

    // Relationship quests parser
    let sharedQuestXp = 0;
    relationshipQuests.forEach(q => {
      if (q.completed) {
        if (q.completedBy === spouseAName) {
          spouseAChoreXp += q.xp;
        } else if (q.completedBy === spouseBName) {
          spouseBChoreXp += q.xp;
        } else if (q.completedBy === 'together') {
          spouseAChoreXp += q.xp;
          spouseBChoreXp += q.xp;
          sharedQuestXp += q.xp;
        } else {
          spouseAChoreXp += q.xp / 2;
          spouseBChoreXp += q.xp / 2;
          sharedQuestXp += q.xp;
        }
      }
    });

    // Balanced team play check
    const hasCooperated = spouseAChoreXp > 0 && spouseBChoreXp > 0;
    const xpDifference = Math.abs(spouseAChoreXp - spouseBChoreXp);
    const maxChoreXP = Math.max(spouseAChoreXp, spouseBChoreXp, 1);
    const isHealthyBalance = hasCooperated && (xpDifference / maxChoreXP) <= 0.2;
    const synergyBonusXp = isHealthyBalance ? 50 : 0;

    const thisWeekChoresXpTotal = spouseAChoreXp + spouseBChoreXp + synergyBonusXp;

    return {
      dailyCompleted,
      dailyPossible,
      nTimesCompleted,
      nTimesPossible,
      weeklyCompleted,
      weeklyPossible,
      monthlyCompleted,
      monthlyPossible,
      totalCompleted,
      totalPossible,
      completionRate,
      grade,
      bonusXp,
      gradeTitle,
      spouseAChoreXp,
      spouseBChoreXp,
      sharedQuestXp,
      isHealthyBalance,
      synergyBonusXp,
      thisWeekChoresXpTotal
    };
  };

  const executeFullReset = () => {
    const range = getWeekDates(new Date());
    setWeekStart(range.start);
    setWeekEnd(range.end);
    setDailyTasks(INITIAL_DAILY_SUBMISSIONS);
    setNTimesTasks(INITIAL_N_TIMES_TASKS);
    setWeeklyTasks(INITIAL_WEEKLY_TASKS);
    setMonthlyTasks(INITIAL_MONTHLY_TASKS);
    setSpouseAName('지민');
    setSpouseBName('수현');
    setRelationshipQuests(INITIAL_RELATIONSHIP_QUESTS);
    setCumulativeHomeXp(0);
    setSpouseAOverallXp(0);
    setSpouseBOverallXp(0);
    setMemo('');
    setIsResetModalOpen(false);
  };

  const handleOpenSettlement = () => {
    const summary = getWeeklySettleSummary();
    setSettlementData(summary);
    setIsSettlementResultOpen(true);
  };

  const executeNextWeekStart = () => {
    const summary = getWeeklySettleSummary();
    
    // Add cumulative scores
    setCumulativeHomeXp((prev) => prev + summary.thisWeekChoresXpTotal + summary.bonusXp);
    setSpouseAOverallXp((prev) => prev + summary.spouseAChoreXp);
    setSpouseBOverallXp((prev) => prev + summary.spouseBChoreXp);

    const endObject = new Date(weekEnd);
    endObject.setDate(endObject.getDate() + 1); 
    const range = getWeekDates(endObject);
    setWeekStart(range.start);
    setWeekEnd(range.end);

    // Keep templates, only reset results
    setDailyTasks((prev) =>
      prev.map((task) => ({
        ...task,
        checks: { '월': false, '화': false, '수': false, '목': false, '금': false, '토': false, '일': false },
      }))
    );
    setNTimesTasks((prev) =>
      prev.map((task) => ({
        ...task,
        completedCount: 0,
        completedBy: task.targetCount ? new Array(task.targetCount).fill(null) : [],
      }))
    );
    setWeeklyTasks((prev) =>
      prev.map((task) => ({
        ...task,
        completed: false,
        completedBy: undefined,
      }))
    );
    setMonthlyTasks((prev) =>
      prev.map((task) => ({
        ...task,
        isSelected: false,
        completed: false,
        completedBy: undefined,
      }))
    );
    setRelationshipQuests((prev) =>
      prev.map((q) => ({
        ...q,
        completed: false,
        completedBy: undefined,
      }))
    );
    setMemo('');
    setIsNextWeekModalOpen(false);
    setIsSettlementResultOpen(false);
  };

  const handlePrint = () => {
    // Open a step-by-step helpful modal that clearly describes issues & how to print
    setIsPrintGuideOpen(true);
    
    // Attempt printing gracefully
    try {
      window.print();
    } catch (e) {
      console.warn("Print dialogue was blocked or failed within sandboxed preview environment.", e);
    }
  };

  const handleCopyShareLink = () => {
    try {
      const stateObj = {
        weekStart,
        weekEnd,
        dailyTasks,
        nTimesTasks,
        weeklyTasks,
        monthlyTasks,
        memo,
        spouseAName,
        spouseBName,
        relationshipQuests,
        cumulativeHomeXp,
        spouseAOverallXp,
        spouseBOverallXp,
      };
      const b64 = encodeStateToBase64(stateObj);
      const shareUrl = `${window.location.origin}${window.location.pathname}?state=${b64}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedState('share');
      setTimeout(() => setCopiedState('none'), 2500);
    } catch (e) {
      console.error("Failed to copy share link", e);
    }
  };

  const handleCopyDirectLink = () => {
    try {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      navigator.clipboard.writeText(cleanUrl);
      setCopiedState('direct');
      setTimeout(() => setCopiedState('none'), 2500);
    } catch (e) {
      console.error("Failed to copy direct link", e);
    }
  };

  const startMMDD = weekStart ? `${weekStart.substring(5, 7)}월 ${weekStart.substring(8, 10)}일` : '____';
  const endMMDD = weekEnd ? `${weekEnd.substring(5, 7)}월 ${weekEnd.substring(8, 10)}일` : '____';
  const activeYear = weekStart ? weekStart.substring(0, 4) : '2026';

  return (
    <div className="min-h-screen bg-slate-100 py-3 sm:py-6 px-2 sm:px-4 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Precise print CSS directly formatted for A4 Portrait paper sizes */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          /* Shrunk layout margins/paddings on print to guarantee 100% fitting on 1 A4 portrait page */
          .print-container {
            width: 210mm !important;
            height: 282mm !important;
            min-height: 282mm !important;
            max-height: 282mm !important;
            padding: 8mm 11mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
          }
          /* Pushes footer to the absolute bottom, creating a beautiful empty gap below memo */
          .print-container > :last-child {
            margin-top: auto !important;
            border-top: 1px solid #cbd5e1 !important;
          }
          /* Title section compression */
          .print-container .text-center {
            padding-bottom: 0.3rem !important;
            margin-bottom: 0.4rem !important;
          }
          .print-container h2 {
            font-size: 1.3rem !important;
          }
          .print-container .mt-2.5 {
            margin-top: 0.15rem !important;
            padding-top: 0.1rem !important;
            padding-bottom: 0.1rem !important;
          }
          /* Shrunk spacing globally across section components */
          .print-container .mb-6 {
            margin-bottom: 0.35rem !important;
          }
          .print-container .mb-2 {
            margin-bottom: 0.1rem !important;
          }
          /* Section headers tighter */
          .print-container h3 {
            font-size: 0.82rem !important;
            margin-bottom: 0.08rem !important;
          }
          .print-container h3 > span:first-child {
            width: 1.05rem !important;
            height: 1.05rem !important;
            font-size: 8.5px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .print-container h3 span:not(:first-child) {
            width: auto !important;
            height: auto !important;
            font-size: 10.5px !important;
            display: inline !important;
            white-space: nowrap !important;
          }
          /* StatsSummary compression */
          .print-container .border.rounded-lg.p-3\\.5 {
            padding: 3px 6px !important;
            margin-bottom: 1px !important;
          }
          .print-container .border.rounded-lg.p-3\\.5 h4 {
            font-size: 9.5px !important;
            margin-bottom: 1px !important;
            padding-bottom: 1px !important;
          }
          .print-container .grid {
            gap: 0.2rem !important;
          }
          /* Make table headers and cell paddings highly compact */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 2.5px 4.5px !important;
            color: #0f172a !important;
            font-size: 9.5px !important;
          }
          th {
            background-color: #f8fafc !important;
            padding: 2px 4px !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          /* Monthly rotation cards compression */
          .print-container .bg-slate-50 {
            padding: 3px 5px !important;
          }
          .print-container .bg-slate-50 .grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 3px !important;
          }
          .print-container .bg-slate-50 .border {
            padding: 2px 4.5px !important;
            font-size: 9px !important;
          }
          /* MemoSection size restriction */
          .print-container div[class*="min-h-[140px]"] {
            min-height: 55px !important;
            height: 55px !important;
            padding: 4px 8px !important;
          }
          .print-container div[class*="min-h-[140px]"] .space-y-4 {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          .print-container div[class*="min-h-[140px]"] .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.22rem !important;
          }
          .print-container div[class*="min-h-[140px]"] .h-6 {
            height: 0.55rem !important;
          }
          /* Footer compression */
          .print-container .mt-6 {
            margin-top: 0.25rem !important;
            padding-top: 0.25rem !important;
          }
          textarea, input, select, button {
            display: none !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>

      {/* Control center panel for real time tracking - Hidden automatically on paper printing */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-5 no-print bg-white rounded-xl p-3 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-indigo-100 text-indigo-700 font-bold rounded-md text-xs">최고 보송보송 인쇄 시트</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight">Iframe 및 모바일 완벽 대응 패치</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span>🧹</span> 집안일도 일이다! 메이커
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              냉장고 자석판에 걸어놓고 체크하기 딱 예쁜 주간 전용 디자인 포맷입니다. 온라인으로 클릭 관리하고 매주 재활용하거나 완벽한 A4 비율로 간편하게 인쇄해 보세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenSettlement}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 hover:scale-[1.02] transform cursor-pointer shadow-md shadow-indigo-100"
              title="이번 주 집안일 달성률을 정산하고 보너스 XP를 획득하여 우리 집 레벨을 높입니다."
              id="btn-weekly-settle"
            >
              <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-100 animate-pulse" />
              🏆 주간 살림 정산 (보너스 XP!)
            </button>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="모든 항목을 완전히 최초 설치 Preset 모습으로 돌리기"
              id="btn-full-reset"
            >
              <Trash2 className="w-3.5 h-3.5" />
              기본 프리셋 초기화
            </button>
          </div>
        </div>

        {/* Date Setter panel */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-bold text-slate-700">체크리스트 적용 주간:</span>
            <div className="ml-2 flex items-center gap-1">
              <input
                type="date"
                value={weekStart}
                onChange={(e) => handleDateChange(e.target.value, weekEnd)}
                className="px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              />
              <span className="text-slate-400">~</span>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => handleDateChange(weekStart, e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setRelativeWeek(-1)}
              className="px-2.5 py-1.5 border border-slate-300 hover:bg-white text-slate-600 rounded bg-white hover:border-slate-400 cursor-pointer"
            >
              이전 주
            </button>
            <button
              onClick={() => {
                const range = getWeekDates(new Date());
                setWeekStart(range.start);
                setWeekEnd(range.end);
              }}
              className="px-2.5 py-1.5 border border-slate-300 hover:bg-white text-slate-700 font-semibold rounded bg-slate-100/50 cursor-pointer"
            >
              오늘 주간
            </button>
            <button
              onClick={() => setRelativeWeek(1)}
              className="px-2.5 py-1.5 border border-slate-300 hover:bg-white text-slate-600 rounded bg-white hover:border-slate-400 cursor-pointer"
            >
              다음 주
            </button>
          </div>
        </div>

        {/* Newlyweds Character Names panel */}
        <div className="mt-3 p-3 bg-pink-50/20 rounded-lg border border-pink-100 flex flex-wrap items-center gap-4 text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-pink-700 flex items-center gap-1 shrink-0">
              <Heart className="w-4 h-4 fill-pink-500 text-pink-500 animate-pulse" /> 
              신혼부부 캐릭터 이름 설정:
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">🤵 배우자 A:</span>
                <input
                  type="text"
                  value={spouseAName}
                  onChange={(e) => setSpouseAName(e.target.value.trim() || '지민')}
                  placeholder="예: 지민"
                  className="px-2 py-1 border border-slate-300 rounded font-bold bg-white text-pink-600 w-16 focus:ring-1 focus:ring-pink-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">👰 배우자 B:</span>
                <input
                  type="text"
                  value={spouseBName}
                  onChange={(e) => setSpouseBName(e.target.value.trim() || '수현')}
                  placeholder="예: 수현"
                  className="px-2 py-1 border border-slate-300 rounded font-bold bg-white text-indigo-650 w-16 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            * 이름을 입력하면 프로필, 체크 선택자, 레벨 및 배분 스탯이 실시간으로 동기화됩니다.
          </span>
        </div>

        {/* Real-time Spouse Cloud Sync Panel */}
        <div className="mt-3 p-3 bg-indigo-50/30 rounded-lg border border-indigo-150/70 text-xs no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-extrabold text-indigo-700 flex items-center gap-1">
                <span>🌍</span> 실시간 부부 데이터 연동 (Cloud Sync):
                {houseCode ? (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded-sm text-[9px] border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    실시간 연결됨
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-sm text-[9px]">
                    로컬 기기 전용 (개별 작동)
                  </span>
                )}
              </span>
              <p className="text-[11px] text-slate-550 font-semibold leading-relaxed">
                {houseCode 
                  ? '배우자와 화면이 동기화되었습니다! 어느 한쪽이 체크하면 양쪽 폰에 실시간으로 즉시 반영됩니다.'
                  : '주소(초대 링크)를 복사해서 공유하거나, 연동 코드를 입력해 상대방의 기기와 데이터를 완벽하게 실시간 공유하세요.'
                }
              </p>
            </div>

            {/* Sync Controls */}
            <div className="shrink-0">
              {houseCode ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="p-1 px-2 border border-indigo-200/65 bg-indigo-50/55 text-indigo-800 font-mono font-extrabold text-xs rounded-md">
                    코드: <span className="tracking-wide text-indigo-700">{houseCode}</span>
                  </div>
                  
                  <button
                    onClick={handleCopySyncCode}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold hover:scale-[1.02] transform transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSyncCode ? '초대장 주소 복사함!' : '초대 링크 복사'}
                  </button>

                  <button
                    onClick={handleDisconnectSyncSession}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold cursor-pointer"
                  >
                    연동 해제
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCreateSyncSession}
                    disabled={syncStatus === 'syncing'}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {syncStatus === 'syncing' ? '연동 중...' : '🔗 새 연동코드 생성'}
                  </button>
                  
                  <div className="flex items-center gap-1 border border-slate-200 bg-white p-0.5 rounded-lg shadow-xs">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6자리 연동코드"
                      value={syncCodeInput}
                      onChange={(e) => setSyncCodeInput(e.target.value.replace(/\D/g, ''))}
                      className="px-1.5 py-1 bg-transparent w-24 text-center font-bold font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => handleJoinSyncSession(syncCodeInput)}
                      disabled={syncStatus === 'syncing' || syncCodeInput.length !== 6}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-md disabled:opacity-40 select-none cursor-pointer"
                    >
                      코드 연결
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sync status/errors info line */}
          {syncErrorMessage && (
            <div className="mt-1.5 text-[10px] text-rose-600 bg-rose-50 border border-rose-100 rounded p-1 px-1.5 font-bold animate-pulse">
              ⚠️ {syncErrorMessage}
            </div>
          )}
        </div>

        {/* Print Instruction guides */}
        <div className="mt-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
              <Printer className="w-4 h-4 stroke-[2.5]" />
              🖨️ 인쇄 & 보드판 출력 원리
            </span>
            <p className="text-xs text-emerald-800/80 leading-relaxed font-normal">
              - <strong>빈 체크리스트 인쇄</strong>: 보드마커 등으로 손글씨 채크 희망 시 사용합니다.<br/>
              - <strong>작성 내용 그대로 인쇄</strong>: 현재까지 화면에서 마킹한 상태 그대로 보송보송하게 출력합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">출력 포맷</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPrintModel('blank')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    printModel === 'blank'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  빈 양식 인쇄
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModel('checked')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    printModel === 'checked'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  체크된 양식 인쇄
                </button>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-transform hover:scale-[1.03] shadow-md flex items-center gap-2 self-end cursor-pointer"
              id="btn-print-action"
            >
              <Printer className="w-4 h-4" />
              지금 인쇄하기
            </button>
          </div>
        </div>


      </div>

      {/* Main A4 styled printable sheet container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-5 md:p-8 print-container relative overflow-hidden">
          
          {/* Style Line Top Accent - no-print */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 no-print" />

          {/* Heading Center Column */}
          <div className="text-center pb-5 mb-5 border-b-2 border-slate-300">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🧹</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">집안일도 일이다!</h2>
            </div>
            
            <div className="mt-2.5 inline-block bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full font-mono tracking-wider">
              주간: {activeYear}년 {startMMDD} ~ {endMMDD}
            </div>

            <p className="mt-2 text-[11px] text-slate-400 font-medium hidden print:block">
              * 매일 한 칸씩, 수성펜이나 보드마커로 자석판을 채워가며 소중한 생활 터전을 가꾸어보세요.
            </p>
          </div>

          {/* House RPG Interior Game Board */}
          <HouseInterior
            cumulativeHomeXp={cumulativeHomeXp + (getWeeklySettleSummary()?.thisWeekChoresXpTotal || 0)}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* Comprehensive Statistics bar */}
          <StatsSummary
            dailyTasks={dailyTasks}
            nTimesTasks={nTimesTasks}
            weeklyTasks={weeklyTasks}
            monthlyTasks={monthlyTasks}
            relationshipQuests={relationshipQuests}
            printModel={printModel}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* ➊ 매일 & 수시로 */}
          <DailyChecklist
            tasks={dailyTasks}
            onToggleCheck={handleToggleDailyCheck}
            onAddTask={handleDailyAddTask}
            onDeleteTask={handleDailyDeleteTask}
            printModel={printModel}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* ➋ 이번 주 N번 */}
          <NTimeChecklist
            tasks={nTimesTasks}
            onToggleCheck={handleToggleNTimesCheck}
            onAddTask={handleNTimesAddTask}
            onDeleteTask={handleNTimesDeleteTask}
            printModel={printModel}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* ➌ 주 1회 집중 */}
          <WeeklyChecklist
            tasks={weeklyTasks}
            onToggleCheck={handleToggleWeeklyCheck}
            onAddTask={handleWeeklyAddTask}
            onDeleteTask={handleWeeklyDeleteTask}
            printModel={printModel}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* ➍ 월 1회 로테이션 */}
          <MonthlyRotation
            tasks={monthlyTasks}
            onSelectTask={handleSelectMonthlyTask}
            onToggleComplete={handleToggleMonthlyComplete}
            printModel={printModel}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* 💖 부부 관계 퀘스트 */}
          <RelationshipQuestList
            quests={relationshipQuests}
            onToggleQuest={handleToggleQuest}
            spouseAName={spouseAName}
            spouseBName={spouseBName}
          />

          {/* 📝 메모란 */}
          <MemoSection
            memo={memo}
            onMemoChange={setMemo}
          />

          {/* Core watermark foot decoration */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span className="font-semibold">
              🧼 보송하고 산뜻한 기분, 우리 가족의 시작입니다. • <strong>집안일도 일이다!</strong>
            </span>
            <div className="flex items-center gap-1.5 font-mono text-slate-500">
              <span>기록 보존형 인쇄 시트</span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent floating signature bottom bar */}
      <div className="max-w-4xl mx-auto mt-6 no-print text-center text-xs text-slate-400 leading-relaxed font-normal p-4 bg-white/40 rounded-lg border border-slate-200/40">
        <p className="flex items-center justify-center gap-1">
          수정 가능한 집안 보드마커 프린트 전용 프레임워크 • 깔끔한 한글 폰트 및 펜 드로잉에 맞는 여백 설계
        </p>
      </div>

      {/* ----------------- MODALS (To bypass sandbox frame blockades) ----------------- */}

      {/* MODAL 1: Next Week Confirmation */}
      {isNextWeekModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">새로운 다음 주차 시작</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  현재 등록해 두신 <strong>청소 항목 템플릿(커스텀 청소 항목들 등)은 안전하게 그대로 유지</strong>됩니다.<br />
                  다만, 이번 주에 마킹해 두셨던 모든 체크 기록과 메모가 공백으로 청정 초기화됩니다. 다음 주 청소를 기록할까요?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNextWeekModalOpen(false)}
                className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                아니오, 취소할게요
              </button>
              <button
                onClick={executeNextWeekStart}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                id="modal-confirm-next-week"
              >
                네, 다음 주로 가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Preset Confirmation */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">기본 프리셋으로 초기화</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  주의! 이 작업을 완료하시면 기존에 추가해 두었던 <strong>모든 사용자 지정 청소 항목들이 삭제</strong>되며, 처음 제공된 기본 A4 세로 규격 청소 체크리스트로 완전히 복원됩니다.<br />
                  정말로 완벽하게 초기 리셋을 진행하시겠습니까?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={executeFullReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                id="modal-confirm-reset"
              >
                네, 확실히 초기화합니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Weekly Season Settlement Result Modal */}
      {isSettlementResultOpen && settlementData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 relative overflow-hidden my-8">
            
            {/* Playful background highlight pattern */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-550" />
            
            <div className="text-center space-y-2 mt-2">
              <span className="text-4xl">🎉</span>
              <h3 className="text-lg font-black text-slate-800">이번 주 우리 집 살림 정산 결과</h3>
              <p className="text-xs text-slate-400">
                수고하셨습니다! {weekStart} ~ {weekEnd} 동안 함께 일군 땀방울입니다.
              </p>
            </div>

            {/* Huge Season Grade Circle */}
            <div className="my-5 flex flex-col items-center justify-center">
              <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg border-2 ${
                settlementData.grade === 'S' ? 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300 border-amber-300 ring-4 ring-amber-100' :
                settlementData.grade === 'A' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 ring-4 ring-indigo-100' :
                settlementData.grade === 'B' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 ring-4 ring-emerald-100' :
                settlementData.grade === 'C' ? 'bg-gradient-to-br from-indigo-400 to-blue-500 border-indigo-300 ring-4 ring-indigo-50' :
                'bg-gradient-to-br from-slate-400 to-slate-500 border-slate-300'
              } text-white transform hover:scale-105 transition-transform duration-300`}>
                <span className="text-xs font-black tracking-widest leading-none drop-shadow-xs">시즌 등급</span>
                <span className="text-4xl font-black font-serif leading-none mt-1 drop-shadow-md">
                  {settlementData.grade}
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-800 mt-2.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {settlementData.gradeTitle}
              </p>
            </div>

            {/* Achievement Rates Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 font-bold mb-1">
                <span className="text-slate-700 font-extrabold">집안일 완료 요약</span>
                <span className="text-indigo-650 font-mono text-sm font-black">{settlementData.completionRate}% 달성</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-medium text-slate-650">
                <div className="flex justify-between">
                  <span>📅 매일 루틴:</span>
                  <span className="font-semibold text-slate-800 font-mono">{settlementData.dailyCompleted} / {settlementData.dailyPossible}회</span>
                </div>
                <div className="flex justify-between">
                  <span>🔢 수시 루틴 (주 N회):</span>
                  <span className="font-semibold text-slate-800 font-mono">{settlementData.nTimesCompleted} / {settlementData.nTimesPossible}회</span>
                </div>
                <div className="flex justify-between">
                  <span>🧼 이번 주 집중 루틴:</span>
                  <span className="font-semibold text-slate-800 font-mono">{settlementData.weeklyCompleted} / {settlementData.weeklyPossible}건</span>
                </div>
                <div className="flex justify-between">
                  <span>🔄 월간 지정 루틴:</span>
                  <span className="font-semibold text-slate-800 font-mono">{settlementData.monthlyCompleted} / {settlementData.monthlyPossible}건</span>
                </div>
              </div>
            </div>

            {/* XP Rewards list */}
            <div className="mt-4 border border-indigo-100 bg-indigo-50/20 rounded-xl p-3.5 text-xs">
              <p className="font-black text-indigo-900 border-b border-indigo-150/40 pb-1.5 mb-2">🎁 보상 및 기여한 경험치 (XP)</p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">🤵 {spouseAName}의 가사 기여 XP:</span>
                  <span className="font-bold text-slate-800">+{settlementData.spouseAChoreXp} XP</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">👰 {spouseBName}의 가사 기여 XP:</span>
                  <span className="font-bold text-slate-800">+{settlementData.spouseBChoreXp} XP</span>
                </div>
                {settlementData.sharedQuestXp > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span className="flex items-center gap-1 font-bold">💖 함께한 미션 보너스 XP:</span>
                    <span className="font-bold">+{settlementData.sharedQuestXp} XP</span>
                  </div>
                )}
                {settlementData.synergyBonusXp > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span className="flex items-center gap-1">💝 부부 배려 시너지 보너스 XP:</span>
                    <span className="font-bold">+{settlementData.synergyBonusXp} XP</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-600 font-bold border-t border-dashed border-slate-300 pt-1.5">
                  <span className="flex items-center gap-1">✨ 주간 시즌 보너스 XP:</span>
                  <span className="font-black">+{settlementData.bonusXp} XP</span>
                </div>
                
                <div className="flex justify-between text-indigo-700 font-black pt-1.5 text-sm border-t border-indigo-100/80">
                  <span>총 합산 획득 경험치:</span>
                  <span>+{settlementData.thisWeekChoresXpTotal + settlementData.bonusXp} XP</span>
                </div>
              </div>
            </div>

            {/* Overall Growth Preview */}
            <div className="mt-4 bg-slate-900 text-white rounded-xl p-3 text-[10px] leading-relaxed">
              <div className="flex justify-between mb-1 text-slate-300 font-bold">
                <span>체크리스트 우리 집 RPG 누적 XP</span>
                <span>{cumulativeHomeXp} ➡️ {cumulativeHomeXp + settlementData.thisWeekChoresXpTotal + settlementData.bonusXp} XP</span>
              </div>
              <p className="font-medium text-pink-300">
                * 이 버튼을 누르시면 이번 주 살림 완료상황이 안전하게 초기화되고 다음 주차로 이동하며, 가구 꾸미기 아이템 등 누적 레벨업이 확정됩니다.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="mt-5 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsSettlementResultOpen(false)}
                className="px-4 py-2 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >
                닫기 / 계속 쓸래요
              </button>
              <button
                type="button"
                onClick={executeNextWeekStart}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
                id="modal-confirm-settlement"
              >
                <span>정산 완료하고 다음 주 시작! 🚀</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Print Guide Helper */}
      {isPrintGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 relative overflow-hidden">
            <button 
              onClick={() => setIsPrintGuideOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full shrink-0">
                <Printer className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-indigo-900 font-extrabold text-base flex items-center gap-2">
                  <span>🖨️</span> 인쇄 창이 정상적으로 열리셨나요?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  현재 보시는 브라우저 인라인 환경이나 미리보기창(Iframe) 규정상 인쇄 대화상자 차단이 일어난 경우 아래의 가이드를 참조하시면 100% 깔끔하게 출력이 보장됩니다!
                </p>
              </div>
            </div>

            {/* Print Troubleshooting guides */}
            <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3.5 text-xs text-slate-700">
              <div className="space-y-1">
                <p className="font-bold text-slate-900">1. 새 탭 / 새 창으로 열어서 인쇄하기 (가장 추천! ⭐)</p>
                <p className="text-slate-500 leading-relaxed font-normal">
                  우측 상단 <strong>[새 탭에서 열기 (Open in new tab)]</strong> 버튼을 클릭하여 본 웹페이지를 단독으로 띄운 시점에서 [인쇄하기] 버튼을 누르시면, 크롬 등 브라우저 인쇄가 매우 안정적으로 100% 정상 작동합니다.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-900">2. 프린터 인쇄 설정 팁 (보송보송 A4 용지용)</p>
                <ul className="list-disc pl-4 text-slate-550 space-y-1 leading-relaxed font-normal">
                  <li><strong>가로/세로 방향</strong>: 반드시 '세로 방향 (Portrait)'으로 지정해 주세요.</li>
                  <li><strong>배경 그래픽 및 색상 인쇄</strong>: 체크박스 색상과 회색 테이블 헤더 색이 이쁘게 인쇄되도록 <span className="font-bold border-b border-indigo-400">인쇄 세부정보 {`>`} "배경 그래픽" 옵션을 꼭 체크</span>해 주세요.</li>
                  <li><strong>여백(Margins) 설정</strong>: 여백을 '없음'으로 선택하시거나, 크롬 브라우저 기본값으로 맞춰두시면 A4 용지에 맞게 딱 가득 찹니다.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <span>새 창으로 다시 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setIsPrintGuideOpen(false)}
                className="px-4.5 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                안내창 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

