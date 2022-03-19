import React, { useEffect, useState } from "react";
import { RoutingLink, WalletButton } from ".";
import { useWalletProvider } from "../common/provider";
import config from "../config";

export default function Header() {
    const [isActive, setActive] = useState(false)
    const [walletProvider, setWalletProvider] = useWalletProvider();
    const [chainId, setChainId] = useState(null);

    useEffect(async () => {
        if (walletProvider) {
            const network = await walletProvider.getNetwork();

            const newChainId = network.chainId;

            if (chainId !== null && newChainId !== chainId) {
                // Chain ID changed. Following ethers.js recommednations, we
                // should reload the page
                window.location.reload();
            }

            setChainId(newChainId);
        }
    }, [walletProvider]);
    
    function toggleClass() {
        setActive(!isActive);
    }

    const styles = {
        navbarItem: {
            paddingTop: '0',
            height: '4rem'
        }
    }

    return (
        <div>
            <nav className="navbar" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    <RoutingLink className="navbar-item" href=".">
                        <h1 className="title pb-1" style={{height: '4rem'}}>{".zang{"}</h1>
                    </RoutingLink>

                <a role="button" className={"navbar-burger" + (isActive ? " is-active" : "")} onClick={toggleClass} aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
                </div>

                <div id="navbarBasicExample" className={"navbar-menu" + (isActive ? " is-active" : "")} >
                <div className="navbar-start">
                    <RoutingLink href='/' className="navbar-item is-size-5 has-text-weight-bold" style={styles.navbarItem}>
                        Home
                    </RoutingLink>

                    <RoutingLink href='/mint' className="navbar-item is-size-5 has-text-weight-bold" style={styles.navbarItem}>
                        Mint
                    </RoutingLink>

                    { walletProvider ? (
                        <RoutingLink href='/vault' className="navbar-item is-size-5 has-text-weight-bold" style={styles.navbarItem}>
                            Vault
                        </RoutingLink>
                    ) : null }
                </div>

                    <div className="navbar-end">
                        <div className="navbar-item">
                            <WalletButton />
                        </div>
                    </div>
                </div>
            </nav>
            {
                chainId !== null && chainId !== config.networks.main.chainId ? (
                    <div className="notification is-danger">
                        <p>Error: please switch to <strong>{config.networks.main.name}</strong>.</p>
                    </div>
                ) : null
            }
        </div>
    )
}