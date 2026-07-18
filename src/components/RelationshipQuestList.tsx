import React from 'react';
import { RelationshipQuest } from '../types';
import { Heart, Check } from 'lucide-react';

interface RelationshipQuestListProps {
  quests: RelationshipQuest[];
  onToggleQuest: (questId: string) => void;
  spouseAName: string;
  spouseBName: string;
}

export const RelationshipQuestList: React.FC<RelationshipQuestListProps> = ({
  quests,
  onToggleQuest,
  spouseAName,
  spouseBName,
}) => {
  return (
    <div className="w-full mb-6 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 rounded-full">💖</span>
          ❤️ 관계 성장 퀘스트 <span className="text-xs font-normal text-slate-500">(둘이 함께하는 달콤한 미션, 완료 시 30~50 XP)</span>
        </h3>
        <p className="text-[11px] text-rose-500 font-semibold">
          * 집안일뿐 아니라 서로를 아끼는 작은 약속들로 채워가는 RPG 미션입니다.
        </p>
      </div>

      <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quests.map((quest) => {
            const isCompleted = quest.completed;
            const completedBy = quest.completedBy;
            const initialA = spouseAName.charAt(0);
            const initialB = spouseBName.charAt(0);

            return (
              <div
                key={quest.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'border-rose-200 bg-rose-50/50 ring-1 ring-rose-100'
                    : 'border-slate-100 bg-white hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Heart
                    className={`w-4 h-4 shrink-0 ${
                      isCompleted ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium text-slate-755 leading-tight ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                      {quest.name}
                    </p>
                    <span className="text-[10px] text-rose-550 font-bold mt-1 block">
                      +{quest.xp} XP
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleQuest(quest.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer"
                    title="관계 퀘스트 완료 교대"
                  >
                    {completedBy === spouseAName ? (
                      <div className="w-6.5 h-6.5 flex items-center justify-center rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-black shadow-3xs ring-2 ring-pink-100/50" title={`${spouseAName} 완료`}>
                        🤵{initialA}
                      </div>
                    ) : completedBy === spouseBName ? (
                      <div className="w-6.5 h-6.5 flex items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black shadow-3xs ring-2 ring-indigo-100/50" title={`${spouseBName} 완료`}>
                        👰{initialB}
                      </div>
                    ) : completedBy === 'together' ? (
                      <div className="w-6.5 h-6.5 flex items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black shadow-3xs ring-2 ring-rose-100/50" title="둘이 함께 완료">
                        💖합
                      </div>
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center rounded-full border border-dashed border-slate-250 bg-white hover:border-rose-300 hover:bg-rose-50/20 text-slate-300 hover:text-rose-500 transition-all text-xs font-bold">
                        +
                      </div>
                    )}
                  </button>
                  <span className="text-[9px] font-bold text-rose-500">
                    {completedBy === 'together' ? '함께!' : completedBy ? `${completedBy}` : '대기'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
