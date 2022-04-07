import React from "react";
import {createElement, Fragment, useState} from "react";
import SplitPane from "react-split-pane";
import {unified} from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeReact from 'rehype-react'
import rehypeSanitize from "rehype-sanitize";
import { schemas } from "../common";
import rehypeStringify from "rehype-stringify/lib";


export default function HTMLEditor({ source }) {
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
        <iframe style={{width: "100%", height: "400px"}} srcDoc={sanitize(source)} sandbox/>
    )
}