import React, { useState, useEffect } from "react";
import { X, Phone, ShieldClose, AlertTriangle, RefreshCw, Sparkles, Check, CheckCircle2 } from "lucide-react";
import { Contact } from "../types";
import { motion } from "motion/react";

interface ContactDetailSheetProps {
  contact: Contact;
  onClose: () => void;
  onUpdatePersonality: (contactId: string, newPersonality: string) => void;
  isGeneratingAvatar: boolean;
  onGenerateAvatar: (contactId: string) => void;
}

export const ContactDetailSheet: React.FC<ContactDetailSheetProps> = ({
  contact,
  onClose,
  onUpdatePersonality,
  isGeneratingAvatar,
  onGenerateAvatar,
}) => {
  const [editedPersonality, setEditedPersonality] = useState(contact.personality);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if contact changes
  useEffect(() => {
    setEditedPersonality(contact.personality);
  }, [contact]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePersonality(contact.id, editedPersonality);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const initials = contact.name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="w-full md:w-[360px] lg:w-[390px] h-full bg-[#0c1317] border-l border-[#222e35] text-gray-200 shrink-0 flex flex-col z-20 select-none overflow-y-auto"
      id="contact-detail-drawer"
    >
      {/* Drawer Header */}
      <div className="h-[60px] bg-[#202c33] px-5 flex items-center gap-4 border-b border-[#2d3941] shrink-0 text-[#e9edef]">
        <button
          onClick={onClose}
          className="cursor-pointer hover:text-white transition-colors"
          id="btn-close-detail"
        >
          <X size={20} />
        </button>
        <span className="font-medium text-[16px]">Contact Info</span>
      </div>

      <div className="flex-1 space-y-4">
        {/* 1. Large Profile Banner */}
        <div className="bg-[#111b21] p-6 text-center border-b border-[#222e35] flex flex-col items-center select-none shadow">
          <div className="relative mb-3 group">
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={contact.name}
                referrerPolicy="no-referrer"
                className="w-[150px] h-[150px] rounded-full object-cover border-2 border-slate-700 bg-slate-800 shadow-xl"
              />
            ) : (
              <div className="w-[150px] h-[150px] rounded-full bg-slate-700 flex items-center justify-center text-4xl font-extrabold text-slate-100 border-2 border-slate-600 shadow-xl">
                {initials}
              </div>
            )}

            {/* Quick avatar update overlay (Gemini AI avatar generation) */}
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onGenerateAvatar(contact.id)}
                disabled={isGeneratingAvatar}
                className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f72] disabled:bg-slate-700 text-slate-900 font-bold rounded-full text-xs cursor-pointer select-none transition-all flex items-center gap-1 shadow-md scale-95 hover:scale-100"
              >
                {isGeneratingAvatar ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Painting...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} fill="currentColor" />
                    AI Avatar
                  </>
                )}
              </button>
            </div>
          </div>

          <h2 className="text-[#e9edef] text-xl font-medium truncate w-full mb-0.5">
            {contact.name}
          </h2>
          <p className="text-[#8696a0] text-sm font-medium">{contact.phoneNumber}</p>
          <span className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            {contact.status}
          </span>
        </div>

        {/* 2. Contact Bio / About section */}
        <div className="bg-[#111b21] px-6 py-4 border-b border-[#222e35]">
          <span className="block text-slate-400 font-medium text-[11.5px] uppercase tracking-wider mb-1.5 select-none">
            About / Bio
          </span>
          <p className="text-[#d1d7db] text-sm font-medium leading-relaxed">
            {contact.bio}
          </p>
        </div>

        {/* 3. System Prompt Editor (Dynamic Cognition Editor) */}
        <div className="bg-[#111b21] px-6 py-4.5 border-b border-[#222e35]">
          <span className="block text-slate-400 font-semibold text-[11.5px] uppercase tracking-wider mb-2 select-none">
            🚨 AI Mind Prompt (System Instruction)
          </span>

          <form onSubmit={handleSave} className="space-y-3">
            <textarea
              className="w-full bg-[#1c282f] border border-[#2f3c44] rounded p-2.5 text-xs text-[#e9edef] focus:outline-none focus:border-emerald-500 leading-relaxed font-mono resize-none h-[120px]"
              value={editedPersonality}
              onChange={(e) => setEditedPersonality(e.target.value)}
              placeholder="Coach this artificial intelligence contact how to behave..."
            />
            
            <div className="flex items-center justify-between select-none">
              <span className="text-[10px] text-slate-400 leading-snug max-w-[65%]">
                Update to instantly reprogram how {contact.name} thinks and replies!
              </span>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] font-bold rounded text-xs select-none transition-all cursor-pointer shadow flex items-center gap-1 shrink-0"
              >
                {saveSuccess ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    Saved
                  </>
                ) : (
                  "Update Mind"
                )}
              </button>
            </div>
          </form>

          {saveSuccess && (
            <div className="text-[10.5px] text-emerald-400 bg-emerald-950/65 border border-emerald-800/40 p-2 rounded mt-2.5 flex items-center gap-1.5 animation-fade-in">
              <CheckCircle2 size={13} />
              Personality guidelines updated for {contact.name}. Next reply will shift character.
            </div>
          )}
        </div>

        {/* 4. Settings Mock Options */}
        <div className="bg-[#111b21] divide-y divide-[#222e35] text-sm text-[#e9edef]">
          <div className="px-6 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#182229] transition-colors">
            <span>Mute notifications</span>
            <input type="checkbox" className="accent-emerald-500 w-4 h-4 cursor-pointer" />
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#182229] transition-colors text-rose-400 font-medium">
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} /> Block {contact.name}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
