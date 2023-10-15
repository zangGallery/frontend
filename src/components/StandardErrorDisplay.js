import React from "react";
import { useRecoilState } from "recoil";
import { standardErrorState } from "../common/error";

export default function StandardErrorDisplay() {
    const [standardError, _] = useRecoilState(standardErrorState);
    return standardError ? (
        <article className="message is-danger">
            <div className="message-body">
                <strong>Error:</strong> {standardError}
            </div>
        </article>
    ) : (
        <></>
    );
}
