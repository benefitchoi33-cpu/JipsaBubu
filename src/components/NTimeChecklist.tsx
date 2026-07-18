import React from 'react';
import { NTimesTask } from '../types';
import { Trash2, Plus, Check } from 'lucide-react';

interface NTimeChecklistProps {
  tasks: NTimesTask[];
  onToggleCheck: (taskId: string, index: number) => void;
  onAddTask: (name: string, targetCount: number, note: string) => void;
  onDeleteTask: (taskId: string) => void;
  printModel: 'blank' | 'checked';
  spouseAName: string;
  spouseBName: string;
}

export const NTimeChecklist: React.FC<NTimeChecklistProps> = ({
  tasks,
  onToggleCheck,
  onAddTask,
  onDeleteTask,
  printModel,
  spouseAName,
  spouseBName,
}) => {
  const [newTaskName, setNewTaskName] = React.useState('');
  const [newTargetCount, setNewTargetCount] = React.useState(2);
  const [newNote, setNewNote] = React.useState('주 2회');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddTask(newTaskName.trim(), newTargetCount, newNote || `주 ${newTargetCount}회`);
      setNewTaskName('');
      setNewTargetCount(2);
      setNewNote('주 2회');
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    setNewTargetCount(val);
    setNewNote(`주 ${val}회`);
  };

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">2</span>
          ➋ 이번 주 N번 <span className="text-xs font-normal text-slate-500">(1회 15 XP)</span>
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
        <span className="font-semibold">👈 좌우로 밀어서 실행 횟수와 비고란을 확인하세요</span>
        <span className="font-bold">↔</span>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-xs sm:text-sm text-left border-collapse bg-white">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-2 sm:py-2.5 px-2 sm:px-3 min-w-[140px]">청 소 항 목</th>
              <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center w-28 sm:w-36 border-l border-slate-200">실 행 횟 수</th>
              <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-left w-24 sm:w-32 border-l border-slate-200">비 고</th>
              <th className="py-2 sm:py-2.5 text-center w-10 border-l border-slate-200 no-print">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-850">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-1.5 sm:py-2.5 px-2 sm:px-3 font-medium">
                  <div className="flex items-center justify-between group">
                    <span className="break-all">{task.name}</span>
                    {task.isCustom && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 no-print text-rose-500 hover:text-rose-700 transition-all p-1"
                        title="항목 삭제"
                        id={`delete-ntimes-${task.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-3 sm:py-2.5 px-2 sm:px-3 border-l border-slate-200 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: task.targetCount }).map((_, i) => {
                      const checkedBy = task.completedBy ? task.completedBy[i] : (task.completedCount > i ? spouseAName : null);
                      const isBoxChecked = !!checkedBy;
                      const shouldShowChecked = printModel === 'checked' ? isBoxChecked : false;
                      const initialA = spouseAName.charAt(0);
                      const initialB = spouseBName.charAt(0);

                      return (
                        <div key={i} className="inline-block">
                          {/* Screen interactive checkbox */}
                          <button
                            onClick={() => onToggleCheck(task.id, i)}
                            className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full transition-all no-print select-none cursor-pointer"
                            id={`check-ntimes-${task.id}-${i}`}
                          >
                            {checkedBy === spouseAName ? (
                              <div
                                className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-pink-500 text-white text-xs sm:text-[10px] font-extrabold shadow-md ring-2 ring-pink-100 hover:scale-105"
                                title={`${spouseAName} 완료 (+15 XP)`}
                              >
                                🤵{initialA}
                              </div>
                            ) : checkedBy === spouseBName ? (
                              <div
                                className="w-10 h-10 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs sm:text-[10px] font-extrabold shadow-md ring-2 ring-indigo-100 hover:scale-105"
                                title={`${spouseBName} 완료 (+15 XP)`}
                              >
                                👰{initialB}
                              </div>
                            ) : (
                              <div className="w-8 h-8 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded border border-slate-300 bg-white hover:border-pink-300 text-slate-350 hover:text-pink-400 text-sm sm:text-xs font-bold">
                                +
                              </div>
                            )}
                          </button>

                          {/* Print output */}
                          <span className="hidden print:inline text-xs font-bold text-slate-900 leading-none">
                            {shouldShowChecked ? (checkedBy === spouseAName ? `☑(${initialA})` : checkedBy === spouseBName ? `☑(${initialB})` : '☑') : '□'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="py-1.5 sm:py-2.5 px-2 sm:px-3 border-l border-slate-200 text-slate-500 text-xs font-semibold">
                  {task.note}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Custom N-Times Task Form - Hide on print */}
      <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap gap-2 no-print bg-slate-50 p-2 rounded-lg border border-slate-150">
        <input
          type="text"
          placeholder="목표 청소 추가 (예: 욕실 환풍기 청소, 바닥 극세사 밀대질 등)"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1 min-w-[200px] text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs"
        />
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-700">
          <span>횟수:</span>
          <select
            value={newTargetCount}
            onChange={handleTargetChange}
            className="px-2 py-1.5 border border-slate-300 rounded bg-white font-medium"
          >
            <option value={1}>1회</option>
            <option value={2}>2회</option>
            <option value={3}>3회</option>
            <option value={4}>4회</option>
            <option value={5}>5회</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="비고"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="w-20 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs"
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
