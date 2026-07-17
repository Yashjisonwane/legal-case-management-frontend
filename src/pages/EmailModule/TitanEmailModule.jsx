import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import FolderList from './components/FolderList.jsx';
import EmailList from './components/EmailList.jsx';
import EmailPreview from './components/EmailPreview.jsx';
import TitanComposeEmailModal from './components/TitanComposeEmailModal.jsx';
import { useToast } from '../../components/UI.jsx';

export default function TitanEmailModule() {
  const [folders] = useState([
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'drafts', label: 'Drafts', icon: '📝' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
    { id: 'spam', label: 'Spam', icon: '🚫' },
    { id: 'archive', label: 'Archive', icon: '📦' },
    { id: 'starred', label: 'Starred', icon: '⭐' },
    { id: 'flagged', label: 'Flagged', icon: '🚩' },
  ]);
  const currentUser = JSON.parse(localStorage.getItem('vktori_user') || 'null');
  const userId = currentUser?.id || 1;
  const localStorageKey = `vktori_custom_email_folders_${userId}`;

  const [customFolders, setCustomFolders] = useState(() => {
    return JSON.parse(localStorage.getItem(`vktori_custom_email_folders_${userId}`) || '[]');
  });
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [folderCounts, setFolderCounts] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [threadMessages, setThreadMessages] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // ── Fetch Messages ──────────────────────────────────────
  const fetchMessages = useCallback(async (folder, search = '') => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (folder) queryParams.set('folder', folder);
      if (search) queryParams.set('search', search);
      const res = await api.request(`/titan-email/messages?${queryParams.toString()}`);
      if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      toast('Failed to load emails', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Fetch Folder Counts ─────────────────────────────────
  const fetchFolderCounts = useCallback(async () => {
    try {
      const res = await api.request('/titan-email/folder-counts');
      if (res.data) setFolderCounts(res.data);
    } catch (err) {
      // Silently fail
    }
  }, []);

  // ── Fetch Custom Folders ────────────────────────────────
  const fetchCustomFolders = useCallback(async () => {
    try {
      const res = await api.request('/titan-email/custom-folders');
      if (res.data) {
        setCustomFolders(prev => {
          const stored = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
          const all = new Set([...stored, ...res.data]);
          const merged = Array.from(all);
          localStorage.setItem(localStorageKey, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      // Silently fail
    }
  }, [localStorageKey]);

  // ── Fetch Thread ────────────────────────────────────────
  const fetchThread = useCallback(async (emailId) => {
    try {
      const res = await api.request(`/titan-email/messages/${emailId}/thread`);
      if (res.data && res.data.length > 1) {
        setThreadMessages(res.data);
      } else {
        setThreadMessages([]);
      }
    } catch (err) {
      setThreadMessages([]);
    }
  }, []);

  // ── Refresh helper ──────────────────────────────────────
  const refresh = useCallback(() => {
    fetchMessages(selectedFolder, searchQuery);
    fetchFolderCounts();
    fetchCustomFolders();
  }, [selectedFolder, searchQuery, fetchMessages, fetchFolderCounts, fetchCustomFolders]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
    }, 120000);
    return () => clearInterval(interval);
  }, [selectedFolder, searchQuery, refresh]);

  // ── Manual Sync Action ──────────────────────────────────
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await api.request('/titan-email/sync', { method: 'POST' });
      toast('Sync complete! New messages downloaded.', 'success');
      refresh();
    } catch (err) {
      toast('Sync failed. Please check your credentials.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Create Custom Folder Callback ───────────────────────
  const handleCreateCustomFolder = (folderName) => {
    const cleanName = folderName.trim().toLowerCase();
    if (!cleanName) return;
    const exists = folders.some(f => f.id === cleanName) || customFolders.includes(cleanName);
    if (exists) {
      setSelectedFolder(cleanName);
      return;
    }
    // Add locally and save to localStorage
    setCustomFolders(prev => {
      const next = [...prev, cleanName];
      localStorage.setItem(localStorageKey, JSON.stringify(next));
      return next;
    });
    setSelectedFolder(cleanName);
    toast(`Custom folder "${folderName}" created`, 'success');
  };

  // ── Auto Mark Read on Select ────────────────────────────
  const handleSelectEmail = useCallback(async (email) => {
    setSelectedEmail(email);
    setThreadMessages([]);
    if (email && !email.is_read) {
      try {
        await api.request(`/titan-email/messages/${email.id}/state`, {
          method: 'PUT',
          body: { is_read: true },
        });
        // Update local state
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m));
        email.is_read = true;
        fetchFolderCounts();
      } catch (err) {
        // Silently fail
      }
    }
    // Fetch thread for this email
    if (email) fetchThread(email.id);
  }, [fetchThread, fetchFolderCounts]);

  // ── Handle Single Actions ───────────────────────────────
  const handleAction = async (action, email) => {
    try {
      if (action === 'delete') {
        await api.request(`/titan-email/messages/${email.id}`, { method: 'DELETE' });
        toast(email.folder === 'trash' ? 'Message permanently deleted' : 'Message moved to Trash', 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'restore') {
        await api.request(`/titan-email/messages/${email.id}/restore`, { method: 'PUT' });
        toast('Message restored to Inbox', 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'archive') {
        await api.request(`/titan-email/messages/${email.id}/move`, { method: 'PUT', body: { folder: 'archive' } });
        toast('Message archived', 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'move_to_folder') {
        const { emailObj, folderName } = email;
        await api.request(`/titan-email/messages/${emailObj.id}/move`, { method: 'PUT', body: { folder: folderName } });
        toast(`Message moved to ${folderName}`, 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'star') {
        const newVal = !email.is_starred;
        await api.request(`/titan-email/messages/${email.id}/state`, { method: 'PUT', body: { is_starred: newVal } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_starred: newVal } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_starred: newVal }));
        toast(newVal ? 'Starred' : 'Unstarred', 'info');
      } else if (action === 'flag') {
        const newVal = !email.is_flagged;
        await api.request(`/titan-email/messages/${email.id}/state`, { method: 'PUT', body: { is_flagged: newVal } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_flagged: newVal } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_flagged: newVal }));
        toast(newVal ? 'Flagged' : 'Unflagged', 'info');
      } else if (action === 'mark_read') {
        await api.request(`/titan-email/messages/${email.id}/state`, { method: 'PUT', body: { is_read: true } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_read: true } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_read: true }));
        fetchFolderCounts();
      } else if (action === 'mark_unread') {
        await api.request(`/titan-email/messages/${email.id}/state`, { method: 'PUT', body: { is_read: false } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_read: false } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_read: false }));
        fetchFolderCounts();
      } else if (action === 'reply') {
        setComposeData({ mode: 'reply', originalEmail: email });
        setIsComposeOpen(true);
      } else if (action === 'reply_all') {
        setComposeData({ mode: 'reply_all', originalEmail: email });
        setIsComposeOpen(true);
      } else if (action === 'forward') {
        setComposeData({ mode: 'forward', originalEmail: email });
        setIsComposeOpen(true);
      }
    } catch (err) {
      toast(`Failed to ${action} message`, 'error');
    }
  };

  // ── Handle Bulk Actions ─────────────────────────────────
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    try {
      await api.request('/titan-email/bulk', {
        method: 'POST',
        body: { messageIds: Array.from(selectedIds), action },
      });
      toast(`${action.replace('_', ' ')} applied to ${selectedIds.size} message(s)`, 'success');
      setSelectedIds(new Set());
      setSelectedEmail(null);
      refresh();
    } catch (err) {
      toast(`Bulk ${action} failed`, 'error');
    }
  };

  // ── Toggle selection ────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  // Combine standard and custom folders
  const allFoldersList = [
    ...folders,
    ...customFolders.map(folderName => ({
      id: folderName,
      label: folderName.charAt(0).toUpperCase() + folderName.slice(1),
      icon: '📁',
      isCustom: true,
    })),
  ];

  return (
    <div className="relative flex h-[calc(100vh-80px)] bg-slate-900/50 text-white overflow-hidden rounded-xl border border-white/10 shadow-2xl m-2 sm:m-4">
      
      {/* Mobile Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Panel: Folders */}
      <div className={`
        absolute md:relative z-50 md:z-0 h-full
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <FolderList 
          folders={allFoldersList} 
          selectedFolder={selectedFolder} 
          onSelect={(f) => { setSelectedFolder(f); setSelectedIds(new Set()); setIsSidebarOpen(false); }} 
          onCompose={() => { setComposeData(null); setIsComposeOpen(true); setIsSidebarOpen(false); }}
          folderCounts={folderCounts}
          isSyncing={isSyncing}
          onSync={handleSync}
          onCreateCustomFolder={handleCreateCustomFolder}
        />
      </div>
      
      {/* Center Panel: Email List */}
      <div className={`
        flex-1 md:flex-none h-full w-full md:w-[320px] lg:w-[400px]
        ${selectedEmail ? 'hidden md:flex' : 'flex'}
      `}>
        <EmailList 
          folder={selectedFolder}
          messages={messages}
          isLoading={isLoading}
          selectedEmail={selectedEmail}
          onSelect={handleSelectEmail}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onAction={handleAction}
          onMenuClick={() => setIsSidebarOpen(true)}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onBulkAction={handleBulkAction}
        />
      </div>
      
      {/* Right Panel: Email Preview */}
      <div className={`
        flex-1 h-full w-full
        ${selectedEmail ? 'flex absolute inset-0 z-30 bg-slate-900 md:relative md:z-0' : 'hidden md:flex'}
      `}>
        <EmailPreview 
          email={selectedEmail} 
          onAction={handleAction}
          onBack={() => setSelectedEmail(null)}
          threadMessages={threadMessages}
          currentFolder={selectedFolder}
          folders={allFoldersList}
        />
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <TitanComposeEmailModal 
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)} 
          onSave={() => refresh()}
          data={composeData}
        />
      )}
    </div>
  );
}
