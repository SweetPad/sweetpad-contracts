// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
import "./interfaces/ISweetpadNFT.sol";

contract SweetpadNFTFreezing is ISweetpadNFTFreezing, Ownable {
    /// @notice Blocks per day for BSC
    uint256 private constant BLOCKS_PER_DAY = 28674;
    ISweetpadNFT public override nft;

    /// @notice NFT id -> frozen NFT data
    mapping(uint256 => NFTData) public override nftData;

    constructor(address _nft) {
        setSweetpadNFT(_nft);
    }

    function blocksPerDay() external pure override returns (uint256) {
        return BLOCKS_PER_DAY;
    }

    /**
     * @notice Return the tickets count for SweetpadNFT
     * @param nftId NFT ID for which you need to get the number of tickets
     */
    function getTicketsCountForNFT(uint256 nftId) external view override returns (uint256) {
        return nft.tierToBoost(nft.idToTier(nftId));
    }

    function setSweetpadNFT(address newNFT) public override onlyOwner {
        require(newNFT != address(0), "SweetpadNFTFreezing: NFT contract address can't be 0");
        nft = ISweetpadNFT(newNFT);
    }
}
