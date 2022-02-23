import { atom } from 'recoil'

const standardErrorState = atom({
    key: 'standardError',
    default: null
});

export {
    standardErrorState
}