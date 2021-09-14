import { useState, useEffect } from "react";
import { getDefaultProvider } from "ethers";
import config from "../config";

var _defaultReadProvider = getDefaultProvider(config.networks.internal);

var _readProvider = _defaultReadProvider;
var _walletProvider = null;
var _readListeners = [];
var _writeListeners = [];

const _useForceUpdate = (listeners) => {
    const [, updateState] = useState();
    useEffect(() => {
        const forceUpdate = () => updateState({});
        listeners.push(forceUpdate);
    }, [])

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

export {
    useReadProvider,
    useWalletProvider
}