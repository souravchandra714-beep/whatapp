/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { ContactDetailSheet } from "./components/ContactDetailSheet";
import { defaultContacts, defaultMessages } from "./defaultContacts";
import { Contact, Message } from "./types";
import { MessageSquare, Sparkles, AlertCircle, WifiOff } from "lucide-react";
import { AnimatePresence } from "motion/react";

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial State Hydration from LocalStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem("wa_contacts");
    const savedMessages = localStorage.getItem("wa_messages");
    const savedActiveId = localStorage.getItem("wa_active_id");

    if (savedContacts && savedMessages) {
      try {
        const parsedContacts = JSON.parse(savedContacts);
        const parsedMessages = JSON.parse(savedMessages);
        setContacts(parsedContacts);
        setMessages(parsedMessages);
        setActiveContactId(savedActiveId || (parsedContacts.length > 0 ? parsedContacts[0].id : null));
      } catch (err) {
        console.error("Failed to parse localized cookies. Reindexing default mocks:", err);
        resetToDefaults();
      }
    } else {
      resetToDefaults();
    }
  }, []);

  const resetToDefaults = () => {
    setContacts(defaultContacts);
    setMessages(defaultMessages);
    if (defaultContacts.length > 0) {
      setActiveContactId(defaultContacts[0].id);
      localStorage.setItem("wa_active_id", defaultContacts[0].id);
    }
    localStorage.setItem("wa_contacts", JSON.stringify(defaultContacts));
    localStorage.setItem("wa_messages", JSON.stringify(defaultMessages));
  };

  // Helper to commit updates back into localStorage
  const saveStateToStorage = (updatedContacts: Contact[], updatedMessages: Record<string, Message[]>) => {
    localStorage.setItem("wa_contacts", JSON.stringify(updatedContacts));
    localStorage.setItem("wa_messages", JSON.stringify(updatedMessages));
  };

  // 2. Event Action: Select different contact
  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    localStorage.setItem("wa_active_id", id);
    
    // Clear unread counts upon viewing
    const updatedContacts = contacts.map((c) =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    );
    setContacts(updatedContacts);
    saveStateToStorage(updatedContacts, messages);
  };

  // 3. Event Action: Create a custom AI contact
  const handleAddContact = (newContact: Omit<Contact, "unreadCount" | "avatar"> & { avatar?: string }) => {
    const freshContact: Contact = {
      ...newContact,
      avatar: newContact.avatar || "",
      unreadCount: 0,
    };

    const updatedContacts = [freshContact, ...contacts];
    const updatedMessages = {
      ...messages,
      [freshContact.id]: [
        {
          id: `sys-${Date.now()}`,
          text: `👋 You have created a conversation with ${freshContact.name}! Send a message to start compiling chat coaching insights internally.`,
          sender: "contact",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        },
      ],
    };

    setContacts(updatedContacts);
    setMessages(updatedMessages);
    setActiveContactId(freshContact.id);
    localStorage.setItem("wa_active_id", freshContact.id);
    saveStateToStorage(updatedContacts, updatedMessages);
  };

  // 4. Event Action: Direct Chat Area Submission & Gemini Pipeline Orchestration
  const handleSendMessage = async (text: string, image?: string) => {
    if (!activeContactId) return;

    const currentActiveContact = contacts.find((c) => c.id === activeContactId);
    if (!currentActiveContact) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;
    
    // Create new user message block
    const newUserMessage: Message = {
      id: userMsgId,
      text,
      sender: "me",
      timestamp,
      status: "sending",
      image,
    };

    // Update messages stack immediately and render "sent" gray ticks
    const updatedChatHistory = [...(messages[activeContactId] || []), newUserMessage];
    const updatedMessages = {
      ...messages,
      [activeContactId]: updatedChatHistory,
    };

    // Update contacts left pane summary
    let updatedContacts = contacts.map((c) => {
      if (c.id === activeContactId) {
        return {
          ...c,
          lastMessageText: text || "📷 Photo attachment",
          lastMessageTime: timestamp,
          status: "typing..." as const, // Start typing state immediately!
        };
      }
      return c;
    });

    setMessages(updatedMessages);
    setContacts(updatedContacts);
    saveStateToStorage(updatedContacts, updatedMessages);

    // Filter historical chat thread for Gemini context (max 15 messages to stay fast and clear on token space)
    const contextHistory = updatedChatHistory
      .filter((m) => !m.text.startsWith("👋") && !m.text.startsWith("🔒")) // Skip system greetings
      .slice(-15);

    try {
      // Direct call into our server-side Express Endpoint!
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: currentActiveContact.name,
          contactPersonality: currentActiveContact.personality,
          messages: contextHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      const aiReplyText = data.text || "I was unable to compile a rational thought. Please retry.";

      // Commit AI response and flip user checkmarks to blue "read"!
      const aiMsgId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMsgId,
        text: aiReplyText,
        sender: "contact",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };

      // Mark the user's message as "read" and append AI reply
      const finalChatHistory = updatedChatHistory.map((m) =>
        m.id === userMsgId ? { ...m, status: "read" as const } : m
      ).concat(aiMessage);

      const finalMessages = {
        ...messages,
        [activeContactId]: finalChatHistory,
      };

      const finalContacts = contacts.map((c) => {
        if (c.id === activeContactId) {
          return {
            ...c,
            status: "online" as const, // Return contact status back to online
            lastMessageText: aiReplyText,
            lastMessageTime: aiMessage.timestamp,
          };
        }
        return c;
      });

      setMessages(finalMessages);
      setContacts(finalContacts);
      saveStateToStorage(finalContacts, finalMessages);
      setErrorMessage(null); // Clear errors

    } catch (err: any) {
      console.error("Gemini context flow error:", err);
      setErrorMessage(err.message || "Failed to establish stable connect connection to Gemini server.");
      
      // Fallback: Return status to online, mark user message as sent (but grey ticks)
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        text: `⚠️ [System Connection Error] I failed to fetch an answer from the Gemini backend. Details: ${err.message || "Endpoint offline"}.\n\n*Please ensure that your server is starting successfully and that you have typed in a valid GEMINI_API_KEY in Settings > Secrets!*`,
        sender: "contact",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };

      const finalChatHistory = updatedChatHistory.map((m) =>
        m.id === userMsgId ? { ...m, status: "sent" as const } : m
      ).concat(errorMsg);

      const finalMessages = {
        ...messages,
        [activeContactId]: finalChatHistory,
      };

      const finalContacts = contacts.map((c) => {
        if (c.id === activeContactId) {
          return {
            ...c,
            status: "online" as const,
            lastMessageText: "⚠️ Endpoint connection error",
          };
        }
        return c;
      });

      setMessages(finalMessages);
      setContacts(finalContacts);
      saveStateToStorage(finalContacts, finalMessages);
    }
  };

  // 5. Event Action: Clear conversation history
  const handleClearHistory = () => {
    if (!activeContactId) return;
    const clearedMessages = {
      ...messages,
      [activeContactId]: [
        {
          id: `sys-clear-${Date.now()}`,
          text: "🔒 Chat history cleared. Start typing to begin a fresh context buffer.",
          sender: "contact",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        },
      ],
    };
    setMessages(clearedMessages);
    saveStateToStorage(contacts, clearedMessages);
  };

  // 6. Event Action: Reprogram AI Personality/Guidelines
  const handleUpdatePersonality = (contactId: string, newPersonality: string) => {
    const updatedContacts = contacts.map((c) =>
      c.id === contactId ? { ...c, personality: newPersonality } : c
    );
    setContacts(updatedContacts);
    saveStateToStorage(updatedContacts, messages);
  };

  // 7. Event Action: Dynamic AI Avatar Generator with gemini-2.5-flash-image
  const handleGenerateAvatar = async (contactId: string) => {
    const targetContact = contacts.find((c) => c.id === contactId);
    if (!targetContact) return;

    setIsGeneratingAvatar(true);
    try {
      const prompt = `A detailed circular profile photo representation for a character named: "${targetContact.name}", whose bio is: "${targetContact.bio}". Premium visual asset styled nicely.`;
      
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Avatar endpoint failed.");
      }

      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error("No image URL compiled from back end.");
      }

      // Update contact image base64
      const updatedContacts = contacts.map((c) =>
        c.id === contactId ? { ...c, avatar: data.imageUrl } : c
      );
      setContacts(updatedContacts);
      saveStateToStorage(updatedContacts, messages);
      setErrorMessage(null);

    } catch (err: any) {
      console.error("AI painting error:", err);
      // Give a clear, clean message
      alert(`AI Avatar Generation failed: ${err.message || "Please check backend key."}\nMake sure GEMINI_API_KEY is active!`);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const activeContact = contacts.find((c) => c.id === activeContactId) || null;

  return (
    <div className="w-screen h-screen bg-[#0a0f12] text-white flex items-center justify-center font-sans overflow-hidden select-none relative" id="wa-app-root">
      
      {/* Visual background borders */}
      <div className="absolute top-0 left-0 right-0 h-[127px] bg-[#00a884] z-0 select-none hidden md:block opacity-85" />

      {/* Main Single-Screen Board Panel */}
      <div className="w-full h-full md:w-[94%] md:h-[94%] max-w-[1550px] bg-[#111b21] md:rounded-md md:shadow-2xl z-10 overflow-hidden flex flex-col md:border border-slate-800" id="wa-outer-box">
        
        {/* Error Boundary Toast at top (if any network connection drops) */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800 py-2.5 px-4 text-rose-300 text-xs flex items-center justify-between select-none shrink-0" id="error-toast-line">
            <div className="flex items-center gap-2">
              <WifiOff size={15} />
              <span>{errorMessage} Running in local mockup state.</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-400 hover:text-white font-bold px-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Structural single view: Sidebar + Chat Window (+ Optional detail panel sliding-in) */}
        <div className="flex-1 flex h-full overflow-hidden w-full relative">
          
          <Sidebar
            contacts={contacts}
            activeContactId={activeContactId}
            onSelectContact={handleSelectContact}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddContact={handleAddContact}
          />

          {activeContact ? (
            <ChatArea
              contact={activeContact}
              messages={messages[activeContact.id] || []}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearHistory}
              onToggleDetail={() => setIsDetailOpen(!isDetailOpen)}
              isGeneratingAvatar={isGeneratingAvatar}
              onGenerateAvatar={handleGenerateAvatar}
            />
          ) : (
            <div className="flex-1 h-full bg-[#222e35] flex flex-col items-center justify-center p-8 text-center shrink-0" id="intro-splash-pane">
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <MessageSquare size={34} />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-slate-100">WhatsApp Web Clone AI</h2>
              <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
                Connect with Socrates, Shakespeare, Mom, or customize your own AI-powered personas and observe how they chat in natural character context.
              </p>
              <div className="mt-6 text-xs text-emerald-500 font-mono tracking-wider">
                POWERED BY GEMINI 3.5 FLASH
              </div>
            </div>
          )}

          <AnimatePresence>
            {isDetailOpen && activeContact && (
              <ContactDetailSheet
                contact={activeContact}
                onClose={() => setIsDetailOpen(false)}
                onUpdatePersonality={handleUpdatePersonality}
                isGeneratingAvatar={isGeneratingAvatar}
                onGenerateAvatar={handleGenerateAvatar}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
