import { Message } from "whatsapp-chat-parser/types/types";

export interface TonalMessage extends Message {
    tone?: string;
}

export const TONES = {
    "j": ["joking", "100000"],
    "hj": ["half-joking", "10000100000"],
    "s": ["sarcastic", "100000000"],
    "gen": ["genuine", "1110000"],
    "srs": ["serious", "1010001"],
    "nsrs": ["non-serious", "10001010001"],
    "pos": ["positive", "11100000"],
    "neu": ["neutral", "1110000"],
    "neg": ["negative", "11100000"],
    "p": ["platonic", "10000000"],
    "r": ["romantic", "10000000"],
    "c": ["copypasta", "100000000"],
    "l": ["lyrics", "100000"],
    "lh": ["light-hearted", "1000001000000"],
    "nm": ["not mad", "1000100"],
    "lu": ["a little upset", "00100000010000"],
    "nbh": ["directed at nobody here", "00000000000010100001000"],
    "nsb": ["not subtweeting", "100010100000000"],
    "sx": ["sexual intent", "1010000000000"],
    "nsx": ["non-sexual intent", "10001010000000000"],
    "rh": ["rhetorical question", "1100000000000000000"],
    "t": ["teasing", "1000000"],
    "ij": ["inside joke", "10000001000"],
    "m": ["metaphorically", "10000000000000"],
    "li": ["literally", "110000000"],
    "hyp": ["hyperbole", "111000000"],
    "f": ["fake", "1000"],
    "th": ["threat", "110000"],
    "cb": ["clickbait", "100001000"]
  }