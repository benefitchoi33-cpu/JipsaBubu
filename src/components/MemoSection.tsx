import React from 'react';

interface MemoSectionProps {
  memo: string;
  onMemoChange: (text: string) => void;
}

export const MemoSection: React.FC<MemoSectionProps> = ({ memo, onMemoChange }) => {
  return (
    <div className="w-full mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
        <span>📝</span>
        <span>메모 (사야 할 세제, 고칠 곳, 다음 주 할 일 등)</span>
      </h3>
      
      {/* Interactive web editor */}
      <div className="no-print">
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="청소 세제를 다 썼거나 필터 교체 주기가 되었다면 메모해두세요. 냉장고에 붙여두고 펜으로 적으셔도 좋습니다!"
          className="w-full min-h-[100px] text-xs p-3.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-inner resize-y leading-relaxed text-slate-700"
          id="memo-textarea"
        />
      </div>

      {/* Elegant lined notebook print placeholder */}
      <div className="hidden print:block border border-slate-200 rounded-lg p-4 bg-white min-h-[140px] relative">
        {memo.trim() ? (
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-6 font-mono">
            {memo}
          </p>
        ) : (
          <div className="space-y-4 pt-1 w-full h-full">
            <div className="border-b border-dashed border-slate-200 h-6"></div>
            <div className="border-b border-dashed border-slate-200 h-6"></div>
            <div className="border-b border-dashed border-slate-200 h-6"></div>
            <div className="border-b border-dashed border-slate-200 h-6"></div>
            <div className="border-b border-dashed border-slate-200 h-6"></div>
          </div>
        )}
      </div>
    </div>
  );
};
