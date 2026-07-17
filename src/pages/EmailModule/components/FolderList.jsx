import React from 'react';

export default function FolderList({ folders, selectedFolder, onSelect, onCompose, folderCounts = {} }) {
  return (
    <div className="w-[280px] md:w-64 h-full bg-slate-900 md:bg-slate-900/80 border-r border-white/5 flex flex-col shadow-2xl md:shadow-none">
      <div className="p-4 border-b border-white/5">
        <button 
          onClick={onCompose}
          className="w-full py-3 bg-[#0057c7] text-white font-700 rounded-xl hover:bg-[#004bb1] transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <ul className="space-y-1 px-3">
          {folders.map(folder => {
            const count = folderCounts[folder.id] || 0;
            return (
              <li key={folder.id}>
                <button
                  onClick={() => onSelect(folder.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-600 transition-colors ${
                    selectedFolder === folder.id 
                      ? 'bg-[#38bdf8]/10 text-[#38bdf8]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{folder.icon}</span>
                  <span className="flex-1 text-left">{folder.label}</span>
                  {count > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#0057c7] text-white text-[11px] font-bold flex items-center justify-center">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="p-4 border-t border-white/5 bg-black/20">
        <p className="text-xs text-slate-500 text-center">Connected to Titan Mail</p>
      </div>
    </div>
  );
}
