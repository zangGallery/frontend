import React from "react";
import { RoutingLink, WalletButton } from ".";

export default function Header() {
    return (
        <nav className="navbar" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <a className="navbar-item" href=".">
                    <h1 className="title">{".zang{"}</h1>
                </a>

                <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
                </div>

                <div id="navbarBasicExample" className="navbar-menu">
                <div className="navbar-start">
                    <RoutingLink href='/' className="navbar-item">
                        Home
                    </RoutingLink>

                    <RoutingLink href='/mint' className="navbar-item">
                        Mint
                    </RoutingLink>
                </div>

                <div className="navbar-end">
                    <div className="navbar-item">
                        <WalletButton />
                    </div>
                </div>
            </div>
        </nav>
    )
}