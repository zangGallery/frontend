import React from 'react';
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';

export default function StandardErrorDisplay () {
    const [standardError, _] = useRecoilState(standardErrorState);
    return standardError ? (
            <article class="message is-danger">
                <div class="message-body">
                    <strong>Error:</strong> {standardError}
                </div>
            </article>
    ) : <></>
}