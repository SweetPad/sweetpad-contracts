// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
import "./interfaces/ISweetpadNFT.sol";
import "./interfaces/ISweetpadTicket.sol";

contract SweetpadNFTFreezing is ISweetpadNFTFreezing, Ownable, ERC721Holder {
    /// @notice Blocks per day for BSC
    uint256 public constant override BLOCKS_PER_DAY = 28674;
    ISweetpadNFT public override nft;
    ISweetpadTicket public override ticket;

    /// @notice NFT id -> frozen NFT data
    mapping(uint256 => NFTData) public nftData;
    /// @notice user address -> NFT id's freezed by user
    mapping(address => uint256[]) public userNFTs;

    constructor(address _nft) {
        setSweetpadNFT(_nft);
        // TODO add setSweetpadTicket function call after full ticket contract creation
    }

    /**
     * @notice Freeze Sweetpad NFT
     * @param nftId: the id of the NFT
     * @param freezePeriod: freezing period in days
     */
    function freeze(uint128 nftId, uint128 freezePeriod) external override {
        require(nft.ownerOf(nftId) == msg.sender, "SweetpadNFTFreezing: NFT not belong to user");
        require(freezePeriod >= 182, "SweetpadNFTFreezing: Freeze period must be greater than 182 days");

        nft.safeTransferFrom(msg.sender, address(this), nftId);

        NFTData storage _nftData = nftData[nftId];
        _nftData.freezer = msg.sender;
        _nftData.freezeEndBlock = freezePeriod * BLOCKS_PER_DAY + block.number;

        userNFTs[msg.sender].push(nftId);

        uint256 ticketsToMint = freezePeriod >= 1095 ? getTicketsCountForNFT(nftId) * 2 : getTicketsCountForNFT(nftId);
        ticket.mint(msg.sender, ticketsToMint);

        emit Frozen(msg.sender, nftId, _nftData.freezeEndBlock, ticketsToMint);
    }

    function setSweetpadNFT(address _nft) public override onlyOwner {
        require(_nft != address(0), "SweetpadNFTFreezing: NFT contract address can't be 0");
        nft = ISweetpadNFT(_nft);
    }

    function setSweetpadTicket(address _ticket) public override onlyOwner {
        require(_ticket != address(0), "SweetpadNFTFreezing: Ticket contract address can't be 0");
        ticket = ISweetpadTicket(_ticket);
    }

    /**
     * @notice Return the tickets count for SweetpadNFT
     * @param nftId NFT ID for which you need to get the number of tickets
     */
    function getTicketsCountForNFT(uint256 nftId) public view override returns (uint256) {
        return nft.tierToBoost(nft.idToTier(nftId));
    }

    /**
     * @notice Returnс NFTs froze by the user
     */
    function getNftsFrozeByUser(address user) external view override returns (uint256[] memory) {
        return userNFTs[user];
    }
}
