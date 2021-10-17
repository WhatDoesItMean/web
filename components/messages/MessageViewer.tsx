import React, { useMemo } from "react";
import type { Message } from "whatsapp-chat-parser/types/types";
import { Bubble } from "./Bubble";

interface MessageViewerProps {
    activeUser: string;
    messages: Message[];
    participants: string[];
}

const AUTHOR_COLORS = [
    '#1f7aec',
    '#fe7c7f',
    '#6bcbef',
    '#fc644b',
    '#35cd96',
    '#e542a3',
    '#91ab01',
    '#ba33dc',
    '#ffa97a',
    '#029d00',
    '#dfb610',
  ];

interface ColourMap {
    [participant: string]: string
}

export function MessageViewer({ activeUser, messages, participants }: MessageViewerProps) {
    const colorMap: ColourMap = participants.reduce(
        (obj, participant, i) => ({
          ...obj,
          [participant]: AUTHOR_COLORS[i % AUTHOR_COLORS.length],
        }),
        {},
      );
    
    const groupedMessages = useMemo(() => messages.reduce<Message[][]>(
        (groupedMessages, message, i) => {
            if (message.author == "System") {
                return groupedMessages
            }
            
            const lastMessage = groupedMessages.at(-1)?.at(-1)
            if (!lastMessage) {
                groupedMessages.push([message])
                return groupedMessages
            }
            const hoursBetween = Math.abs(lastMessage.date.getUTCHours() - message.date.getUTCHours())
            const sameBlock = lastMessage?.author == message.author && hoursBetween < 2
            if (sameBlock) {
                groupedMessages.at(-1)?.push(message)
            } else {
                groupedMessages.push([message])
            }
            
            return groupedMessages
        },
        []
    ), [messages])

    return (
        <div className="flex w-full flex-col">
            {groupedMessages.map((messages, i) => {
          const message = messages.at(0)!

          return (
            <Bubble
              key={i}
              messages={messages}
              color={colorMap[message.author]}
              isActiveUser={activeUser === message.author}
            />
          );
        })}
        </div>
    );
}