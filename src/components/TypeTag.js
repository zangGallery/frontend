import React from "react";

export default function TypeTag({ type, isUri }) {
    if (!type) {
        return <></>;
    }

    if (isUri) {
        type = type.split(",")[0].split(":")[1];
    }

    if (type == "text/plain") {
        return <span className="tag is-info">plaintext</span>;
    } else if (type == "text/markdown") {
        return <span className="tag is-link">markdown</span>;
    } else if (type == 'text/html') {
        return <span className="tag is-warning">HTML</span>;
    } else {
        return <span className="tag is-danger">unknown</span>;
    }
}
