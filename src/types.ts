export interface Message {
  id: string;
  text: string;
  sender: "me" | "contact";
  timestamp: string; // e.g., "12:34 PM"
  status: "sending" | "sent" | "read";
  image?: string; // base64 / data URL for media attachments
}

export interface Contact {
  id: string;
  name: string;
  avatar: string; // Base64 image, standard URL, or empty for fallback initials
  status: "online" | "offline" | "typing..." | "last seen recently";
  personality: string; // Character prompt configuration block
  unreadCount: number;
  bio: string;
  phoneNumber: string;
  lastMessageText?: string;
  lastMessageTime?: string;
}
