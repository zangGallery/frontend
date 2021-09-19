import React from "react";
import { RoutingLink, WalletButton } from ".";

export default function Header() {
<<<<<<< HEAD
    const [provider, setProvider] = useProvider()
    const [isActive, setActive] = React.useState(false)
    
    function toggleClass() {
        setActive(!isActive);
        console.log(isActive);
    }

=======
>>>>>>> ed89cf62212077430cc929a25d84485ce6ac5bfe
    return (
        <nav className="navbar" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <a className="navbar-item" href=".">
                    <h1 className="title">{".zang{"}</h1>
                </a>

<<<<<<< HEAD
            <a role="button" className={"navbar-burger" + (isActive ? " is-active" : "")} onClick={toggleClass} aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </a>
            </div>

            <div id="navbarBasicExample" className={"navbar-menu" + (isActive ? " is-active" : "")} >
            <div className="navbar-start">
                <RoutingLink href='/' className="navbar-item">
                    Home
                </RoutingLink>
=======
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
>>>>>>> ed89cf62212077430cc929a25d84485ce6ac5bfe

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