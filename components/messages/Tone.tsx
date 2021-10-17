import classnames from "classnames";
import { useState } from "react";
import { TONES } from "../../utils/TonalMessage"

import styles from "./Tone.module.css"

interface ToneProps {
    tone?: string;
}

function get<T>(object: Record<string, T>, key: string | undefined, defaultValue: T | undefined = undefined): T | undefined {
    if (key && Object.keys(object).includes(key)) {
        return object[key]
    }
    return defaultValue
}

export function Tone({ tone }: ToneProps) {
    const [title, mask] = get(TONES, tone) ?? ["?", "1"]
    const [hidden, setHidden] = useState<Boolean>(true);
    return (
        <button className="text-gray-300 hover:text-gray-500 text-xl font-bold" onClick={() => setHidden((v) => {console.log("h", v); return !v})}>
            <abbr title={title} className={classnames(styles.tone, hidden && styles.shortened)}>{title.split('').map((char, idx) => {
                const shouldMask = mask[idx] == "0"
                return <span key={idx} className={classnames(shouldMask && styles.ghost)}>{char == " " ? '\u00A0' : char}</span>
            })}</abbr>
        </button>
    )
}