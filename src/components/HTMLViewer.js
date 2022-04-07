import React from "react";
import {createElement, Fragment, useState, useRef} from "react";
import SplitPane from "react-split-pane";
import {unified} from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeReact from 'rehype-react'
import rehypeSanitize from "rehype-sanitize";
import { schemas } from "../common";
import rehypeStringify from "rehype-stringify/lib";


export default function HTMLViewer({ source }) {
    const [height, setHeight] = useState('0px');
    const ref = React.useRef();

    const PADDING = 1.25 // rem

    const convertRemToPixels = (rem) => {    
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    const onLoad = () => {
        setHeight((parseFloat(ref.current.contentWindow.document.body.scrollHeight) + convertRemToPixels(PADDING*2)) + "px");
      };

    const sanitize = (html) => {
        const sanitized = unified()
            .use(rehypeParse, {fragment: true})
            .use(rehypeReact, {createElement, Fragment})
            .use(rehypeSanitize, schemas.validHTML)
            .use(rehypeStringify)
            .processSync(html)
        console.log(sanitized.value)
        return sanitized.value;
    }
    console.log('Source:', source)

    return (
        <iframe 
            ref={ref}
            onLoad={onLoad}
            height={height}
            style={{width: "100%", overflow: 'auto'}}
            srcDoc={sanitize(source)}
            sandbox
        />
    )
}