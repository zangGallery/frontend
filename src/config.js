const config = {
    contractAddresses: {
        v1: {
            zang: "0xdCaDd503b7b444F5196d1B63A383a24ADAd4A42e",
            marketplace: "0x28336f2397B6f8038b27EE32C5Abd618c94440B1",
        },
    },
    firstBlocks: {
        v1: {
            zang: 467700,
            marketplace: 467700,
        },
    },
    networks: {
        main: {
            name: "Vinu",
            chainId: 206,
        },
        ens: {
            name: "ENS",
            chainId: 1,
        },
    },
    rpc: "https://vinufoundation-rpc.com",
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
        name: "VinuScan",
        url: "https://testnet.vinuscan.com",
    },
};

export default config;
