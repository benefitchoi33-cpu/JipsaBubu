import React from 'react';
import { DailyTask, NTimesTask, WeeklyTask, RelationshipQuest, MonthlyRotationItem } from '../types';
import { Trophy, CheckCircle2, TrendingUp, Heart } from 'lucide-react';

interface StatsSummaryProps {
  dailyTasks: DailyTask[];
  nTimesTasks: NTimesTask[];
  weeklyTasks: WeeklyTask[];
  monthlyTasks?: MonthlyRotationItem[];
  relationshipQuests?: RelationshipQuest[];
  printModel: 'blank' | 'checked';
  spouseAName?: string;
  spouseBName?: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  dailyTasks,
  nTimesTasks,
  weeklyTasks,
  monthlyTasks = [],
  relationshipQuests = [],
  printModel,
  spouseAName = '지민',
  spouseBName = '수현',
}) => {
  // Calculate completion indicators
  let checkedDailyCount = 0;
  dailyTasks.forEach((task) => {
    Object.values(task.checks).forEach((val) => {
      if (val) checkedDailyCount++;
    });
  });
  const totalDailyPossibleCount = dailyTasks.length * 7;

  // N-Times calculation
  let nTimesCompletedCount = 0;
  nTimesTasks.forEach((task) => {
    nTimesCompletedCount += task.completedBy ? task.completedBy.filter(Boolean).length : task.completedCount;
  });
  const nTimesTargetCountSum = nTimesTasks.reduce((sum, t) => sum + t.targetCount, 0);

  // Weekly tasks completed
  const completedWeeklyCount = weeklyTasks.filter((t) => t.completed).length;
  const totalWeeklyPossible = weeklyTasks.length;

  const totalWeeklyNPossible = nTimesTargetCountSum + totalWeeklyPossible;
  const completedWeeklyNCount = nTimesCompletedCount + completedWeeklyCount;

  // Percentage Calculations
  const dailyPercentage = totalDailyPossibleCount > 0 ? Math.round((checkedDailyCount / totalDailyPossibleCount) * 100) : 0;
  const weeklyPercentage = totalWeeklyNPossible > 0 ? Math.round((completedWeeklyNCount / totalWeeklyNPossible) * 100) : 0;
  const overallPercentage = Math.round((dailyPercentage + weeklyPercentage) / 2);

  // Dynamic Chores and Quest XP calculation
  let xpA = 0;
  let xpB = 0;

  // 1. Daily Chores: 10 XP per check
  dailyTasks.forEach(task => {
    Object.values(task.checks).forEach(val => {
      if (val === spouseAName) xpA += 10;
      else if (val === spouseBName) xpB += 10;
      else if (val) {
        // If checked without name or legacy
        xpA += 5;
        xpB += 5;
      }
    });
  });

  // 2. N-Times Chores: 15 XP per check
  nTimesTasks.forEach(task => {
    if (task.completedBy) {
      task.completedBy.forEach(val => {
        if (val === spouseAName) xpA += 15;
        else if (val === spouseBName) xpB += 15;
      });
    } else {
      xpA += task.completedCount * 15;
    }
  });

  // 3. Weekly Chores: 30 XP
  weeklyTasks.forEach(task => {
    if (task.completed) {
      if (task.completedBy === spouseAName) xpA += 30;
      else if (task.completedBy === spouseBName) xpB += 30;
      else {
        xpA += 15;
        xpB += 15;
      }
    }
  });

  // 4. Monthly Chores: 50 XP
  monthlyTasks.forEach(task => {
    if (task.completed) {
      if (task.completedBy === spouseAName) xpA += 50;
      else if (task.completedBy === spouseBName) xpB += 50;
      else {
        xpA += 25;
        xpB += 25;
      }
    }
  });

  // 5. Relationship Quests: 30-50 XP
  relationshipQuests.forEach(quest => {
    if (quest.completed) {
      if (quest.completedBy === spouseAName) xpA += quest.xp;
      else if (quest.completedBy === spouseBName) xpB += quest.xp;
      else if (quest.completedBy === 'together') {
        xpA += quest.xp;
        xpB += quest.xp;
      } else {
        xpA += quest.xp / 2;
        xpB += quest.xp / 2;
      }
    }
  });

  // Calculate cleanliness level by house area
  const areaStats = {
    kitchen: { name: '주방', icon: '🍳', possible: 0, completed: 0 },
    bathroom: { name: '욕실/화장실', icon: '🧼', possible: 0, completed: 0 },
    bedroom: { name: '침실', icon: '🛏️', possible: 0, completed: 0 },
    livingRoom: { name: '거실/바닥', icon: '🛋️', possible: 0, completed: 0 },
    others: { name: '세탁/기타', icon: '🧺', possible: 0, completed: 0 },
  };

  const getAreaKey = (taskName: string, category?: string): keyof typeof areaStats => {
    const combined = `${taskName} ${category || ''}`.replace(/\s+/g, '');
    if (
      combined.includes('설거지') ||
      combined.includes('싱크대') ||
      combined.includes('가스레인지') ||
      combined.includes('인덕션') ||
      combined.includes('음식물') ||
      combined.includes('주방') ||
      combined.includes('냉장고')
    ) {
      return 'kitchen';
    }
    if (
      combined.includes('욕실') ||
      combined.includes('화장실') ||
      combined.includes('스퀴지') ||
      combined.includes('변기') ||
      combined.includes('세면대') ||
      combined.includes('수전') ||
      combined.includes('배수구')
    ) {
      return 'bathroom';
    }
    if (
      combined.includes('이불') ||
      combined.includes('침실') ||
      combined.includes('침구') ||
      combined.includes('베개')
    ) {
      return 'bedroom';
    }
    if (
      combined.includes('바닥') ||
      combined.includes('청소기') ||
      combined.includes('물걸레') ||
      combined.includes('가구') ||
      combined.includes('선반') ||
      combined.includes('먼지') ||
      combined.includes('거실')
    ) {
      return 'livingRoom';
    }
    return 'others';
  };

  // 1. Process dailyTasks (possible: 7 checks per task)
  dailyTasks.forEach((task) => {
    const key = getAreaKey(task.name);
    areaStats[key].possible += 7;
    Object.values(task.checks).forEach((checked) => {
      if (checked) {
        areaStats[key].completed += 1;
      }
    });
  });

  // 2. Process nTimesTasks (possible: targetCount)
  nTimesTasks.forEach((task) => {
    const key = getAreaKey(task.name);
    areaStats[key].possible += task.targetCount;
    const completedCount = task.completedBy 
      ? task.completedBy.filter(Boolean).length 
      : task.completedCount;
    areaStats[key].completed += Math.min(completedCount, task.targetCount);
  });

  // 3. Process weeklyTasks (possible: 1)
  weeklyTasks.forEach((task) => {
    const key = getAreaKey(task.name, task.category);
    areaStats[key].possible += 1;
    if (task.completed) {
      areaStats[key].completed += 1;
    }
  });

  // 4. Process monthlyTasks (possible: 1)
  monthlyTasks.forEach((task) => {
    const key = getAreaKey(task.name, task.category);
    areaStats[key].possible += 1;
    if (task.completed) {
      areaStats[key].completed += 1;
    }
  });

  const areasList = Object.values(areaStats).map((area) => {
    const percent = area.possible > 0 ? Math.round((area.completed / area.possible) * 100) : 100;
    return { ...area, percent };
  });

  // Balanced team play check
  const hasCooperated = xpA > 0 && xpB > 0;
  const xpDifference = Math.abs(xpA - xpB);
  const maxXP = Math.max(xpA, xpB, 1);
  const isHealthyBalance = hasCooperated && (xpDifference / maxXP) <= 0.2;

  // Motivational Message
  const getMotivationalMsg = () => {
    if (overallPercentage === 100) return '🎉 완벽합니다! 이번 주 청소를 100% 완료하셨습니다. 완벽하게 관리된 우리 집!';
    if (overallPercentage >= 80) return '✨ 훌륭해요! 거의 다 끝났습니다. 집안이 무척 보송보송하고 쾌적해졌어요!';
    if (overallPercentage >= 50) return '👍 잘하고 있어요! 절반 이상 달성하셨네요. 조금만 더 힘을 내서 마무리해봅시다!';
    if (overallPercentage > 0) return '🌱 청소를 시작하셨군요! 한 칸 한 칸 채워갈 때마다 기분도 맑아집니다.';
    return '📅 이번 주 새로운 마음으로 가벼운 환기부터 시작해볼까요?';
  };

  return (
    <div className="w-full mb-6">
      {/* 🔮 INTERACTIVE SCREEN SCOREBOARD - Hidden on print */}
      <div className="no-print space-y-4">
        
        {/* Mobile-Friendly compact row layout (Visible only on mobile) */}
        <div className="block md:hidden bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">주간 살림 기여도</span>
            {isHealthyBalance ? (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5 animate-pulse">
                💝 시너지 활성 (+50 XP)
              </span>
            ) : (
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                ⚖️ 밸런스 협동 중
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2.5">
            {/* Spouse A */}
            <div className="flex-1 bg-white border border-pink-100/70 p-2.5 rounded-xl flex items-center justify-between shadow-3xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm select-none">🤵</span>
                <span className="text-xs font-extrabold text-slate-700 truncate">{spouseAName}</span>
              </div>
              <span className="text-xs font-black text-pink-600 font-mono">+{xpA} <span className="text-[9px] text-pink-450 font-bold">XP</span></span>
            </div>

            {/* Vs / Heart */}
            <div className="shrink-0 flex items-center justify-center">
              <span className="text-sm">💖</span>
            </div>

            {/* Spouse B */}
            <div className="flex-1 bg-white border border-indigo-100/70 p-2.5 rounded-xl flex items-center justify-between shadow-3xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm select-none">👰</span>
                <span className="text-xs font-extrabold text-slate-700 truncate">{spouseBName}</span>
              </div>
              <span className="text-xs font-black text-indigo-600 font-mono">+{xpB} <span className="text-[9px] text-indigo-450 font-bold">XP</span></span>
            </div>
          </div>
          
          <div className="text-[10.5px] text-center text-slate-500 font-bold">
            주간 총합 시너지: <strong className="text-amber-600 font-extrabold">+{xpA + xpB + (isHealthyBalance ? 50 : 0)} XP</strong>
          </div>
        </div>

        {/* Weekly Battle/Coop indicators (Hidden on mobile, visible on tablet/desktop) */}
        <div className="hidden md:grid grid-cols-3 gap-3">
          {/* Spouse A Profile card */}
          <div className="bg-pink-50/40 p-3 rounded-lg border border-pink-100/50 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-700 bg-pink-100/60 px-2 py-0.5 rounded-md">
                🤵 캐릭터 S1
              </span>
              <span className="text-[10px] text-pink-400 font-bold">ACTIVE HERO</span>
            </div>
            <div className="mt-2.5">
              <p className="text-md font-black text-slate-800 flex items-center gap-1.5">
                <span className="text-xl">🌸</span> {spouseAName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">이번 주 기여 찌릿찌릿!</p>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between border-t border-pink-100/40 pt-2">
              <span className="text-xs text-slate-400 font-semibold">이번 주 획득 XP</span>
              <span className="text-lg font-black text-pink-600 font-mono">+{xpA} <span className="text-xs font-bold text-pink-400">XP</span></span>
            </div>
          </div>

          {/* Newlyweds Coop Trophy / Synergy Meter */}
          <div className="bg-amber-50/30 p-3 rounded-lg border border-amber-100/60 flex flex-col justify-between relative">
            <div className="absolute -top-1.5 -right-1.5 opacity-10">
              <Trophy className="w-16 h-16 text-amber-500 transform rotate-12" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Trophy className="w-3 h-3" /> 부부 시너지 보너스
              </span>
              <span className="text-[10px] text-amber-500 font-bold">CO-OP STATUS</span>
            </div>
            <div className="mt-2 text-center">
              {isHealthyBalance ? (
                <div className="text-center">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full inline-block mb-1">
                    💝 한 명도 지치지 않는 주간 (점수차 {Math.round((xpDifference / maxXP) * 100)}%)
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold">가사 배려 시너지 활성화 중!</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full inline-block mb-1">
                    ⚔️ 밸런스 협동 중 (차이: {xpA === 0 && xpB === 0 ? 0 : xpDifference} XP)
                  </span>
                  <p className="text-[10px] text-slate-400 font-normal">한 명만 독박 살림하지 않게 서로 도와주세요!</p>
                </div>
              )}
            </div>
            <div className="mt-3.5 flex items-baseline justify-between border-t border-amber-100/40 pt-2">
              <span className="text-xs text-slate-400 font-bold">주간 총합 시너지</span>
              <div className="text-right">
                <span className="text-lg font-black text-amber-600 font-mono">+{xpA + xpB + (isHealthyBalance ? 50 : 0)} <span className="text-xs font-bold text-amber-400">XP</span></span>
                {isHealthyBalance && (
                  <p className="text-[9px] text-emerald-600 font-bold mt-0.5 animate-pulse">배려 보너스 +50 XP 포함 💝</p>
                )}
              </div>
            </div>
          </div>

          {/* Spouse B Profile card */}
          <div className="bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/50 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                👰 캐릭터 S2
              </span>
              <span className="text-[10px] text-indigo-400 font-bold">ACTIVE HERO</span>
            </div>
            <div className="mt-2.5">
              <p className="text-md font-black text-slate-800 flex items-center gap-1.5">
                <span className="text-xl">🪐</span> {spouseBName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">이번 주 활약 맑음 보송!</p>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between border-t border-indigo-100/40 pt-2">
              <span className="text-xs text-slate-400 font-semibold">이번 주 획득 XP</span>
              <span className="text-lg font-black text-indigo-655 font-mono">+{xpB} <span className="text-xs font-bold text-indigo-400">XP</span></span>
            </div>
          </div>
        </div>

        {/* Real-time Task Completion Progress Bars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="space-y-1.5 col-span-1">
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>매일 루틴</span>
              </span>
              <span className="font-mono text-slate-800 font-bold">{checkedDailyCount}/{totalDailyPossibleCount} ({dailyPercentage}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${dailyPercentage}%` }} />
            </div>
          </div>

          <div className="space-y-1.5 col-span-1">
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1 flex-wrap">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>주 N회 & 대청소</span>
              </span>
              <span className="font-mono text-slate-800 font-bold">{completedWeeklyNCount}/{totalWeeklyNPossible} ({weeklyPercentage}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${weeklyPercentage}%` }} />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <div className="flex justify-between items-center text-xs text-slate-500 font-black">
              <span>🛡️ 이번 주 종합 청정</span>
              <span className="text-indigo-600">{overallPercentage}% 완료</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-indigo-600 transition-all duration-500" style={{ width: `${overallPercentage}%` }} />
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 flex items-center justify-center pt-2 lg:pt-0">
            <p className="w-full text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-150 font-medium leading-tight text-center lg:text-left">
              {getMotivationalMsg()}
            </p>
          </div>
        </div>

        {/* Real-time Cleanliness Index by House Area */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-3">
            <span>🧼</span> 집의 부위별 청정 지수 (Area Cleanliness Index)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {areasList.map((area) => (
              <div key={area.name} className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-3xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    <span className="text-sm select-none">{area.icon}</span>
                    <span>{area.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    {area.completed}/{area.possible}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[9px] text-slate-400 font-bold">청정률</span>
                    <span className={`text-xs font-black font-mono ${
                      area.percent >= 90 ? 'text-indigo-600' :
                      area.percent >= 60 ? 'text-emerald-600' :
                      area.percent >= 30 ? 'text-amber-600' :
                      'text-rose-500'
                    }`}>{area.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        area.percent >= 90 ? 'bg-indigo-500' :
                        area.percent >= 60 ? 'bg-emerald-500' :
                        area.percent >= 30 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${area.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 🖨️ FOR PRINT DESIGN - ONLY visible on print */}
      <div className="hidden print:block border border-slate-200 rounded-lg p-3 bg-white space-y-1.5">
        <h4 className="text-[10px] font-extrabold text-slate-800 border-b border-slate-200 pb-1">
          📊 이번 주 청소 완료 통계 (A4 인쇄용 집계)
        </h4>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">수시 항목:</span>
            <span className="font-bold border-b border-slate-400 px-3 py-0.5">
              {printModel === 'checked' ? checkedDailyCount : '_______'} / {totalDailyPossibleCount} 개 완료
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">주간/목표 항목:</span>
            <span className="font-bold border-b border-slate-400 px-3 py-0.5">
              {printModel === 'checked' ? completedWeeklyNCount : '_______'} / {totalWeeklyNPossible} 개 완료
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
