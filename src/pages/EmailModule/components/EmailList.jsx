import React from 'react';

export default function EmailList({ folder, messages, isLoading, selectedEmail, onSelect, searchQuery, onSearch, onAction }) {
  return (
    <div className="w-[350px] lg:w-[400px] bg-slate-900 border-r border-white/5 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-white/5 space-y-4">
        <h2 className="text-lg font-bold text-white capitalize">{folder}</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
          />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading emails...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No messages found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => onSelect(msg)}
                className={`p-4 cursor-pointer transition-colors relative group ${
                  selectedEmail?.id === msg.id ? 'bg-[#38bdf8]/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-600 text-sm text-white truncate pr-2">
                    {msg.sender_user_id === 1 ? 'Me' : msg.sender?.full_name || 'Sender'}
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </div>
                <div className="font-500 text-[13px] text-slate-200 truncate mb-1 pr-8">
                  {msg.subject || '(No Subject)'}
                </div>
                <div className="text-[12px] text-slate-500 truncate" dangerouslySetInnerHTML={{ __html: msg.message_body?.substring(0, 100) || '' }} />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onAction('star', msg); }} className={`${msg.is_starred ? 'text-yellow-400 opacity-100' : 'text-slate-500 hover:text-white'}`}>
                    <svg className="w-4 h-4" fill={msg.is_starred ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onAction('delete', msg); }} className="text-slate-500 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
