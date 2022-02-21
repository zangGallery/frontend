import React from "react";
import { RecoilRoot } from "recoil";
import Wrapper from "../Wrapper";

const wrapPageElement = ({ element, props }) => {
    return (
        <RecoilRoot {...props}>
            <Wrapper {...props}>
                {element}
            </Wrapper>
        </RecoilRoot>
    );
}

export {
    wrapPageElement
}