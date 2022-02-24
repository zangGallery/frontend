const config = {
    contractAddresses: {
        v1: {
            zang: '0xf2a7f0eb7fda1242e5188c8696e23ba7b70c9a4f',
            marketplace: '0x964b8697Aa9F6d404144261FE83D7b923eBa08D3'
        }
    },
    networks: {
        external: 'ropsten',
        internal: 'http://localhost:8545'
    },
    api_keys: {
        alchemy: process.env.GATSBY_ALCHEMY_API_KEY,
        infura: {
            project_id: '0781eeb9a06842599941233024a4218c'
        }
    },
    ens: {
        cacheExpiration: 1000 * 60 * 2 // 2 minutes
    }
}

export default config;