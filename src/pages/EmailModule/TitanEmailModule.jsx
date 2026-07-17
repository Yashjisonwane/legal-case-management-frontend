import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import FolderList from './components/FolderList.jsx';
import EmailList from './components/EmailList.jsx';
import EmailPreview from './components/EmailPreview.jsx';
import TitanComposeEmailModal from './components/TitanComposeEmailModal.jsx';
import { useToast } from '../../components/UI.jsx';

export default function TitanEmailModule() {
  const [folders, setFolders] = useState([
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'drafts', label: 'Drafts', icon: '📝' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
    { id: 'spam', label: 'Spam', icon: '🚫' },
    { id: 'archive', label: 'Archive', icon: '📦' },
  ]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState(null); // Used for replies/forwards/drafts
  const { toast } = useToast();

  const fetchMessages = async (folder, search = '') => {
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
  };

  useEffect(() => {
    fetchMessages(selectedFolder, searchQuery);
    // Auto-refresh every 2 mins for background sync
    const interval = setInterval(() => {
      fetchMessages(selectedFolder, searchQuery);
    }, 120000);
    return () => clearInterval(interval);
  }, [selectedFolder, searchQuery]);

  const handleAction = async (action, email) => {
    try {
      if (action === 'delete') {
        await api.request(`/titan-email/messages/${email.id}`, { method: 'DELETE' });
        toast('Message deleted', 'success');
        setSelectedEmail(null);
        fetchMessages(selectedFolder, searchQuery);
      } else if (action === 'star' || action === 'flag') {
        const payload = action === 'star' ? { is_starred: !email.is_starred } : { is_flagged: !email.is_flagged };
        await api.request(`/titan-email/messages/${email.id}`, { method: 'PUT', body: payload });
        fetchMessages(selectedFolder, searchQuery);
        if (selectedEmail?.id === email.id) {
          setSelectedEmail({ ...selectedEmail, ...payload });
        }
      } else if (action === 'reply' || action === 'forward') {
        setComposeData({ mode: action, originalEmail: email });
        setIsComposeOpen(true);
      }
    } catch (err) {
      toast(`Failed to ${action} message`, 'error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-900/50 text-white overflow-hidden rounded-xl border border-white/10 shadow-2xl m-4">
      {/* Left Panel: Folders */}
      <FolderList 
        folders={folders} 
        selectedFolder={selectedFolder} 
        onSelect={setSelectedFolder} 
        onCompose={() => { setComposeData(null); setIsComposeOpen(true); }}
      />
      
      {/* Center Panel: Email List */}
      <EmailList 
        folder={selectedFolder}
        messages={messages}
        isLoading={isLoading}
        selectedEmail={selectedEmail}
        onSelect={setSelectedEmail}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onAction={handleAction}
      />
      
      {/* Right Panel: Email Preview */}
      <EmailPreview 
        email={selectedEmail} 
        onAction={handleAction}
      />

      {/* Compose Modal */}
      {isComposeOpen && (
        <TitanComposeEmailModal 
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)} 
          onSave={() => fetchMessages(selectedFolder, searchQuery)}
          data={composeData}
        />
      )}
    </div>
  );
}
