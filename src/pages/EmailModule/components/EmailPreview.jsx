import React from 'react';

export default function EmailPreview({ email, onAction }) {
  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 text-slate-500">
        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p>Select an email to read</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden relative">
      <div className="p-6 border-b border-white/5 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-2xl font-bold text-white leading-tight">{email.subject || '(No Subject)'}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onAction('reply', email)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Reply">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={() => onAction('forward', email)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Forward">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <button onClick={() => onAction('delete', email)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 transition-colors" title="Delete">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0057c7] to-[#38bdf8] flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {email.sender?.full_name?.charAt(0) || 'M'}
            </div>
            <div>
              <div className="font-600 text-[14px] text-white">
                {email.sender_user_id === 1 ? 'Me' : email.sender?.full_name || 'Sender'}
                <span className="text-slate-500 font-400 text-[12px] ml-2">&lt;{email.sender?.email || 'email@example.com'}&gt;</span>
              </div>
              <div className="text-[12px] text-slate-400">
                To: {email.to} {email.cc && ` | CC: ${email.cc}`}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            {new Date(email.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(email.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div 
          className="prose prose-invert max-w-none text-slate-200 text-[14px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.message_body }}
        />
      </div>
    </div>
  );
}
