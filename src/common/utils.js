import { ethers } from "ethers";
import config from "../config";

const getWalletAddress = async (provider) => {
    const signer = provider?.getSigner();
    if (signer) {
        return await signer.getAddress();
    } else {
        return null;
    }
};

const shortenAddress = (address, nChar) => {
    return (
        address.substring(0, nChar + 2) +
        "..." +
        address.substring(address.length - nChar)
    );
};

function parseTokenAmount(amount, tokenId) {
    const token = config.tokens[tokenId];

    return ethers.utils.parseUnits(amount, token.decimals);
}

function formatTokenAmount(amount, tokenId) {
    const token = config.tokens[tokenId];

    if (token === undefined) {
        throw new Error(`Token ${tokenId} not found in config.`);
    }

    return ethers.utils.formatUnits(amount, token.decimals);
}

export {
    getWalletAddress,
    shortenAddress,
    parseTokenAmount,
    formatTokenAmount,
};
