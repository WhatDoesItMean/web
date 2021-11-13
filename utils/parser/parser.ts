import { daysBeforeMonths, normalizeDate, orderDateComponents } from './date';
import {
  regexSplitTime,
  convertTime12to24,
  normalizeAMPM,
  normalizeTime,
} from './time';
import { Attachment, RawMessage, ParseStringOptions } from './types';
import { TonalMessage, TONES } from "../TonalMessage";


const TEXT_DIRECTION = "(?:\\u200E|\\u200F)*"
const DATE = "\\d{1,4}[/.\-] ?\\d{1,4}[/.\-] ?\\d{1,4}"
const DATE_TIME_SEPARATOR = "[,.]? \D*?"
const TIME = "\\d{1,2}[.:]\\d{1,2}(?:[.:]\\d{1,2})?"
const AM_PM = "[ap]\\.?\\s?m\\.?"

const MESSAGE_SEPARATOR = "(?: \-|:)? ?"
const NAME = "(.+?):"
const TEXT = "([^]*)"

const DATE_TIME_EXTRACTOR = `(${DATE})${DATE_TIME_SEPARATOR}(${TIME})((?: ${AM_PM})?)`
const TIME_DATE_EXTRACTOR = `(${TIME})((?: ${AM_PM})?)${DATE_TIME_SEPARATOR}(${DATE})`


const DATE_OR_TIME = `(?:${DATE}${DATE_TIME_SEPARATOR}${TIME}(?: ${AM_PM})?)|(?:${TIME}(?: ${AM_PM})?${DATE_TIME_SEPARATOR}${DATE})`
const MESSAGE_START = `${TEXT_DIRECTION}\\[?((?:${DATE_OR_TIME})?)\\]?`

const SYSTEM = `^${MESSAGE_START}${MESSAGE_SEPARATOR}${TEXT}`
const MESSAGE = `^${MESSAGE_START}${MESSAGE_SEPARATOR}${NAME} ${TEXT}`

const regexSystem = RegExp(SYSTEM, 'i')
const regexMessage = RegExp(MESSAGE, 'i')

const regexDateTime = RegExp(DATE_TIME_EXTRACTOR, 'i');
const regexTimeDate = RegExp(TIME_DATE_EXTRACTOR, 'i');

const TONE_LIST = Object.keys(TONES).join('|')
const TEXT_WITH_1TONE = `([^]*?)\\s+/(${TONE_LIST})\\s*$`

const regexTone = RegExp(TEXT_WITH_1TONE)

const regexAttachment = /<.+:(.+)>|([A-Z\d-]+\.\w+)\s\(.+\)/;

/**
 * Takes an array of lines and detects the lines that are part of a previous
 * message (multiline messages) and merges them.
 *
 * It also labels messages without an author as system messages.
 */
function makeArrayOfMessages(lines: string[]): RawMessage[] {
  return lines.reduce((acc: RawMessage[], line) => {
    /*
     * If the line doesn't match the regex it's probably part of the previous
     * message or a "WhatsApp event"
     */
    if (!regexMessage.test(line)) {
      /*
       * If it doesn't match the first regex but still matches the system regex
       * it should be considered a "WhatsApp event" so it gets labeled "system"
       */
      if (regexSystem.test(line)) {
        acc.push({ system: true, msg: line });
      }

      // Else it's part of the previous message and it should be concatenated
      else if (typeof acc[acc.length - 1] !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prevMessage = acc.pop()!;

        acc.push({
          system: prevMessage.system,
          msg: `${prevMessage.msg}\n${line}`,
        });
      }
    } else {
      acc.push({ system: false, msg: line });
    }

    return acc;
  }, []);
}

/**
 * Parses a message extracting the attachment if it's present.
 */
function parseMessageAttachment(message: string): Attachment | null {
  const attachmentMatch = message.match(regexAttachment);

  if (!attachmentMatch) return null;
  return {
    fileName: (attachmentMatch[1] || attachmentMatch[2]).trim(),
  };
}

function extractTone<T>(messages: (T & { message: string })[]) {
  return messages.map(msg => {

    if (!regexTone.test(msg.message)) {
      return msg;
    }
    
    const [, message, tone] = regexTone.exec(msg.message)!;

    return {
      ...msg,
      message,
      tone,
    }
  })
}

function interpolateDateTimes<T>(messages: (T & { dateTime: string })[]) {
  let lastDateTime = new Date().toLocaleString();
  return messages.slice(0).reverse().map(msg => {
      if (msg.dateTime.length > 0) {
        lastDateTime = msg.dateTime; 
        return msg
      }

      return {
        ...msg,
        dateTime: lastDateTime,
      };
  }).reverse();    
}

interface ParsedMessageBeforeDateTimeSeparation {
  dateTime: string;
  author: string;
  message: string;
  tone?: string;
}

interface ParsedMessage {
  author: string;
  message: string;
  date: string;
  time: string;
  tone?: string;
  ampm?: string;
}


/**
 * Parses and array of raw messages into an array of structured objects.
 */
function parseMessages(
  messages: RawMessage[],
  options: ParseStringOptions = {},
): TonalMessage[] {
  let { daysFirst } = options;
  const { parseAttachments } = options;

  // Parse messages with regex
  const parsed: ParsedMessageBeforeDateTimeSeparation[] = messages.map(obj => {
    const { system, msg } = obj;

    // If it's a system message another regex should be used to parse it
    if (system) {
      const [, dateTime, message] = regexSystem.exec(
        msg,
      ) as RegExpExecArray;

      return { dateTime, author: 'System', message };
    }

    const [, dateTime, author, message] = regexMessage.exec(
      msg,
    ) as RegExpExecArray;

    return { dateTime, author, message };
  });

  // Extract tone if present
  const withTone: ParsedMessageBeforeDateTimeSeparation[] = extractTone<ParsedMessageBeforeDateTimeSeparation>(parsed);

  // Interpolate dateTime
  const nonNullDateTimes: ParsedMessageBeforeDateTimeSeparation[] = interpolateDateTimes<ParsedMessageBeforeDateTimeSeparation>(withTone)

  const separatedDateTime: ParsedMessage[] = nonNullDateTimes.map(obj => {
    const { dateTime } = obj;
    let date = ''
    let time = ''
    let ampm = undefined

    if (regexTimeDate.test(dateTime)) {
      [, time, ampm, date] = regexTimeDate.exec(
        dateTime,
      ) as RegExpExecArray;
    }
    else if (regexDateTime.test(dateTime)) {
      [, date, time, ampm] = regexDateTime.exec(
        dateTime,
      ) as RegExpExecArray;
    }

    return {
      message: obj.message,
      author: obj.author,
      tone: obj.tone,
      date,
      time,
      ampm,
    }
  })

  // Understand date format if not supplied (do days come first?)
  if (typeof daysFirst !== 'boolean') {
    const numericDates = Array.from(
      new Set(separatedDateTime.map(({ date }) => date)),
      date => orderDateComponents(date).map(Number),
    );

    daysFirst = daysBeforeMonths(numericDates);
  }

  // Convert date and time in a `Date` object, return the final object
  return separatedDateTime.map(obj => {
    const { date, time, ampm, author, message } = obj
    let day: string;
    let month: string;
    let year: string;
    const splitDate = orderDateComponents(date);

    if (daysFirst === false) {
      [month, day, year] = splitDate;
    } else {
      [day, month, year] = splitDate;
    }

    [year, month, day] = normalizeDate(year, month, day);

    const [hours, minutes, seconds] = normalizeTime(
      ampm ? convertTime12to24(time, normalizeAMPM(ampm)) : time,
    ).split(regexSplitTime);

    const dateTime = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);

    const finalObject: TonalMessage = {
      ...obj,
      date: dateTime,
      author,
      message,
    };

    // Optionally parse attachments
    if (parseAttachments) {
      const attachment = parseMessageAttachment(message);
      if (attachment) finalObject.attachment = attachment;
    }

    return finalObject;
  });
}

export { makeArrayOfMessages, parseMessages };