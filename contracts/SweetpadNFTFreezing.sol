// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
import "./interfaces/ISweetpadNFT.sol";

contract SweetpadNFTFreezing is ISweetpadNFTFreezing, Ownable {
    /// @notice Blocks per day for BSC
    uint256 public constant BLOCKS_PER_DAY = 28674;
    ISweetpadNFT public nft;

    struct NFTData {
        // Account that froze NFT
        address freezer;
        // block after which freezer can unfreeze NFT
        uint256 freezeEndBlock;
    }

    /// @notice NFT id -> frozen NFT data
    mapping(uint256 => NFTData) public nftData;

    constructor(address _nft) {
        setSweetpadNFT(_nft);
    }

    /**
     * @notice Return the tickets count for SweetpadNFT
     * @param nftId NFT ID for which you need to get the number of tickets
     */
    function getTicketsCountForNFT(uint256 nftId) public view override returns (uint256) {
        return nft.tierToBoost(nft.idToTier(nftId));
    }

    function setSweetpadNFT(address _nft) public override onlyOwner {
        require(_nft != address(0), "SweetpadNFTFreezing: NFT contract address can't be 0");
        nft = ISweetpadNFT(_nft);
    }
}
