import React from "react";
import rehypeSanitize from "rehype-sanitize";

import MDEditor from "@uiw/react-md-editor"
import { defaultCommands } from "../common/commands"

export default function MultiEditor({textType, value, setValue}) {
    return (
        <div>
            { textType == 'text/markdown' ? 
                <MDEditor value={value} onChange={setValue} highlightEnable={false} previewOptions={{ rehypePlugins : [rehypeSanitize] }} commands={defaultCommands} /> :
                <textarea className="textarea" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Content of your artwork"></textarea>
            }
                
            
        </div>
    )
}