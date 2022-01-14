const config = {
    contractAddresses: {
        v1: {
            zang: '0x2b9c603b830dea1df286f7b5deaa96a024aa6ab5',
            marketplace: '0xD0F0B404B01d0A183655047f2dD1559d611c35d7'
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