import React from "react";
import {createElement, Fragment, useState} from "react";
import SplitPane from "react-split-pane";
import {unified} from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeReact from 'rehype-react'
import rehypeSanitize from "rehype-sanitize";
import { schemas } from "../common";
import rehypeStringify from "rehype-stringify/lib";


export default function HTMLEditor() {
    const sanitize = (html) => {
        const sanitized = unified()
            .use(rehypeParse, {fragment: true})
            .use(rehypeReact, {createElement, Fragment})
            .use(rehypeSanitize, schemas.validHTML)
            .use(rehypeStringify)
            .processSync(html)
        console.log(sanitized)
        return sanitized.value;
    }
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
                        <iframe style={{width: "100%", height: "400px"}} srcDoc={sanitize(content)} />
                        
                    </div>
                </SplitPane>
            </div>
        )
      }
    return null;
}