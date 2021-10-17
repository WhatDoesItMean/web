import type { NextPage } from 'next'
import Head from 'next/head'
import React, { FormEventHandler, useMemo } from 'react'

import { parseString } from 'whatsapp-chat-parser';
import type { Message } from "whatsapp-chat-parser/types/types";
import { MessageViewer } from '../components/messages/MessageViewer';
import { TonalMessage, TONES } from '../utils/TonalMessage';

const EXAMPLE_CHAT = `[20.06.19, 15:58:47] Messages to this group are now secured with end-to-end encryption.
[20.06.19, 15:58:47] Loris created group “WhatsApp Chat Parser Example”
[20.06.19, 15:58:47] Loris added Emily
[20.06.19, 15:58:47] Loris added John
[20.06.19, 15:58:53] John: Hey 👋
[20.06.19, 15:58:57] Loris: Welcome to the chat example!
[20.06.19, 15:59:07] John: Thanks
[20.06.19, 15:59:09] Loris: Is everybody here?
[20.06.19, 15:59:14] Emily: Yes
[20.06.19, 15:59:15] Loris: Good
[20.06.19, 15:59:40] Loris: I think we can start a fake conversation then 👍
[20.06.19, 15:59:45] Loris: I'd like to start with some features
[20.06.19, 15:59:50] Loris: First up: you can see images when you upload a .zip file that was exported with the "Attach media" option.
[20.06.19, 16:00:03] John: Really?
[20.06.19, 16:00:10] Loris: Yes! Let me show you:
[20.06.19, 16:00:15] Loris: <attached: 00000001-PHOTO-2019-06-20-16-00-15.jpg>
[20.06.19, 16:00:35] Emily: Cool
[20.06.19, 16:00:52] John: Can you share a video too?
[20.06.19, 16:01:18] Emily: I agree, that would be nice 🎥
[20.06.19, 16:01:40] Loris: Sure, here we go:
[20.06.19, 16:01:42] Loris: <attached: 00000002-VIDEO-2019-06-20-16-01-42.mp4>
[20.06.19, 16:01:47] John: So that's it?
[20.06.19, 16:03:04] Loris: I have more...
[20.06.19, 16:03:07] Emily: Come on...
don't be so mysterious and show us!
[20.06.19, 16:03:38] Loris: Ok, let me share an audio file then 🎵
[20.06.19, 16:03:55] Loris: <attached: 00000003-AUDIO-2019-06-20-16-03-55.mp3>
[20.06.19, 16:04:04] John: 😍
[20.06.19, 16:04:18] Emily: Sounds good man, I like it!
[20.06.19, 16:04:21] Loris: Cool, now I'd like to share another file,
this one is a file that is not an image/audio/video, so it becomes a link that you can download!
[20.06.19, 16:04:37] Loris: <attached: 00000004-whatsapp-chat-parser-example.zip>
[20.06.19, 16:04:44] Loris: (That's the old chat example BTW 👀)
[20.06.19, 16:04:52] Loris: Cool right? Whenever a file can't be reproduced via <img>, <video> or <audio> it becomes a link.
[20.06.19, 16:05:13] Emily: That's a nice feature.
[20.06.19, 16:06:25] Loris: Thanks 🙂
[20.06.19, 16:07:19] John: I like it too
[20.06.19, 16:07:21] Loris: Good
[20.06.19, 16:07:22] Loris: So, next would be an external link that you can click:
[20.06.19, 16:07:56] Loris: https://www.youtube.com/watch?v=dQw4w9WgXcQ
[20.06.19, 16:27:32] John: You bastard lol
[20.06.19, 16:27:49] John: I always fall for it
[20.06.19, 16:28:19] Emily: Hahaha yes you do xD
[20.06.19, 16:28:48] John: Anyway I love that song
[20.06.19, 16:29:23] John: So I'm not even mad
[20.06.19, 16:29:37] John: 😄
[20.06.19, 16:44:30] Loris: Well I guess that's it
[20.06.19, 16:44:45] Loris: Thanks for downloading this example
[20.06.19, 16:44:58] Loris: I hope you like whatsapp-chat-parser
[20.06.19, 16:45:08] Loris: If you feel extra nice, ⭐️ the repo.
[20.06.19, 16:45:18] Loris: If you feel SUPER extra nice you can donate via the "Sponsor" button on github. Thanks!
[20.06.19, 16:45:28] Loris: Links:
- https://github.com/Pustur/whatsapp-chat-parser
- https://github.com/Pustur/whatsapp-chat-parser-website
`

interface FormProps {
  onSubmit?: FormEventHandler<HTMLFormElement>
}

const Form: React.FC<FormProps> = ({ onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <label className="block text-left max-w-4xl mt-12 sm:w-full">
        <h3 className="text-2xl font-bold">Tell me what you're confused about &darr;</h3>
        <textarea id="messages" className="form-textarea p-6 mt-6 block w-full border rounded-xl hover:text-blue-600 focus:text-blue-600" defaultValue={EXAMPLE_CHAT}/>
      </label>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold my-2 py-2 px-4 border border-blue-700 rounded">Analyse</button>
    </form>
  )
}

function linkify(messages: Message[]): Message[] {
  return messages.map((msg) => ({
    ...msg,
    message: msg.message.replaceAll(/(https?:.*(?=\s))/g, "[$1]($1)")
  }))
}

function tonify(messages: Message[]): TonalMessage[] {
  const tones = Object.keys(TONES)
  return messages.map((msg, idx) => ({
    ...msg,
    tone: tones[idx % tones.length]
  }))
}

const Home: NextPage = () => {
  const [messages, setMessages] = React.useState<Message[]>([])

  const participants = useMemo(
    () =>
      Array.from(new Set(messages.map(({ author }) => author))).filter(
        author => author !== 'System',
      ),
    [messages],
  );

  const analyseMessage = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      messages: { value: string };
    };
    const text = target.messages.value

    parseString(text).then(linkify).then(tonify).then(setMessages)
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Tone Indicators</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to{' '}
          <a className="text-blue-600" href="https://toneindicators.carrd.co/#masterlist">
            Tone Indicators!
          </a>
        </h1>

        <Form onSubmit={analyseMessage} />
        <hr />
        <MessageViewer
          messages={messages}
          participants={participants}
          activeUser={participants[0]}
        />

      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
        <a
          className="flex items-center justify-center"
          href="https://mit.edu"
          target="_blank"
          rel="noopener noreferrer"
        >
          Made by AI@MIT
        </a>
      </footer>
    </div>
  )
}

export default Home
