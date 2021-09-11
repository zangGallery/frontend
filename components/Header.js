import React from "react";
import { RoutingLink, WalletButton } from ".";
import PromiseLoader from "./PromiseLoader";
import { getWalletAddress } from "../common/utils"
import { useProvider } from "../common/provider";

export default function Header() {
    const [provider, setProvider] = useProvider()

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
                    {provider ? <></> : <WalletButton />}
                </div>
            </div>
                <PromiseLoader promise={() => getWalletAddress(provider)} deps={[provider]}
                    render={(user) => (
                        user ? <h4 className="title is-4 has-text-centered">Welcome {user}!</h4> : <h4 className="title is-4 has-text-centered">Not Connected</h4>
                    )}
                    loading={<h4 className="title is-4 has-text-centered">Loading...</h4>}
                    error = {(error) => {console.log(error); return <p>{error.message}</p>}}/>
            </div>
        </nav>
    )
}