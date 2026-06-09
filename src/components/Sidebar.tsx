import React, { useState } from "react";
import { Search, MessageSquare, MoreVertical, Plus, User, HelpCircle, X, Check, CheckCheck } from "lucide-react";
import { Contact } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddContact: (contact: Omit<Contact, "unreadCount" | "avatar"> & { avatar?: string }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  contacts,
  activeContactId,
  onSelectContact,
  searchQuery,
  onSearchChange,
  onAddContact,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPersonality, setNewContactPersonality] = useState("");
  const [newContactBio, setNewContactBio] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  // Generate color scheme for fallback initials
  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-teal-600 text-teal-100",
      "bg-blue-600 text-blue-100",
      "bg-rose-600 text-rose-100",
      "bg-emerald-600 text-emerald-100",
      "bg-purple-600 text-purple-100",
      "bg-indigo-600 text-indigo-100",
      "bg-amber-600 text-amber-100",
    ];
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
        sum += id.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const currentContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnread = filterUnread ? c.unreadCount > 0 : true;
    return matchesSearch && matchesUnread;
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPersonality.trim()) return;

    const id = newContactName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString().slice(-4);
    
    onAddContact({
      id,
      name: newContactName,
      status: "online",
      personality: newContactPersonality,
      bio: newContactBio || "Simulated AI contact.",
      phoneNumber: newContactPhone || "+1 (555) 000-0000",
      avatar: "",
      lastMessageText: "Conversation started.",
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Reset Form
    setNewContactName("");
    setNewContactPersonality("");
    setNewContactBio("");
    setNewContactPhone("");
    setShowAddModal(false);
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[410px] h-full flex flex-col bg-[#111b21] border-r border-[#222e35] text-gray-200 shrink-0 relative" id="wa-sidebar">
      {/* 1. Header Area */}
      <div className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between shrink-0 select-none">
        {/* User own profile mimic */}
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-full bg-emerald-600 border border-[#222e35] flex items-center justify-center text-white font-bold cursor-pointer">
            WA
          </div>
          <span className="font-medium text-sm hidden sm:inline text-white">My Account</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-5 text-[#aebac1]">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`cursor-pointer hover:text-emerald-400 Transition-all text-xs border rounded-full px-2 py-0.5 border-[#2f3b43] ${filterUnread ? "bg-emerald-950 text-emerald-400 font-semibold" : ""}`}
            title="Filter unread"
          >
            {filterUnread ? "All" : "Unread"}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer hover:text-emerald-400 transition-all"
            title="Create custom AI contact"
            id="btn-add-contact"
          >
            <Plus size={22} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="cursor-pointer hover:text-[#e9edef] transition-all"
              id="btn-sidebar-settings"
            >
              <MoreVertical size={20} />
            </button>
            
            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#233138] rounded shadow-lg border border-[#2f3c44] py-1 z-30 font-medium">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#182229] transition-all cursor-pointer text-[#d1d7db]"
                  onClick={() => {
                    alert("WhatsApp Web Clone v1.0.0\nFully client-contained storage with custom Gemini-powered auto-responder backend.");
                    setShowSettingsDropdown(false);
                  }}
                >
                  App Info
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#182229] transition-all cursor-pointer text-[#d1d7db]"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset all chats to default? This will clear custom contacts and clear localStorage.")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                    setShowSettingsDropdown(false);
                  }}
                >
                  Reset App Cache
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Notification Mock banner */}
      <div className="bg-[#182229] p-3 flex items-center gap-3 select-none text-xs border-b border-[#222e35]">
        <div className="w-8 h-8 rounded-full bg-[#53bdeb] flex items-center justify-center text-slate-900">
          <HelpCircle size={18} />
        </div>
        <div className="flex-1 text-slate-300">
          <div className="font-semibold text-slate-100">Live Gemini Chat Active</div>
          <div className="text-[11px] leading-snug">Personalities reply dynamically based on custom coaching!</div>
        </div>
      </div>

      {/* 3. Search and filter bar */}
      <div className="p-2.5 bg-[#111b21] flex items-center gap-2 border-b border-[#222e35] select-none shrink-0">
        <div className="flex-1 bg-[#202c33] rounded-lg h-9 flex items-center px-3 border border-[#222e35] focus-within:border-emerald-500 transition-colors">
          <Search size={16} className="text-[#8696a0] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search or start a new AI conversation..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[13.5px] text-gray-200 placeholder-[#8696a0] w-full"
            id="sidebar-search-input"
          />
        </div>
      </div>

      {/* 4. Active Contact list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35] max-h-full" id="contacts-list-container">
        {currentContacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8696a0]">
            No conversations found. Create a new AI contact profile above!
          </div>
        ) : (
          currentContacts.map((contact) => {
            const isActive = contact.id === activeContactId;
            const initials = contact.name.slice(0, 2).toUpperCase();
            
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors relative select-none ${
                    isActive ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
                }`}
                id={`contact-item-${contact.id}`}
              >
                {/* Avatar area */}
                <div className="relative shrink-0 select-none">
                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      referrerPolicy="no-referrer"
                      className="w-[49px] h-[49px] rounded-full object-cover border border-slate-700 bg-slate-800"
                    />
                  ) : (
                    <div className={`w-[49px] h-[49px] rounded-full flex items-center justify-center font-bold text-sm tracking-wider ${getAvatarColor(contact.id)}`}>
                      {initials}
                    </div>
                  )}
                  {/* Status Indicator bubble */}
                  {contact.status === "online" && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full" />
                  )}
                </div>

                {/* Text and context elements */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-medium text-[15.5px] text-gray-100 truncate pr-2">
                      {contact.name}
                    </h3>
                    <span className={`text-[11.5px] shrink-0 font-light ${contact.unreadCount > 0 ? "text-emerald-400 font-semibold" : "text-[#8696a0]"}`}>
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[13px] truncate ${contact.status === "typing..." ? "text-emerald-400 italic font-medium" : "text-[#8696a0]"}`}>
                      {contact.status === "typing..." ? (
                        "typing..."
                      ) : (
                        contact.lastMessageText || contact.bio
                      )}
                    </p>
                    
                    {/* Tick check or unread counts */}
                    <div className="flex items-center shrink-0">
                      {contact.unreadCount > 0 ? (
                        <span className="bg-[#25d366] text-[#111b21] font-bold text-[11px] min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center">
                          {contact.unreadCount}
                        </span>
                      ) : (
                        <div className="text-slate-500">
                          <CheckCheck size={16} className="text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Custom Add AI contact panel */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 select-none animate-fade-in" id="add-contact-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#222e35] max-w-md w-full rounded-lg border border-[#2f3c44] shadow-2xl overflow-hidden flex flex-col"
              id="add-contact-modal"
            >
              <div className="bg-[#202c33] px-5 py-3.5 border-b border-[#2f3c44] flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#e9edef] flex items-center gap-2">
                  <User size={19} className="text-emerald-400" />
                  Add Custom AI Contact
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitContact} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sherlock Holmes, Tony Stark"
                    className="w-full bg-[#111b21] border border-[#2f3c44] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                    Personality prompt (What coaches their behavior) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. You are Sherlock Holmes, the brilliant consulting detective. You speak with high analytical precision, observe tiny details in the user's messages, and maintain a quiet, logical British pride."
                    className="w-full bg-[#111b21] border border-[#2f3c44] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={newContactPersonality}
                    onChange={(e) => setNewContactPersonality(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                      Status / Bio
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Investigating at 221B Baker St"
                      className="w-full bg-[#111b21] border border-[#2f3c44] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      value={newContactBio}
                      onChange={(e) => setNewContactBio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +44 20 7224 3688"
                      className="w-full bg-[#111b21] border border-[#2f3c44] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-[#182229] p-2.5 rounded border border-[#2a3942] leading-relaxed">
                  <span className="font-semibold text-emerald-400">💡 Custom personalities:</span> Creating a contact registers them inside the app memory. Under the hood, they will answer you in extreme real-time fidelity according exactly to the prompt you wrote!
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-[#2f3c44] text-[#8696a0] hover:text-white rounded text-xs select-none transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] font-bold rounded text-xs select-none transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Create Contact
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
