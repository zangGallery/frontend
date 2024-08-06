const config = {
    contractAddresses: {
        v1: {
            zang: "0xdCaDd503b7b444F5196d1B63A383a24ADAd4A42e",
            marketplace: "0xF38778F9611F37b339410A55F9Df2940d9d6cBC7",
        },
    },
    firstBlocks: {
        v1: {
            zang: 467700,
            marketplace: 467700,
        },
    },
    nativeCurrency: {
        name: "VinuCoin",
        symbol: "VC",
        decimals: 18,
    },
    networks: {
        main: {
            name: "Vinu Testnet",
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
    tokens: {
        merc: {
            address: "0x6a219e51722df3d9882ef85dbf57720939974b5a",
            decimals: 18,
            symbol: "MERC",
            name: "Mock ERC20",
        },
    },
};

export default config;
