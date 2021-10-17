import { Message } from "whatsapp-chat-parser/types/types";

export interface TonalMessage extends Message {
    tone?: string;
}