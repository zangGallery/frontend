import React from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
    () => import("@uiw/react-md-editor").then((mod) => mod.default),
    { ssr: false }
  );

export default function MultiEditor({textType, value, setValue}) {
    return (
        <div>
            { textType == 'text/plain' ? 
              <textarea className="textarea" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Content of your artwork"></textarea>
              : <></>
            }
            <div style={{display : textType == 'text/markdown' ? 'block' : 'none'}}>
                <MDEditor value={value} onChange={setValue}/>
            </div>
        </div>
    )
}