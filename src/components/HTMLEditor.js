import React from "react";
import { useState } from "react";

export default function HTMLEditor() {
    const [content, setContent] = useState('');
    if (typeof window !== 'undefined') {
        const AceEditor = require('react-ace').default;
        require('ace-builds/src-noconflict/mode-html');
        require('ace-builds/src-noconflict/theme-github');
    
        return (<AceEditor
            mode="html"
            theme="github"
            onChange={setContent}
            name="html-editor"
            editorProps={{ $blockScrolling: true }}
            setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true
            }}
        />);
      }
    return null;
}