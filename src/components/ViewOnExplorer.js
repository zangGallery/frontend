import React from "react"

import config from "../config"

export default function ViewOnExplorer({ hash }) {
    return (
        <a className="is-underlined" href={config.blockExplorer.url + '/tx/' + hash} target="_blank" rel="noopener noreferrer">View on {config.blockExplorer.name}</a>
    )
}