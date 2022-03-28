import React from "react";
import { ReactDOM } from "react";
import { useState } from "react";
import SplitPane from "react-split-pane";
import htmr from 'htmr';
import sanitize from "sanitize-html";

export default function HTMLEditor() {
    const [content, setContent] = useState('');
    if (typeof window !== 'undefined') {
        const AceEditor = require('react-ace').default;
        require('ace-builds/src-noconflict/mode-html');
        require('ace-builds/src-noconflict/theme-github');

        return (
            <div className="Resizer" style={{height: "500px"}}>
                <SplitPane split="vertical" minSize={50} defaultSize={100}>
                    <div width="200px">
                        <AceEditor
                            mode="html"
                            theme="github"
                            onChange={setContent}
                            name="html-editor"
                            editorProps={{ $blockScrolling: false }}
                            setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true
                            }}
                            style={{width: "100%"}}
                        />
                    </div>
                    <div>
                        {htmr(content)}
                    </div>
                </SplitPane>
            </div>
        )
      }
    return null;
}