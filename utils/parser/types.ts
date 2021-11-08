interface RawMessage {
system: boolean;
msg: string;
}

interface Attachment {
/**
 * The filename of the attachment, including the extension.
 */
fileName: string;
}

interface ParseStringOptions {
    /**
     * Specify if the dates in your log file start with a day (`true`) or a month
     * (`false`).
     *
     * Manually specifying this may improve performance.
     */
    daysFirst?: boolean | null;
    /**
     * Specify if attachments should be parsed.
     *
     * If set to `true`, messages containing attachments will include an
     * `attachment` property.
     */
    parseAttachments?: boolean;
}

export type { RawMessage, Attachment, ParseStringOptions };