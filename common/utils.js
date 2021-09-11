const getWalletAddress = async (provider) => {
    const signer = provider?.getSigner()
    if (signer) {
        return await signer.getAddress();
    }
    else {
        return null;
    }
}

export {
    getWalletAddress
}