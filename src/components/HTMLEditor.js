import React from "react";
import {createElement, Fragment, useState} from "react";
import SplitPane from "react-split-pane";
import HTMLViewer from "./HTMLViewer";


export default function HTMLEditor({value, setValue}) {
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
                            onChange={setValue}
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
                        <HTMLViewer source={value}/>
                    </div>
                </SplitPane>
            </div>
        )
      }
    return null;
}