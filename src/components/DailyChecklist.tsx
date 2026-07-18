import React from 'react';
import { DailyTask } from '../types';
import { DAYS_OF_WEEK } from '../data';
import { Trash2, Plus, Check } from 'lucide-react';

interface DailyChecklistProps {
  tasks: DailyTask[];
  onToggleCheck: (taskId: string, day: string) => void;
  onAddTask: (name: string) => void;
  onDeleteTask: (taskId: string) => void;
  printModel: 'blank' | 'checked';
  spouseAName: string;
  spouseBName: string;
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  tasks,
  onToggleCheck,
  onAddTask,
  onDeleteTask,
  printModel,
  spouseAName,
  spouseBName,
}) => {
  const [newTaskName, setNewTaskName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddTask(newTaskName.trim());
      setNewTaskName('');
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">1</span>
          ➊ 매일 & 수시로 <span className="text-xs font-normal text-slate-500">(1회 10 XP)</span>
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
      <div className="text-[10px] text-slate-500 bg-slate-50 rounded-lg p-2 flex items-center justify-between no-print sm:hidden border border-slate-200 mb-1.5 animate-pulse">
        <span className="font-semibold">👈 좌우로 밀어서 요일별(월~일) 청소를 체크하세요</span>
        <span className="font-bold">↔</span>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-xs sm:text-sm text-left border-collapse bg-white">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-2 sm:py-2.5 px-2 sm:px-3 min-w-[150px] sm:min-w-[200px]">청 소 항 목</th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className="py-2 sm:py-2.5 text-center w-9 sm:w-11 border-l border-slate-200">
                  {day}
                </th>
              ))}
              <th className="py-2 sm:py-2.5 text-center w-10 border-l border-slate-200 no-print">주석</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-850">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-medium flex items-center justify-between group">
                  <span className="break-all">{task.name}</span>
                  {task.isCustom && (
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 no-print text-rose-500 hover:text-rose-700 transition-all p-1"
                      title="항목 삭제"
                      id={`delete-daily-${task.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const checkedBy = task.checks[day];
                  const isChecked = !!checkedBy;
                  const shouldShowChecked = printModel === 'checked' ? isChecked : false;
                  const initialA = spouseAName.charAt(0);
                  const initialB = spouseBName.charAt(0);
                  
                  return (
                    <td
                      key={day}
                      className="py-3 sm:py-2 text-center border-l border-slate-200 cursor-pointer select-none hover:bg-slate-50 transition-colors"
                      onClick={() => onToggleCheck(task.id, day)}
                    >
                      {/* Interactive Screen Checkbox */}
                      <div className="flex items-center justify-center h-full w-full no-print">
                        {checkedBy === spouseAName ? (
                          <div
                            className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-pink-500 text-white text-xs sm:text-[10px] font-extrabold shadow-md ring-2 ring-pink-100 hover:scale-105 active:scale-95 transition-all"
                            title={`${spouseAName} 완료 (+10 XP)`}
                          >
                            🤵{initialA}
                          </div>
                        ) : checkedBy === spouseBName ? (
                          <div
                            className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs sm:text-[10px] font-extrabold shadow-md ring-2 ring-indigo-100 hover:scale-105 active:scale-95 transition-all"
                            title={`${spouseBName} 완료 (+10 XP)`}
                          >
                            👰{initialB}
                          </div>
                        ) : checkedBy === true ? (
                          <div
                            className="w-8 h-8 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded bg-indigo-650 text-white shadow-xs"
                          >
                            <Check className="w-5 h-5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded border border-slate-300 bg-white hover:border-pink-300 hover:bg-slate-50 transition-colors text-slate-300 hover:text-pink-400 text-sm sm:text-xs font-bold"
                          >
                            <span>+</span>
                          </div>
                        )}
                      </div>

                      {/* Pure Print-formatted output */}
                      <span className="hidden print:inline text-xs font-bold text-slate-900 leading-none">
                        {shouldShowChecked ? (checkedBy === spouseAName ? `☑(${initialA})` : checkedBy === spouseBName ? `☑(${initialB})` : '☑') : '□'}
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 text-center border-l border-slate-200 no-print">
                  {task.isCustom && (
                    <span className="text-[10px] text-slate-400 px-1 py-0.5 bg-slate-100 rounded">사용자</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Custom Task Form - Hide on print */}
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2 no-print">
        <input
          type="text"
          placeholder="수시 청소 항목 추가 (예: 환기하기, 고양이 모래 비우기 등)"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs"
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

