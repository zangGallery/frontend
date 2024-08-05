import ZangNFT from "../abis/ZangNFT.json";
import Marketplace from "../abis/Marketplace.json";

const v1Zang = ZangNFT.abi;

const v1Marketplace = Marketplace.abi;

const v1 = {
    zang: v1Zang,
    marketplace: v1Marketplace,
};

export { v1 };
