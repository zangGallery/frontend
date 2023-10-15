const config = {
    contractAddresses: {
        v1: {
            zang: "0x5541ff300e9b01176b953EA3153006e36D4BA273",
            marketplace: "0xbD5C4612084eA90847DeB475529aC74B3521498d",
        },
    },
    firstBlocks: {
        v1: {
            polygon: {
                zang: 25361905,
                marketplace: 25362269,
            },
            base: {
                zang: 5299416,
                marketplace: 5299416,
            },
        },
    },
    networks: {
        main: {
            name: "Base",
            chainId: 8453,
            rpc:
                "https://base-mainnet.g.alchemy.com/v2/" +
                process.env.GATSBY_ALCHEMY_API_KEY,
        },
        ens: {
            name: "ENS",
            chainId: 1,
        },
    },
    api_keys: {
        alchemy: process.env.GATSBY_ALCHEMY_API_KEY,
        alchemy_mainnet: process.env.GATSBY_ALCHEMY_MAINNET_API_KEY,
        infura: {
            project_id: "0781eeb9a06842599941233024a4218c",
        },
    },
    ens: {
        cacheExpiration: 1000 * 60 * 2, // 2 minutes
    },
    blockExplorer: {
        name: "BaseScan",
        url: "https://basescan.org",
    },
};

export default config;
