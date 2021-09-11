import { useState, useEffect } from "react";

var _provider = null;
var _listeners = [];

const useProvider = () => {
    const [, updateState] = useState();
    useEffect(() => {
        const forceUpdate = () => updateState({});
        _listeners.push(forceUpdate);
    }, [])
    const setProvider = (newProvider) => {
        _provider = newProvider
        for (const listener of _listeners) {
            listener();
        }
    }
    return [
        _provider,
        setProvider
    ]
}

export {
    useProvider
}