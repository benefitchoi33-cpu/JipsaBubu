import React, { useState } from 'react';
import { Sparkles, Lock, Trophy, Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface HouseInteriorProps {
  cumulativeHomeXp: number;
  spouseAName: string;
  spouseBName: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  icon: string;
  description: string;
}

export const LEVEL_STEPS: LevelInfo[] = [
  { level: 1, title: '신혼 입주민', minXp: 0, maxXp: 100, icon: '🏠', description: '텅 빈 신혼집에서 상자를 풀며 살림을 시작합니다.' },
  { level: 2, title: '정리왕 부부', minXp: 100, maxXp: 250, icon: '🌿', description: '방구석에 싱그러운 반려식물과 커플 액자가 늘어납니다.' },
  { level: 3, title: '살림 전문가', minXp: 250, maxXp: 450, icon: '🛋️', description: '포근한 패브릭 소파와 보송한 노르딕 러그로 거실이 아늑해집니다.' },
  { level: 4, title: '홈스타일리스트', minXp: 450, maxXp: 700, icon: '💡', description: '북유럽 감성의 무드등과 대형 TV가 우리 집을 스타일링합니다.' },
  { level: 5, title: '집안일 타이쿤', minXp: 700, maxXp: 999999, icon: '👑', description: '귀여운 강아지, 고양이와 함께 행복이 뚝뚝 떨어지는 명품 하우스!' },
];

export function getLevelInfo(xp: number): LevelInfo {
  const levelStage = LEVEL_STEPS.find((step) => xp >= step.minXp && xp < step.maxXp);
  if (levelStage) return levelStage;
  return LEVEL_STEPS[LEVEL_STEPS.length - 1]; // Fallback to max level
}

interface DecorItem {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  positionClass: string; // Tailwinds positional rules for living room container
  desc: string;
}

const DECOR_COLLECTION: DecorItem[] = [
  { id: 'box', name: '이삿짐 상자', emoji: '📦', unlockLevel: 1, positionClass: 'bottom-4 left-6', desc: '초기 기본 아이템' },
  { id: 'couple_photo', name: '커플 미니 액자', emoji: '🖼️', unlockLevel: 2, positionClass: 'bottom-28 left-44 scale-110', desc: '배우자와 함께한 미니 액자' },
  { id: 'monstera', name: '싱그러운 몬스테라', emoji: '🌿', unlockLevel: 2, positionClass: 'bottom-4 right-6 scale-110', desc: '초록 피톤치드가 나오는 화분' },
  { id: 'rug', name: '보송보송 러그', emoji: '🧺', unlockLevel: 3, positionClass: 'bottom-2 left-[30%] right-[30%] mx-auto scale-125 z-0', desc: '바닥을 화사하게 가꿔줄 매트' },
  { id: 'sofa', name: '패브릭 소파', emoji: '🛋️', unlockLevel: 3, positionClass: 'bottom-8 left-[33%] right-[33%] mx-auto scale-125 z-10', desc: '지친 집안일을 마친 후 휴식처' },
  { id: 'lamp', name: '북유럽 감성 조명', emoji: '💡', unlockLevel: 4, positionClass: 'bottom-24 left-10 scale-125', desc: '은은한 에디슨 전구식 무드등' },
  { id: 'palm', name: '아레카야자 식물', emoji: '🪴', unlockLevel: 4, positionClass: 'bottom-16 right-16 scale-125', desc: '공기정화에 최고인 명품 야자수' },
  { id: 'tv', name: '디자인 거실 TV', emoji: '📺', unlockLevel: 4, positionClass: 'bottom-28 right-40 scale-[1.3] z-20', desc: '넷플릭스 정주행이 가능한 거실 TV' },
  { id: 'coffee', name: '에스프레소 머신', emoji: '☕', unlockLevel: 5, positionClass: 'bottom-12 left-52 scale-110 z-10', desc: '풍부한 크레마의 홈카페 메이커' },
  { id: 'kitten', name: '아기 고양이 삼색이', emoji: '🐱', unlockLevel: 5, positionClass: 'bottom-3 right-[24%] scale-110 z-20 animate-bounce', desc: '애교만점 우리집 귀염둥이 막내' },
  { id: 'dog', name: '리트리버 댕댕이', emoji: '🐶', unlockLevel: 5, positionClass: 'bottom-2 left-[24%] scale-110 z-20', desc: '꼬리를 흔들며 반기는 반려견' },
  { id: 'piano', name: '에스프레소 피아노', emoji: '🎹', unlockLevel: 5, positionClass: 'bottom-20 left-[43%] right-[43%] scale-110 z-0', desc: '연주가 흘러넘치는 로맨틱 피아노' },
];

export const HouseInterior: React.FC<HouseInteriorProps> = ({
  cumulativeHomeXp,
  spouseAName,
  spouseBName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentLevelInfo = getLevelInfo(cumulativeHomeXp);
  const nextLevelInfo = LEVEL_STEPS[currentLevelInfo.level] || null;

  // Calculate percentage of Level Progress
  let progressPercentage = 100;
  if (nextLevelInfo) {
    const range = nextLevelInfo.minXp - currentLevelInfo.minXp;
    const progress = cumulativeHomeXp - currentLevelInfo.minXp;
    progressPercentage = Math.min(Math.max(Math.round((progress / range) * 100), 0), 100);
  }

  const unlockedCount = DECOR_COLLECTION.filter(item => currentLevelInfo.level >= item.unlockLevel).length;

  return (
    <div className="w-full mb-4 no-print bg-gradient-to-r from-indigo-50/40 to-pink-50/20 rounded-xl border border-indigo-100 p-2.5 sm:p-3 shadow-xs" id="house-interior-module">
      
      {/* 1. Collapsed Row Layout (Simplified View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="text-xl shrink-0 select-none">{currentLevelInfo.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-rose-600 bg-rose-50/85 border border-rose-100 rounded px-1 text-[10px]">
                LEVEL {currentLevelInfo.level}
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                우리 집: <span className="text-indigo-650">{currentLevelInfo.title}</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
                ({spouseAName}🤵 ♥ 👰{spouseBName})
              </span>
            </div>
            
            {/* Ultra Simple progress subtext info */}
            <p className="text-[10px] text-slate-500 font-medium">
              누적 성장: <strong className="text-slate-700 font-mono">{cumulativeHomeXp} XP</strong> 
              {nextLevelInfo ? (
                <> (다음 레벨까지 <strong className="text-slate-600 font-mono">{nextLevelInfo.minXp - cumulativeHomeXp} XP</strong> 필요)</>
              ) : (
                <span className="text-amber-600 font-bold ml-1">🎉 만렙 달성!</span>
              )}
            </p>
          </div>
        </div>

        {/* Compact Level bar & Collapse Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex-1 sm:w-40 md:w-56 flex items-center gap-2">
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-700" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-600 font-mono font-bold shrink-0">{progressPercentage}%</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>🏡 거실 꾸미기 {isExpanded ? '접기' : '열기'}</span>
            <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">{unlockedCount}종 해금</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded RPG Room & Collection (Original Detail View - Collapsible) */}
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 pt-3 border-t border-indigo-100 animate-fadeIn">
          
          {/* Cozy living room visual room - 7 Cols */}
          <div className="lg:col-span-7 bg-indigo-950 rounded-xl p-4 border border-indigo-900 shadow-inner relative overflow-hidden h-[200px] flex flex-col justify-between">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-900/60 to-transparent pointer-events-none" />
            
            {/* Wall Grid and floor */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-amber-800/80 border-t border-amber-900/45 z-0">
              <div className="w-full h-full opacity-10 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:28px_100%]" />
            </div>

            {/* Core Info Overlay */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700 max-w-[170px]">
                <p className="text-[10.5px] font-black text-white">{currentLevelInfo.title}</p>
                <p className="text-[8px] text-slate-400 mt-0.5 font-bold">
                  {spouseAName}🤵 ♥ 👰{spouseBName}
                </p>
              </div>

              <div className="bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-800">
                <span className="text-[8px] text-slate-450 font-bold block leading-none">누적 XP</span>
                <span className="text-xs font-black text-white font-mono">{cumulativeHomeXp} XP</span>
              </div>
            </div>

            {/* Living Room Stage for Decors */}
            <div className="relative flex-1 w-full mt-2">
              {DECOR_COLLECTION.map((item) => {
                const isUnlocked = currentLevelInfo.level >= item.unlockLevel;
                if (!isUnlocked) return null;

                return (
                  <div
                    key={item.id}
                    className={`absolute ${item.positionClass} transition-all duration-700 ease-out select-none transform hover:scale-135 cursor-help`}
                    title={`${item.name} (Lv.${item.unlockLevel} 해금!) - ${item.desc}`}
                  >
                    <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] block leading-none">
                      {item.emoji}
                    </span>
                  </div>
                );
              })}

              {currentLevelInfo.level === 1 && (
                <p className="absolute bottom-10 left-0 right-0 text-center text-[10px] text-slate-400 font-medium">
                  📦 집안일을 처리하여 100 XP 달성하면 2레벨 가구들이 해금됩니다!
                </p>
              )}
            </div>
            
            <p className="relative z-10 text-[9px] text-center text-slate-300 font-bold bg-slate-900/40 py-0.5 rounded">
              ※ 캐릭터 가구는 레벨이 높아질수록 자동으로 방에 배치됩니다
            </p>
          </div>

          {/* Decor collection catalog checklist */}
          <div className="lg:col-span-5 bg-white rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500 fill-amber-300" />
                  우리 집 전용 꾸미기 도감 ({unlockedCount}/{DECOR_COLLECTION.length})
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 max-h-[105px] overflow-y-auto pr-1">
                {DECOR_COLLECTION.map((item) => {
                  const isUnlocked = currentLevelInfo.level >= item.unlockLevel;
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-1.5 p-1 px-1.5 rounded border text-left transition-all ${
                        isUnlocked 
                          ? 'border-indigo-100 bg-indigo-50/20 text-slate-800' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-base shrink-0 leading-none select-none">
                        {isUnlocked ? item.emoji : '🔒'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-bold leading-tight truncate">{item.name}</p>
                        <p className="text-[8px] font-semibold text-slate-400">
                          {isUnlocked ? '꾸미기 해금됨' : `Lv.${item.unlockLevel} 해금`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-rose-50/30 p-1.5 rounded-lg border border-rose-100/50 flex items-start gap-1 mt-1.5">
              <span className="text-[10px] mt-0.5 leading-none">💡</span>
              <p className="text-[9px] text-slate-500 font-medium leading-normal">
                주간 살림 정산 시 고등급(S등급 <span className="font-bold text-indigo-600">+100 XP</span>) 획득으로 빠르게 방을 확장하세요!
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
