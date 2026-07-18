import React from 'react';
import { WeeklyTask } from '../types';
import { Trash2, Plus, Check } from 'lucide-react';

interface WeeklyChecklistProps {
  tasks: WeeklyTask[];
  onToggleCheck: (taskId: string) => void;
  onAddTask: (category: string, name: string) => void;
  onDeleteTask: (taskId: string) => void;
  printModel: 'blank' | 'checked';
  spouseAName: string;
  spouseBName: string;
}

export const WeeklyChecklist: React.FC<WeeklyChecklistProps> = ({
  tasks,
  onToggleCheck,
  onAddTask,
  onDeleteTask,
  printModel,
  spouseAName,
  spouseBName,
}) => {
  const [newCategory, setNewCategory] = React.useState('욕실 가볍게');
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
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">3</span>
          ➌ 주 1회 집중 <span className="text-xs font-normal text-slate-500">(완료 시 30 XP)</span>
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

      {/* Mobile Swipe Hint Indicator */}
      <div className="text-[10px] text-slate-500 bg-slate-50 rounded-lg p-1.5 flex items-center justify-between no-print sm:hidden border border-slate-200 mb-1.5 animate-pulse">
        <span className="font-semibold">👈 좌우로 밀어서 완료 여부를 간편히 입력하세요</span>
        <span className="font-bold">↔</span>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
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
                          id={`delete-weekly-${task.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td
                    className="py-3 sm:py-2.5 text-center border-l border-slate-200 cursor-pointer select-none hover:bg-slate-50 transition-colors"
                    onClick={() => onToggleCheck(task.id)}
                  >
                    {/* Screen checkbox */}
                    <div className="flex items-center justify-center h-full w-full no-print">
                      {task.completedBy === spouseAName ? (
                        <div
                          className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-pink-500 text-white text-xs sm:text-[10px] font-extrabold shadow-md ring-2 ring-pink-100 hover:scale-105"
                          title={`${spouseAName} 완료 (+30 XP)`}
                        >
                          🤵{initialA}
                        </div>
                      ) : task.completedBy === spouseBName ? (
                        <div
                          className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs sm:text-[10px] font-extrabold shadow-md ring-2 ring-indigo-100 hover:scale-105"
                          title={`${spouseBName} 완료 (+30 XP)`}
                        >
                          👰{initialB}
                        </div>
                      ) : task.completed ? (
                        <div className="w-8 h-8 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded bg-indigo-600 text-white shadow-sm">
                          <Check className="w-5 h-5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded border border-slate-300 bg-white hover:border-pink-300 text-slate-350 hover:text-pink-400 text-sm sm:text-xs font-bold">
                          +
                        </div>
                      )}
                    </div>

                    {/* Print marker */}
                    <span className="hidden print:inline text-xs font-bold text-slate-900 leading-none">
                      {shouldShowChecked ? (task.completedBy === spouseAName ? `☑(${initialA})` : task.completedBy === spouseBName ? `☑(${initialB})` : '☑') : '□'}
                    </span>
                  </td>
                  <td className="py-2.5 text-center border-l border-slate-200 no-print">
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

      {/* Add Custom Weekly Task Form - Hide on print */}
      <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap gap-2 no-print bg-slate-50 p-2 rounded-lg border border-slate-150">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-800 font-semibold w-32 focus:outline-none"
        >
          <option value="욕실 가볍게">욕실 가볍게</option>
          <option value="전체 바닥">전체 바닥</option>
          <option value="먼지 관리">먼지 관리</option>
          <option value="세탁 관리">세탁 관리</option>
          <option value="주방 관리">주방 관리</option>
          <option value="집단 가전">집단 가전</option>
          <option value="기타 관리">기타 관리</option>
        </select>
        <input
          type="text"
          placeholder="주간 집중 청소 세부 내용 추가 (예: 서랍정리, 침구 먼지 털기 등)"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1 min-w-[200px] text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          추가
        </button>
      </form>
    </div>
  );
};
