import React from "react";

export default function TypeTag ({ type, isUri }) {
    if (!type) {
        return <></>;
    }

    if (isUri) {
        type = type.split(',')[0].split(':')[1];
    }

    if (type == 'text/plain') {
        return <span class="tag is-info">plaintext</span>;
    } else if (type == 'text/markdown') {
        return <span class="tag is-link">markdown</span>;
    } else {
        return <span class="tag is-danger">unknown</span>;
    }
}
