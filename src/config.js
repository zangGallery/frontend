const config = {
    contractAddresses: {
        v1: {
            zang: '0x62d76F41c4d538712A4404e39b2E20BA7d18FEd0',
            marketplace: '0x59E52c8aB048022307ab4A92557a138f10a19d97'
        }
    },
    networks: {
        main: {
            name: 'Polygon',
            chainId: 137
        },
        ens: {
            name: 'ENS',
            chainId: 1
        }
    },
    api_keys: {
        alchemy: process.env.GATSBY_ALCHEMY_API_KEY,
        alchemy_mainnet: process.env.GATSBY_ALCHEMY_MAINNET_API_KEY,
        infura: {
            project_id: '0781eeb9a06842599941233024a4218c'
        }
    },
    ens: {
        cacheExpiration: 1000 * 60 * 2 // 2 minutes
    },
    blockExplorer: {
        name: 'PolygonScan',
        url: 'https://polygonscan.com'
    }
}

export default config;