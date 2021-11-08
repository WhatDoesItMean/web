import { TonalMessage } from '../TonalMessage';
import { makeArrayOfMessages, parseMessages } from './parser';
import { ParseStringOptions } from './types';

const newlinesRegex = /(?:\r\n|\r|\n)/;

/**
 * Parses a string containing a WhatsApp chat log.
 *
 * Returns a promise that will contain the parsed messages.
 *
 * @since 1.2.0
 */
export function parseString(
  string: string,
  options: ParseStringOptions = { parseAttachments: false },
): Promise<TonalMessage[]> {
  return Promise.resolve(string)
    .then(data => data.split(newlinesRegex))
    .then(makeArrayOfMessages)
    .then(messages => parseMessages(messages, options));
}