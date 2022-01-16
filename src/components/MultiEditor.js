import React from "react";
import rehypeSanitize from "rehype-sanitize";

import MDEditor from "@uiw/react-md-editor"
import { defaultCommands } from "../common/commands"

const styles = {
    link: {
        textDecoration: 'underline'
    },
    plainEditor: {
        fontFamily: 'monospace'
    }
}

export default function MultiEditor({textType, value, setValue}) {
    return (
        <div>
            { textType == 'text/markdown' ? 
                (
                    <div>
                        <MDEditor value={value} onChange={setValue} highlightEnable={false} previewOptions={{ rehypePlugins : [rehypeSanitize] }} commands={defaultCommands} />
                        <article className="message is-info is-small mt-2">
                            <div class="message-body">
                            <p>For help regarding Markdown, see the{' '}
                            <a style={styles.link} target="_blank" rel="noopener noreferrer" href="https://docs.github.com/en/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax">GitHub Flavored Markdown guide</a>
                            {' '}and the <a style={styles.link} target="_blank" rel="noopener noreferrer" href="https://github.github.com/gfm/">official spec</a>.</p>
                            </div>
                        </article>
                    </div>
                ):
                <textarea style={styles.plainEditor} className="textarea" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Content of your artwork"></textarea>
            }
        </div>
    )
}