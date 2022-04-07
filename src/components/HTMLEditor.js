import React from "react";
import {createElement, Fragment, useState} from "react";
import {Split} from "@geoffcox/react-splitter"
import HTMLViewer from "./HTMLViewer";


export default function HTMLEditor({value, setValue}) {
    if (typeof window !== 'undefined') {
        const AceEditor = require('react-ace').default;
        require('ace-builds/src-noconflict/mode-html');
        require('ace-builds/src-noconflict/theme-github');
        require('ace-builds/src-noconflict/theme-monokai')

        return (
            <>
                <div className="Resizer" style={{height: "500px"}}>
                    <Split vertical onSplitChanged={() => window.dispatchEvent(new Event('resize'))}>
                        <div>
                            <AceEditor
                                mode="html"
                                theme="monokai"
                                onChange={setValue}
                                name="html-editor"
                                editorProps={{ $blockScrolling: false }}
                                setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true
                                }}
                                width="100%"
                            />
                        </div>
                        <div style={{height: '100%', overflow: 'scroll'}}>
                            <HTMLViewer source={value}/>
                        </div>
                    </Split>
                </div>
                <article className="message is-info is-small mt-2">
                    <div class="message-body">
                        <p><strong>Note</strong>: Most HTML tags are supported, with the notable exception of <tt>{'<script>'}</tt>. A full list of the allowed tags will be released soon.</p>
                    </div>
                </article>
            </>
        )
      }
    return null;
}