import React from "react";
import { navigate } from "gatsby-link";

export default function RoutingLink( {href, children, ...props}) {
    const handleClick = (e) => {
        e.preventDefault()
        navigate(href)
    }

    return (
    <a href={href} onClick={handleClick} {...props}>
        {children}
    </a>)
}