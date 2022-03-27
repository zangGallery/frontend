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

export { getWalletAddress, shortenAddress };
