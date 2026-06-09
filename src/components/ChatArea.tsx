import React, { useState, useRef, useEffect } from "react";
import { Phone, Video, Search, Paperclip, Smile, Send, Mic, X, Play, Pause, Image, FileText, Trash2, Maximize2, Sparkles, SmileIcon } from "lucide-react";
import { Contact, Message } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { motion, AnimatePresence } from "motion/react";

interface ChatAreaProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string, image?: string) => void;
  onClearHistory: () => void;
  onToggleDetail: () => void;
  isGeneratingAvatar: boolean;
  onGenerateAvatar: (contactId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  contact,
  messages,
  onSendMessage,
  onClearHistory,
  onToggleDetail,
  isGeneratingAvatar,
  onGenerateAvatar,
}) => {
  const [inputText, setInputText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, contact.status]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    onSendMessage(inputText, selectedImage || undefined);
    setInputText("");
    setSelectedImage(null);
    setShowAttachMenu(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Image upload handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setShowAttachMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Recording Simulator
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopAndSendRecording = (send: boolean) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
    
    if (send && recordingSeconds > 0) {
      const durationStr = formatTime(recordingSeconds);
      // Send message representing simulated voice note
      onSendMessage(`🎤 [Voice Message - ${durationStr}]`, undefined);
    }
    setRecordingSeconds(0);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Pre-baked quick responses / emoji picks
  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Voice playback emulation storage
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voicePlaybackRates, setVoicePlaybackRates] = useState<Record<string, number>>({});

  const toggleVoicePlayback = (id: string) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(id);
      // Simulate auto stop after 4-5s
      setTimeout(() => {
        setPlayingVoiceId((prev) => prev === id ? null : prev);
      }, 5000);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0b141a] relative min-w-0" id="chat-pane-frame">
      {/* 1. Chat Header */}
      <div className="h-[60px] bg-[#202c33] px-3 sm:px-5 flex items-center justify-between z-10 shrink-0 select-none border-b border-[#2d3941]">
        <div className="flex items-center gap-3 cursor-pointer min-w-0 flex-1" onClick={onToggleDetail}>
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={contact.name}
              referrerPolicy="no-referrer"
              className="w-[40px] h-[40px] rounded-full object-cover border border-slate-700 bg-slate-800"
            />
          ) : (
            <div className="w-[40px] h-[40px] rounded-full bg-slate-600 font-bold flex items-center justify-center text-sm text-slate-100">
              {contact.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-[#e9edef] font-medium text-[15px] sm:text-[16px] truncate">
              {contact.name}
            </h2>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[12px] truncate ${contact.status === "typing..." ? "text-emerald-400 font-medium italic animate-pulse" : "text-[#8696a0]"}`}>
                {contact.status}
              </span>
            </div>
          </div>
        </div>

        {/* Header Tools */}
        <div className="flex items-center gap-4 sm:gap-6 text-[#aebac1] select-none shrink-0 pl-2">
          {/* Magic paint trigger to auto-generate contact avatars using gemini-2.5-flash-image */}
          {!contact.avatar && (
            <button
              onClick={() => onGenerateAvatar(contact.id)}
              disabled={isGeneratingAvatar}
              className={`p-1.5 rounded-full cursor-pointer hover:bg-white/10 hover:text-yellow-300 transition-all ${isGeneratingAvatar ? "animate-spin text-yellow-300" : ""}`}
              title="Generate custom AI Avatar with Gemini Image!"
            >
              <Sparkles size={18} />
            </button>
          )}

          <button onClick={onToggleDetail} className="cursor-pointer hover:text-white transition-all text-xs border border-teal-800 rounded px-2 py-0.5" title="View Contact profile prompt">
            Prompt Detail
          </button>
          
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear your conversation history with " + contact.name + "?")) {
                onClearHistory();
              }
            }}
            className="cursor-pointer hover:text-rose-400 transition-all text-[#aebac1]"
            title="Clear Chat History"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 2. Message History Canvas with WhatsApp Background theme */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 relative" 
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(37, 211, 102, 0.05) 0%, rgba(11, 20, 26, 0) 70%)",
        }}
        id="messages-canvas-viewport"
      >
        {/* Soft greeting marker */}
        <div className="mx-auto text-center my-2 max-w-sm">
          <span className="bg-[#182229] border border-[#2d3941] text-[#8696a0] text-[11.5px] px-3 py-1.5 rounded-md leading-relaxed inline-block select-none shadow-md">
            🔒 Messages with {contact.name} are generated dynamically by your personal server-side Gemini 3.5 AI Core.
          </span>
        </div>

        {messages.map((msg, index) => {
          const isMe = msg.sender === "me";
          const isVoice = msg.text.startsWith("🎤 [Voice Message");
          
          return (
            <div
              key={msg.id || index}
              className={`flex w-full ${isMe ? "justify-end animate-slice-left" : "justify-end flex-row-reverse animate-slice-right"}`}
              id={`bubble-container-${msg.id}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3.5 py-2 relative shadow shadow-black/20 ${
                  isMe 
                    ? "bg-[#005c4b] text-gray-100 rounded-tr-none" 
                    : "bg-[#202c33] text-gray-100 rounded-tl-none"
                }`}
              >
                {/* 1. Attachment Image (if specified) */}
                {msg.image && (
                  <div className="mb-2 rounded overflow-hidden max-w-full border border-black/10 relative group">
                    <img
                      src={msg.image}
                      alt="Shared Image"
                      className="max-h-[250px] w-full object-cover cursor-pointer hover:brightness-95 transition-all"
                      onClick={() => setLightboxImage(msg.image || null)}
                    />
                    <button 
                      onClick={() => setLightboxImage(msg.image || null)}
                      className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                )}

                {/* 2. Chat Bubble Content */}
                {isVoice ? (
                  // Custom fully functional playback tracking interface for voice note mockups
                  <div className="flex items-center gap-3.5 py-1.5 min-w-[210px] sm:min-w-[250px]">
                    <button
                      onClick={() => toggleVoicePlayback(msg.id)}
                      className={`w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-teal-950 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0`}
                    >
                      {playingVoiceId === msg.id ? (
                        <Pause size={14} fill="currentColor" />
                      ) : (
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      {/* Equalizer waves simulation */}
                      <div className="flex items-end gap-[3px] h-6 mb-1.5">
                        {[12, 18, 8, 22, 14, 25, 10, 16, 28, 6, 20, 15, 22, 11, 26, 9, 14].map((h, i) => {
                          const isPlaying = playingVoiceId === msg.id;
                          return (
                            <span 
                              key={i} 
                              className={`w-0.5 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-slate-500"}`}
                              style={{ 
                                height: `${isPlaying ? Math.sin((i + Date.now()/50)) * (h/2) + (h/2) + 4 : h}px`,
                                transition: isPlaying ? 'height 0.1s ease' : 'none'
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8696a0]">
                        <span>{playingVoiceId === msg.id ? "Playing..." : msg.text.slice(19, -1)}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Markdown parsed message
                  <div className="pr-10">
                    <MarkdownRenderer text={msg.text} />
                  </div>
                )}

                {/* 3. Small timing detail element */}
                {!isVoice && (
                  <div className="absolute bottom-1 right-1.5 flex items-center gap-1 leading-none select-none">
                    <span className="text-[10px] text-[#8696a0]">
                      {msg.timestamp}
                    </span>
                    {isMe && (
                      <span className="text-[14px]">
                        {msg.status === "sending" ? (
                          <span className="text-gray-500">...</span>
                        ) : (
                          <span className={msg.status === "read" ? "text-sky-400" : "text-[#8696a0]"}>✓✓</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 4. Contact active Typing Indicator Ellipses inside viewport */}
        {contact.status === "typing..." && (
          <div className="flex justify-start animate-fade-in" id="typing-indicator-frame">
            <div className="bg-[#202c33] px-4 py-2.5 rounded-lg rounded-tl-none text-slate-100 flex items-center gap-1 shadow">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Sliding attachment selection preview overlay */}
      {selectedImage && (
        <div className="absolute bottom-[60px] left-0 right-0 max-h-[140px] bg-[#1f2c34] p-3 border-t border-[#2d3941] flex items-center justify-between z-20 shadow-lg">
          <div className="flex items-center gap-3">
            <img src={selectedImage} alt="Attachment Preview" className="w-20 h-20 object-cover rounded border border-slate-600 bg-slate-800" />
            <div>
              <div className="text-xs font-semibold text-emerald-400 select-none">Image attachment queued</div>
              <div className="text-[11px] text-slate-400 select-none">Will send with the message prompt beneath.</div>
            </div>
          </div>
          <button 
            onClick={() => setSelectedImage(null)}
            className="p-1 px-2.5 rounded bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X size={15} /> Remove
          </button>
        </div>
      )}

      {/* 4. Controls / Input Bar */}
      <div className="h-[62px] bg-[#202c33] px-3 sm:px-4 flex items-center gap-2 sm:gap-3 z-10 shrink-0 select-none border-t border-[#111a20]">
        
        {/* Attachment Options */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${showAttachMenu ? "bg-[#2a3942] text-emerald-400" : "text-[#aebac1] hover:bg-[#2a3942]"}`}
            id="btn-attachment-toggle"
          >
            <Paperclip size={21} className="transform rotate-45" />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 w-36 bg-[#233138] border border-[#2f3c44] rounded-lg shadow-2xl py-1 z-30 font-medium overflow-hidden animate-slide-up">
              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-[#182229] transition-all cursor-pointer text-[#d1d7db]"
              >
                <Image size={15} className="text-emerald-400 animate-pulse" />
                Upload Photo
              </button>
              <button
                onClick={() => { setSelectedImage("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"); setShowAttachMenu(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-[#182229] transition-all cursor-pointer text-[#d1d7db]"
              >
                <Sparkles size={15} className="text-yellow-400" />
                Abstract Art
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
            id="attach-file-fileinput"
          />
        </div>

        {/* Quick Emoji selection menu */}
        <div className="flex gap-1.5 shrink-0 select-none max-w-[124px] sm:max-w-none items-center overflow-x-auto no-scrollbar py-1">
          {["💡", "🤖", "🔥", "❤️", "👍"].map((em) => (
            <button
              key={em}
              onClick={() => addEmoji(em)}
              className="text-sm p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer select-none"
            >
              {em}
            </button>
          ))}
        </div>

        {/* Input box / Or microphone control area */}
        {isRecording ? (
          <div className="flex-1 bg-[#182229] rounded-lg h-10 flex items-center px-4 justify-between border border-rose-950/40">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider">Recording voice message simulation</span>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="font-mono text-sm text-red-400">{formatTime(recordingSeconds)}</span>
              <button 
                onClick={() => stopAndSendRecording(false)} 
                className="p-1 px-2.5 rounded border border-rose-800 hover:bg-rose-900/60 text-rose-300 text-[11px] cursor-pointer"
              >
                Discard
              </button>
              <button 
                onClick={() => stopAndSendRecording(true)} 
                className="p-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded text-[11px] cursor-pointer shadow"
              >
                Send Note
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#2a3942] rounded-lg h-10 flex items-center px-3 border border-transparent focus-within:border-[#00a884] transition-colors relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-transparent border-none outline-none text-[14px] text-gray-200 placeholder-[#8696a0] w-full"
              id="chat-text-input"
            />
          </div>
        )}

        {/* Submit controls */}
        <div className="shrink-0 select-none">
          {inputText.trim() || selectedImage ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f72] flex items-center justify-center text-[#111b21] hover:scale-105 transition-all cursor-pointer shadow-md"
              id="chat-send-btn"
            >
              <Send size={18} fill="currentColor" className="ml-0.5" />
            </button>
          ) : (
            <>
              {!isRecording && (
                <button
                  onClick={startRecording}
                  className="w-10 h-10 rounded-full text-[#aebac1] hover:bg-[#2a3942] flex items-center justify-center cursor-pointer transition-colors"
                  title="Record voice message simulation"
                  id="chat-mic-btn"
                >
                  <Mic size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 5. Custom Fullscreen Lightbox Portal for Shared Media assets */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 select-none animate-fade-in"
            onClick={() => setLightboxImage(null)}
            id="lightbox-viewport"
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex flex-col justify-center items-center">
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-0 right-0 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full cursor-pointer transition-all border border-white/10"
              >
                <X size={20} />
              </button>
              <img 
                src={lightboxImage} 
                alt="Fullscreen View" 
                className="max-w-full max-h-[80vh] object-contain rounded-md border border-white/10 shadow-2xl" 
              />
              <div className="mt-4 text-[#8696a0] text-xs font-medium">Shared via Gemini Intelligent WhatsApp Portal</div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
