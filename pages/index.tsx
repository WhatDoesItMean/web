import type { NextPage } from 'next'
import Head from 'next/head'
import React, { FormEventHandler, useMemo } from 'react'

import { parseString } from '../utils/parser';
import { MessageViewer } from '../components/messages/MessageViewer';
import { TonalMessage, TONES } from '../utils/TonalMessage';

const EXAMPLE_CHAT = `[{{DATE}}, {{HOUR}}:00:50] Messages to this group are now secured with end-to-end encryption.
[{{DATE}}, {{HOUR}}:00:50] Loris created group “WhatsApp Chat Parser Example”
[{{DATE}}, {{HOUR}}:00:50] Loris added Emily
[{{DATE}}, {{HOUR}}:00:50] Loris added John
[{{DATE}}, {{HOUR}}:01:53] John: Hey 👋
[{{DATE}}, {{HOUR}}:01:57] Loris: Welcome to the chat example!
[{{DATE}}, {{HOUR}}:02:07] John: Thanks
[{{DATE}}, {{HOUR}}:02:09] Loris: Is everybody here?
[{{DATE}}, {{HOUR}}:02:14] Emily: Yes
[{{DATE}}, {{HOUR}}:02:15] Loris: Good
[{{DATE}}, {{HOUR}}:02:40] Loris: I think we can start a fake conversation then 👍
[{{DATE}}, {{HOUR}}:02:45] Loris: I'd like to start with some features
[{{DATE}}, {{HOUR}}:03:07] Emily: Come on...
don't be so mysterious and show us!
[{{DATE}}, {{HOUR}}:04:04] John: 😍
[{{DATE}}, {{HOUR}}:04:18] Emily: Sounds good man, I like it! /pos
[{{DATE}}, {{HOUR}}:05:13] Emily: That's a nice feature.
[{{DATE}}, {{HOUR}}:06:25] Loris: Thanks 🙂 /gen
[{{DATE}}, {{HOUR}}:07:19] John: I like it too
[{{DATE}}, {{HOUR}}:07:21] Loris: Good
[{{DATE}}, {{HOUR}}:07:22] Loris: So, next would be an external link that you can click:
[{{DATE}}, {{HOUR}}:07:56] Loris: [https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
[{{DATE}}, {{HOUR}}:27:32] John: You bastard lol
[{{DATE}}, {{HOUR}}:27:49] John: I always fall for it
[{{DATE}}, {{HOUR}}:28:19] Emily: Hahaha yes you do xD
[{{DATE}}, {{HOUR}}:28:48] John: Anyway I love that song
[{{DATE}}, {{HOUR}}:29:23] John: So I'm not even mad
[{{DATE}}, {{HOUR}}:29:37] John: 😄
`

interface FormProps {
  onSubmit?: FormEventHandler<HTMLFormElement>
}

const Form: React.FC<FormProps> = ({ onSubmit }) => {
  const [defaultChat, setDefaultChat] = React.useState<string>()

  React.useEffect(() => {
    const isBeforeHalfPast = new Date().getMinutes() <= 30;
    const hourToUse = isBeforeHalfPast ? new Date().getHours() : new Date().getHours() - 1;
    const chat = EXAMPLE_CHAT.replaceAll("{{DATE}}", new Date().toLocaleDateString()).replaceAll("{{HOUR}}", `${hourToUse.toString().padStart(2, "0")}`)
    setDefaultChat(chat)
  }, [])

  return (
    <form onSubmit={onSubmit}>
      <label className="block text-left max-w-4xl mt-12 sm:w-full">
        <h3 className="text-2xl font-bold">Tell me what you're confused about &darr;</h3>
        <textarea id="messages" className="form-textarea p-6 mt-6 block w-full border rounded-xl hover:text-blue-600 focus:text-blue-600" defaultValue={defaultChat}/>
      </label>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold my-2 py-2 px-4 border border-blue-700 rounded">Analyse</button>
    </form>
  )
}

function linkify(messages: TonalMessage[]): TonalMessage[] {
  return messages.map((msg) => ({
    ...msg,
    message: msg.message.replaceAll(/(https?:.*(?=\s))/g, "[$1]($1)")
  }))
}

function tonify(messages: TonalMessage[]): TonalMessage[] {
  return messages.map((msg) => ({
    ...msg,
    tone: msg.tone ?? "..."
  }))
}

type Probabilities = {
  [tone in keyof typeof TONES]: number;
};

type Prediction = keyof typeof TONES;

function blendPrediction(messages: TonalMessage[], predictions: Prediction[]): TonalMessage[] {
  return messages.map((msg, idx) => {
    return {
      ...msg,
      tone: predictions[idx]
    }
  })
}

// Argmax version
// function blendProbabilities(messages: TonalMessage[], probabilities: Probabilities[]): TonalMessage[] {
//   return messages.map((msg, idx) => {
//     const toneProbabilities = probabilities[idx];
//     const argmaxProb = Object.keys(toneProbabilities).reduce((a, b) => toneProbabilities[a as keyof Probabilities] > toneProbabilities[b as keyof Probabilities] ? a : b)
//     return {
//       ...msg,
//       tone: argmaxProb,
//     }
//   })
// }

async function externalTonify(messages: TonalMessage[]): Promise<TonalMessage[]> {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages })
  };
  console.log(messages, process.env);
  return fetch(`https://${process.env.NEXT_PUBLIC_TONIFY_ENDPOINT}/analyze`, requestOptions)
      .then(response => response.json())
      .then(data => blendPrediction(messages, data))
      .catch((reason) => { console.error(reason); return messages });
}

const Home: NextPage = () => {
  const [messages, setMessages] = React.useState<TonalMessage[]>([])

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
    const messages =  parseString(text)
    .then(linkify)
    .then(tonify)

    messages.then(setMessages)

    messages.then(externalTonify)
      .then(setMessages)
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Tone Indicators</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center justify-center w-full flex-1 px-0 md:px-20 text-center">
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
