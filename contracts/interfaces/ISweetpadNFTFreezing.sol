// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ISweetpadNFT.sol";

interface ISweetpadNFTFreezing {
    struct NFTData {
        // Account that froze NFT
        address freezer;
        // block after which freezer can unfreeze NFT
        uint256 freezeEndBlock;
    }

    function nftData(uint256) external view returns (address, uint256);

    function blocksPerDay() external view returns (uint256);

    function nft() external view returns (ISweetpadNFT);

    function getTicketsCountForNFT(uint256) external view returns (uint256);

    function setSweetpadNFT(address) external;
}