import classnames from "classnames";
import moment from "moment";
import React from "react";
import ReactMarkdown from "react-markdown";
import { TonalMessage } from "../../utils/TonalMessage";
import { Tone } from "./Tone";

interface BubbleProps {
  messages: TonalMessage[];
  color: string;
  isActiveUser: boolean;
}

export function Bubble({ messages, color, isActiveUser }: BubbleProps) {
  const lastMessage = messages.at(-1)!
  const utcDateTime = lastMessage.date.toISOString().slice(0, 19).replace('T', ' ');
  
  return (
    <li className={classnames(
      "flex m-3 border-t-md",
      isActiveUser ? "flex-row-reverse" : "flex-row",
      isActiveUser ? "text-right" : "text-left")}>
        <img
          className="flex-none w-8 h-8 bg-gray-500 rounded-full mx-3 my-1"
          style={{ backgroundColor: color }}
        />
        <div className={classnames(
          "flex flex-col", 
          isActiveUser ? "items-end" : "items-start"
        )} style={{ color: color }}>
          <div className="flex items-baseline">
            <div className="text-sm mx-1">{lastMessage.author}</div>
            <time dateTime={utcDateTime} className="text-xs text-gray-400">{moment(lastMessage.date).fromNow()}</time>
          </div>
            {messages.map((message, idx) => (
              <div key={idx} className="flex items-center">
                <div className="bg-gray-100 py-3 pl-3 pr-2 my-1 ml-1 w-fit text-xs text-gray-500">
                  <ReactMarkdown>
                  {message.message}
                  </ReactMarkdown>
                </div>
                <div className="mr-1" style={{
                  height: "calc(100% - 0.5rem)",
                  width: "1rem",
                  background: "linear-gradient(to bottom right, rgba(243, 244, 246) 50%, transparent 0)",
                }}/>
                <Tone tone={message.tone}/>
              </div>   
            ))}
        </div>
    </li>
  )
}