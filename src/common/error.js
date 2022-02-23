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

export {
    isTokenExistenceError,
    standardErrorState
}