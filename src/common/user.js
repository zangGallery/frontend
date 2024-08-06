import { atom } from "recoil";
import config from "../config";
import { ethers } from "ethers";

const tokenAllowancesState = atom({
    key: "tokenAllowances",
    default: {},
});

async function getTokenAllowances(walletAddress, readProvider) {
    if (!walletAddress || !readProvider) return;

    const newAllowances = {};

    for (const [tokenId, tokenInfo] of Object.entries(config.tokens)) {
        const tokenContract = new ethers.Contract(
            tokenInfo.address,
            ["function allowance(address,address) view returns (uint256)"],
            readProvider
        );

        try {
            const allowance = await tokenContract.allowance(
                walletAddress,
                config.contractAddresses.v1.marketplace
            );
            console.log("Allowance for", tokenId, allowance.toString());
            newAllowances[tokenId] = allowance;
        } catch (e) {
            console.log(e);
        }
    }

    return newAllowances;
}

const tokenAddressToId = {};

for (const [tokenId, tokenInfo] of Object.entries(config.tokens)) {
    tokenAddressToId[ethers.utils.getAddress(tokenInfo.address)] = tokenId;
    tokenAddressToId[tokenInfo.address.toLowerCase()] = tokenId;
}

console.log("tokenAddressToId", tokenAddressToId);

export { tokenAllowancesState, getTokenAllowances, tokenAddressToId };
