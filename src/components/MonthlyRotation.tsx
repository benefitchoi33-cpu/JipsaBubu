import React from 'react';
import { MonthlyRotationItem } from '../types';
import { Sparkles, Check } from 'lucide-react';

interface MonthlyRotationProps {
  tasks: MonthlyRotationItem[];
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  printModel: 'blank' | 'checked';
  spouseAName: string;
  spouseBName: string;
}

export const MonthlyRotation: React.FC<MonthlyRotationProps> = ({
  tasks,
  onSelectTask,
  onToggleComplete,
  printModel,
  spouseAName,
  spouseBName,
}) => {
  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">4</span>
          ➍ 월 1회 로테이션 <span className="text-xs font-normal text-slate-500">(완료 시 50 XP!)</span>
        </h3>
        <p className="text-xs text-indigo-650 font-semibold no-print flex items-center gap-1.5 align-middle">
          <span>🔄 교대로 클릭 기록:</span>
          <span className="inline-flex items-center gap-0.5 bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-full text-[10px]">🤵 {spouseAName}</span>
          <span className="text-slate-400">➡️</span>
          <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">👰 {spouseBName}</span>
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2.5">
        <p className="text-xs text-slate-500 italic mb-2 no-print">
          💡 이번 주에 집중해서 완료할 대청소를 골라주세요! 선택 시 완료 교대 체크박스가 활성화됩니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-800">
          {tasks.map((task) => {
            const isSel = task.isSelected;
            const printSymbol = isSel ? '○' : ' ';
            const initialA = spouseAName.charAt(0);
            const initialB = spouseBName.charAt(0);
            const printCompletion = printModel === 'checked' && task.completed 
              ? ` (완료! ☑ ${task.completedBy ? task.completedBy.charAt(0) : ''})` 
              : '';

            return (
              <div
                key={task.id}
                className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all ${
                  isSel
                    ? 'border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                {/* 1. Selection indicator */}
                <button
                  type="button"
                  onClick={() => onSelectTask(task.id)}
                  className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-all no-print ${
                    isSel ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                  }`}
                  id={`select-monthly-${task.id}`}
                >
                  {isSel && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </button>

                {/* Print indicator */}
                <span className="hidden print:inline font-mono text-sm leading-none shrink-0 mt-0.5 select-none font-bold">
                  ({isSel ? '○' : ' '})
                </span>

                {/* Task detail */}
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-700 block text-xs">{task.category}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{task.name}</p>
                </div>

                {/* 2. Completion Checkbox (Only if selected) */}
                {isSel && (
                  <div className="flex items-center gap-1.5 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer"
                      id={`complete-monthly-${task.id}`}
                      title="완료자 교대 추가"
                    >
                      {task.completedBy === spouseAName ? (
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-extrabold shadow-xs ring-2 ring-pink-100 font-sans">
                          🤵{initialA}
                        </div>
                      ) : task.completedBy === spouseBName ? (
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-xs ring-2 ring-indigo-100 font-sans">
                          👰{initialB}
                        </div>
                      ) : task.completed ? (
                        <div className="w-5 h-5 flex items-center justify-center rounded bg-emerald-600 border border-emerald-600 text-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center rounded border border-slate-300 bg-white hover:border-emerald-500 text-slate-350 text-[10px] font-bold">
                          +
                        </div>
                      )}
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">
                      {task.completedBy ? `${task.completedBy}` : '대기'}
                    </span>
                  </div>
                )}

                {/* Print completion notation */}
                <span className="hidden print:inline font-bold text-xs text-emerald-700">
                  {printCompletion}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
