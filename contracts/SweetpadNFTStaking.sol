// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./interfaces/ISweetpadNFTStaking.sol";
import "./SweetpadNFT.sol";

contract SweetpadNFTStaking is ISweetpadNFTStaking {
    uint256 public constant BLOCKS_PER_DAY = 28674;
    SweetpadNFT public nft;

    struct NFTData {
        address staker;
        uint256 freezeEndBlock;
    }

    mapping(address => uint256) public userTickets;
    mapping(uint256 => NFTData) public nftData;

    constructor(address _nft) {
        require(_nft != address(0), "NFT contract address can't be 0");
        nft = SweetpadNFT(_nft);
    }

    function getTicketsCountForNFT(uint256 nftId) public view override returns (uint256) {
        return nft.tierToBoost(nft.idToTier(nftId));
    }
}
