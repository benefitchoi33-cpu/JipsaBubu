import React from 'react';
import { Sparkles, Lock, Trophy, Heart } from 'lucide-react';

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
  const currentLevelInfo = getLevelInfo(cumulativeHomeXp);
  const nextLevelInfo = LEVEL_STEPS[currentLevelInfo.level] || null;

  // Calculate percentage of Level Progress
  let progressPercentage = 100;
  if (nextLevelInfo) {
    const range = nextLevelInfo.minXp - currentLevelInfo.minXp;
    const progress = cumulativeHomeXp - currentLevelInfo.minXp;
    progressPercentage = Math.min(Math.max(Math.round((progress / range) * 100), 0), 100);
  }

  return (
    <div className="w-full mb-6 no-print" id="house-interior-module">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>🏡 우리 집 미니 인테리어</span>
          <span className="text-xs font-normal text-slate-500">(누적 XP를 모아 가구와 소품을 채워가는 공간)</span>
        </h3>
        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
          RPG 레벨 성장모드 활성화
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 1. Cozy living room visual box - 7 Cols */}
        <div className="lg:col-span-7 bg-indigo-950 rounded-2xl p-5 border border-indigo-900 shadow-md relative overflow-hidden h-[240px] flex flex-col justify-between">
          {/* Sky background inside room window */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-indigo-900/60 to-transparent pointer-events-none" />
          
          {/* Wall Grid and floor */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-amber-800/80 border-t border-amber-900/40 z-0">
            {/* Wooden Floor Pattern lines */}
            <div className="w-full h-full opacity-10 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:28px_100%]" />
          </div>

          {/* Core Info Overlay (Level badge) */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-700 max-w-[200px]">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{currentLevelInfo.icon}</span>
                <span className="text-pink-400 font-extrabold text-[11px] uppercase tracking-wide">LEVEL {currentLevelInfo.level}</span>
              </div>
              <p className="text-xs font-black text-white mt-0.5">{currentLevelInfo.title}</p>
              <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                {spouseAName}🤵 ♥ 👰{spouseBName}
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-800 text-right">
              <span className="text-[10px] text-indigo-300 font-bold tracking-wider">누적 성장 경험치</span>
              <p className="text-sm font-black text-emerald-450 font-mono tracking-tight text-white">
                {cumulativeHomeXp} <span className="text-[10px] text-slate-400">XP</span>
              </p>
            </div>
          </div>

          {/* Living Room Stage for Decors */}
          <div className="relative flex-1 w-full mt-3">
            {DECOR_COLLECTION.map((item) => {
              const isUnlocked = currentLevelInfo.level >= item.unlockLevel;
              if (!isUnlocked) return null;

              return (
                <div
                  key={item.id}
                  className={`absolute ${item.positionClass} transition-all duration-700 ease-out select-none transform hover:scale-135 cursor-help`}
                  title={`${item.name} (Lv.${item.unlockLevel} 해금!) - ${item.desc}`}
                >
                  <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] block leading-none">
                    {item.emoji}
                  </span>
                </div>
              );
            })}

            {/* If Level 1 show empty text */}
            {currentLevelInfo.level === 1 && (
              <p className="absolute bottom-16 left-0 right-0 text-center text-[10px] text-slate-400 font-medium">
                📦 살림살이를 채워볼까요? 조금만 청소해도 100 XP 달성 시 2레벨 해금!
              </p>
            )}
          </div>

          {/* Level Progress Bar inside box */}
          <div className="relative z-10 bg-slate-900/85 backdrop-blur-xs p-2 rounded-xl border border-slate-800/80 mt-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
              <span>{currentLevelInfo.title}</span>
              <span>{nextLevelInfo ? `${cumulativeHomeXp} / ${nextLevelInfo.minXp} XP (${progressPercentage}%)` : '최고 레벨 🎉'}</span>
              <span>{nextLevelInfo ? nextLevelInfo.title : '집안일 정복!'}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-700" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Collection checklist with lock indicators - 5 Cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                우리 집 꾸미기 도감 ({DECOR_COLLECTION.filter(item => currentLevelInfo.level >= item.unlockLevel).length}/{DECOR_COLLECTION.length})
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">청정 레벨업 자동 보상</span>
            </div>
            
            {/* Scrollable grid container */}
            <div className="grid grid-cols-2 gap-1.5 max-h-[145px] overflow-y-auto pr-1">
              {DECOR_COLLECTION.map((item) => {
                const isUnlocked = currentLevelInfo.level >= item.unlockLevel;
                return (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-1.5 p-1 px-2 rounded-lg border text-left transition-all ${
                      isUnlocked 
                        ? 'border-indigo-100 bg-indigo-50/20 text-slate-800' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none filter drop-shadow-sm select-none">
                      {isUnlocked ? item.emoji : '🔒'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold leading-tight truncate">{item.name}</p>
                      <p className="text-[8px] font-semibold text-slate-400">
                        {isUnlocked ? '꾸미기 해금' : `Lv.${item.unlockLevel} 해금`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-rose-50/40 p-2 rounded-xl border border-rose-100/50 flex items-start gap-1.5 mt-2 lg:mt-0">
            <span className="text-xs mt-0.5">💡</span>
            <p className="text-[9.5px] text-slate-500 font-medium leading-normal">
              매일 집안일을 끝내고 <span className="font-bold text-rose-500">주간 살림 정산</span>을 완료하면, 완료 등급 보너스(S등급시 <span className="font-bold text-indigo-600">+100 XP</span>)가 추가로 주어져 빠르게 레벨업할 수 있습니다!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
