import { useState, useEffect } from "react";
import { getDefaultProvider } from "ethers";
import config from "../config";

var _defaultReadProvider = getDefaultProvider(config.networks.external,
    {
        alchemy: config.api_keys.alchemy
    }
);

var _readProvider = _defaultReadProvider;
var _walletProvider = null;
var _readListeners = [];
var _writeListeners = [];

const _useComponentWillUnmount = (action) => {
    useEffect(() => {
        return () => {
            action();
        }
    }, [])
}

const _useForceUpdate = (listeners) => {
    const [, updateState] = useState();
    const [ownListener, setOwnListener] = useState(null);
    useEffect(() => {
        const forceUpdate = () => updateState({});
        setOwnListener(forceUpdate);
        listeners.push(forceUpdate);
    }, [])

    _useComponentWillUnmount(() => {
        const index = listeners.indexOf(ownListener);
        listeners.splice(index, 1);
    })

    return () => {
        for (const listener of listeners) {
            listener();
        }
    }
}

const useReadProvider = () => {
    const update = _useForceUpdate(_readListeners)
    const setReadProvider = (newProvider) => {
        _readProvider = newProvider;
        update();
    }
    return [
        _readProvider,
        setReadProvider
    ]
}

const useWalletProvider = () => {
    const update = _useForceUpdate(_writeListeners)

    const setWalletProvider = (newProvider) => {
        _walletProvider = newProvider;
        update();
    }

    return [_walletProvider, setWalletProvider];
}

const restoreDefaultReadProvider = () => {
    _readProvider = _defaultReadProvider;
    for (const listener of _readListeners) {
        listener();
    }
}

export {
    restoreDefaultReadProvider,
    useReadProvider,
    useWalletProvider
}