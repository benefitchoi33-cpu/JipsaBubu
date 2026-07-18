import React from 'react';
import { MonthlyRotationItem } from '../types';
import { Trash2, Plus, Check } from 'lucide-react';

interface MonthlyRotationProps {
  tasks: MonthlyRotationItem[];
  onToggleComplete: (taskId: string) => void;
  onAddTask: (category: string, name: string) => void;
  onDeleteTask: (taskId: string) => void;
  printModel: 'blank' | 'checked';
  spouseAName: string;
  spouseBName: string;
}

export const MonthlyRotation: React.FC<MonthlyRotationProps> = ({
  tasks,
  onToggleComplete,
  onAddTask,
  onDeleteTask,
  printModel,
  spouseAName,
  spouseBName,
}) => {
  const [newCategory, setNewCategory] = React.useState('욕실 전체');
  const [newTaskName, setNewTaskName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim() && newCategory.trim()) {
      onAddTask(newCategory.trim(), newTaskName.trim());
      setNewTaskName('');
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">4</span>
          ➍ 월 1회 로테이션 <span className="text-xs font-normal text-slate-500">(완료 시 50 XP!)</span>
        </h3>
        <p className="text-xs text-indigo-650 font-semibold no-print flex items-center gap-2">
          <span>🔄 교대로 클릭 기록:</span>
          <span className="inline-flex items-center gap-0.5 bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-full text-[10px]">🤵 {spouseAName}</span>
          <span className="text-slate-400">➡️</span>
          <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">👰 {spouseBName}</span>
          <span className="text-slate-400">➡️</span>
          <span className="text-[10px] text-slate-500">⬜ 해제</span>
        </p>
      </div>

      {/* 1. Mobile Optimized Layout (Displays on screens < 640px) */}
      <div className="space-y-2 no-print sm:hidden mb-3">
        {tasks.map((task) => {
          return (
            <div 
              key={task.id} 
              className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-3xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col gap-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black">{task.category}</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 break-all leading-snug">{task.name}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {task.isCustom && (
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onToggleComplete(task.id)}
                  className="w-24 h-8.5 rounded-xl font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 duration-150"
                >
                  {task.completedBy === spouseAName ? (
                    <div className="w-full h-full bg-pink-50 border border-pink-200/80 text-pink-700 flex items-center justify-center gap-1 rounded-xl shadow-3xs animate-scale-up">
                      <span>🤵</span> {spouseAName}
                    </div>
                  ) : task.completedBy === spouseBName ? (
                    <div className="w-full h-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center gap-1 rounded-xl shadow-3xs animate-scale-up">
                      <span>👰</span> {spouseBName}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-50/60 hover:bg-indigo-50/30 text-slate-400 hover:text-indigo-600 border border-slate-200/70 hover:border-indigo-250 flex items-center justify-center gap-1 rounded-xl font-bold transition-all">
                      <span className="text-[10px] opacity-60">✓</span> 미완료
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            등록된 월간 로테이션 항목이 없습니다.
          </div>
        )}
      </div>

      {/* 2. Full Table Layout (Printed ALWAYS, or shown on screen when screen is sm/desktop) */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm hidden sm:block print:block">
        <table className="w-full text-xs sm:text-sm text-left border-collapse bg-white">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-2 sm:py-2.5 px-2 sm:px-3 w-24 sm:w-32">구 분</th>
              <th className="py-2 sm:py-2.5 px-2 sm:px-3 min-w-[130px]">청 소 항 목 (세부 내용)</th>
              <th className="py-2 sm:py-2.5 text-center w-14 sm:w-16 border-l border-slate-200">완 료</th>
              <th className="py-2 sm:py-2.5 text-center w-10 border-l border-slate-200 no-print">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-850">
            {tasks.map((task) => {
              const shouldShowChecked = printModel === 'checked' ? task.completed : false;
              const initialA = spouseAName.charAt(0);
              const initialB = spouseBName.charAt(0);

              return (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-1.5 sm:py-2.5 px-2 sm:px-3 font-semibold text-slate-600 bg-slate-50/30">
                    {task.category}
                  </td>
                  <td className="py-1.5 sm:py-2.5 px-2 sm:px-3">
                    <div className="flex items-center justify-between group">
                      <span className="break-all">{task.name}</span>
                      {task.isCustom && (
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 no-print text-rose-500 hover:text-rose-700 transition-all p-1"
                          title="항목 삭제"
                          id={`delete-monthly-${task.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td
                    className="py-3 sm:py-2.5 text-center border-l border-slate-200 cursor-pointer select-none hover:bg-slate-50 transition-colors"
                    onClick={() => onToggleComplete(task.id)}
                  >
                    {/* Screen checkbox */}
                    <div className="flex items-center justify-center h-full w-full no-print">
                      {task.completedBy === spouseAName ? (
                        <div
                          className="w-8 h-8 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs sm:text-[10px] font-black shadow-3xs ring-2 ring-pink-100/50 hover:scale-105"
                          title={`${spouseAName} 완료 (+50 XP)`}
                        >
                          🤵{initialA}
                        </div>
                      ) : task.completedBy === spouseBName ? (
                        <div
                          className="w-8 h-8 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-[10px] font-black shadow-3xs ring-2 ring-indigo-100/50 hover:scale-105"
                          title={`${spouseBName} 완료 (+50 XP)`}
                        >
                          👰{initialB}
                        </div>
                      ) : task.completed ? (
                        <div className="w-7 h-7 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-3xs">
                          <Check className="w-4 h-4 sm:w-3 sm:h-3 stroke-[3.5]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-full border border-dashed border-slate-250 bg-white hover:border-indigo-300 hover:bg-indigo-50/20 text-slate-300 hover:text-indigo-500 transition-all text-xs font-bold">
                          +
                        </div>
                      )}
                    </div>

                    {/* Print marker */}
                    <div className="hidden print:flex items-center justify-center">
                      {shouldShowChecked ? (
                        task.completedBy === spouseAName ? (
                          <span className="print-check-icon print-check-icon-a">{initialA}</span>
                        ) : task.completedBy === spouseBName ? (
                          <span className="print-check-icon print-check-icon-b">{initialB}</span>
                        ) : (
                          <span className="print-check-icon bg-slate-800 text-white">✓</span>
                        )
                      ) : (
                        <span className="print-check-icon print-check-icon-empty"></span>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 sm:py-2.5 text-center border-l border-slate-200 no-print">
                    {task.isCustom && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                        title="항목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Custom Monthly Task Form - Hide on print */}
      <form onSubmit={handleSubmit} className="mt-2.5 flex flex-wrap gap-2 no-print bg-slate-50 p-2 rounded-lg border border-slate-150">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700 shadow-3xs shrink-0"
        >
          <option value="욕실 전체">욕실 전체</option>
          <option value="침실">침실</option>
          <option value="주방">주방</option>
          <option value="가전">가전</option>
          <option value="기타">기타</option>
        </select>
        <input
          type="text"
          placeholder="월간 청소 항목 추가 (예: 베란다 물청소, 창문 닦기 등)"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1 min-w-[200px] text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-3xs"
        />
        <button
          type="submit"
          className="px-3.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          추가
        </button>
      </form>
    </div>
  );
};
