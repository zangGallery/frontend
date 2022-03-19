import { atom } from 'recoil'

const standardErrorState = atom({
    key: 'standardError',
    default: null
});

const isTokenExistenceError = (e) => {
    // Each wallet formats errors differently, so we need a general method
    const stringified = JSON.stringify(e);
    return stringified.includes('ZangNFT') && stringified.includes('query for nonexistent token');
}

const formatError = (e) => {
    if (e.message) {
        if (e.message == 'Internal JSON-RPC error.' && e.data?.message) {
            return 'Internal JSON-RPC error: ' + e.data.message + '.';
        }

        return e.message;
    }
    return 'Unknown error.'
}

export {
    formatError,
    isTokenExistenceError,
    standardErrorState
}