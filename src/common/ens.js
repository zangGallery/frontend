import { atom, useRecoilState } from 'recoil'
import config from '../config';
import { mainnetProvider } from "./provider"

const ensInfoState = atom({
    key: 'ensInfo',
    default: {}
});
const queriesState = atom({
    key: 'queries',
    default: []
});

const useEns = () => {
    const [ensInfo, setEnsInfo] = useRecoilState(ensInfoState)
    const [queries, setQueries] = useRecoilState(queriesState)

    const updateEns = async (address) => {
        setQueries([...queries, address]);

        const ensAddress = await mainnetProvider.lookupAddress(address);

        setEnsInfo((currentEnsInfo) => ({
            ...currentEnsInfo,
            [address]: {
                value: ensAddress,
                expiration: new Date(new Date().getTime() + config.ens.cacheExpiration)
            }
        }));

        setQueries((currentQueries) => currentQueries.filter(query => query !== address));

        return ensAddress;
    }

    const addressShouldBeUpdated = (address) => {
        return (!ensInfo[address] || new Date(ensInfo[address].expiration) < new Date()) && !queries.includes(address);
    }

    const invalidateEns = (address) => {
        setEnsInfo((currentEnsInfo) => ({
            ...currentEnsInfo,
            [address]: null
        }));
    }

    const lookupEns = (address) => {
        if (!address) return address;

        const update = addressShouldBeUpdated(address);

        if (update) {
            // Note: this doesn't block the function's execution
            updateEns(address);
        }

        return ensInfo[address]?.value;
    }

    const lookupEnsAsync = async (address, forceUpdate) => {
        if (!address) return address;

        if (forceUpdate) {
            invalidateEns(address);
        }

        // Note: we still need to check forceUpdate because React doesn't update state until the next render
        const update = addressShouldBeUpdated(address) || forceUpdate;
        let ensAddress = undefined;
        if (update) {
            ensAddress = await updateEns(address);
        } else {
            ensAddress = ensInfo[address]?.value;
        }

        return ensAddress;
    }

    return { lookupEns, lookupEnsAsync, invalidateEns };
}

export {
    useEns
}