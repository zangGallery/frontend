import React from "react";
import { useRouter } from "next/router";

export default function RoutingLink( {href, children, ...props}) {
    const router = useRouter()

    const handleClick = (e) => {
        e.preventDefault()
        router.push(href)
    }

    return (
    <a href={href} onClick={handleClick} {...props}>
        {children}
    </a>)
}