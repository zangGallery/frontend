import { ethers } from "ethers";
import { formatEther, parseUnits } from "@ethersproject/units";

const getListings = async (id, marketplaceContract) => {
    const listingCount = (await marketplaceContract.listingCount(id)).toNumber();

    const newListings = [];
    const promises = [];

    for (let i = 0; i < listingCount; i++) {
        promises.push(
            marketplaceContract
                .listings(id, i)
                .then((listing) =>
                    newListings.push({
                        amount: listing.amount.toNumber(),
                        price: formatEther(
                            parseUnits(listing.price.toString(), "wei")
                        ),
                        seller: listing.seller,
                        id: i,
                    })
                )
                .catch((e) => console.log(e))
        );
    }

    await Promise.all(promises);

    newListings.sort((a, b) => a.price - b.price);

    // If a listing has seller 0x0000... it has been delisted
    return newListings.filter((listing) => listing.seller !== ethers.constants.AddressZero);
};

export {
    getListings
}