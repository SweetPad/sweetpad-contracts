// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
import "./interfaces/ISweetpadNFT.sol";
import "./interfaces/ISweetpadTicket.sol";

contract SweetpadNFTFreezing is ISweetpadNFTFreezing, Ownable, ERC721Holder {
    /// @notice Blocks per day for BSC
    uint256 private constant BLOCKS_PER_DAY = 28674;
    ISweetpadNFT public override nft;
    ISweetpadTicket public override ticket;

    /// @notice NFT id -> frozen NFT data
    mapping(uint256 => NFTData) public override nftData;
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
    function freeze(uint256 nftId, uint256 freezePeriod) external override {
        (uint256 ticketsToMint, uint256 freezeEndBlock) = _freeze(nftId, freezePeriod);

        emit Frozen(msg.sender, nftId, freezeEndBlock, ticketsToMint);

        ticket.mint(msg.sender, nftId, ticketsToMint);
        nft.safeTransferFrom(msg.sender, address(this), nftId);
    }

    /**
     * @notice Freeze Sweetpad NFTs
     * @param nftIds: the ids of the NFT
     * @param freezePeriods: freezing periods in days
     */
    function freezeBatch(uint256[] calldata nftIds, uint256[] calldata freezePeriods) external override {
        require(nftIds.length == freezePeriods.length, "SweetpadNFTFreezing: Array lengths is not equal");

        uint256 len = nftIds.length;
        uint256[] memory ticketsToMintBatch = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            (uint256 ticketsToMint, uint256 freezeEndBlock) = _freeze(nftIds[i], freezePeriods[i]);
            ticketsToMintBatch[i] = ticketsToMint;

            emit Frozen(msg.sender, nftIds[i], freezeEndBlock, ticketsToMint);
        }

        ticket.mintBatch(msg.sender, nftIds, ticketsToMintBatch);
        nft.safeBatchTransferFrom(msg.sender, address(this), nftIds, "0x00");
    }

    /**
     * @notice Returnс NFTs froze by the user
     */
    function getNftsFrozeByUser(address user) external view override returns (uint256[] memory) {
        return userNFTs[user];
    }

    function setSweetpadNFT(address newNft) public override onlyOwner {
        require(newNft != address(0), "SweetpadNFTFreezing: NFT contract address can't be 0");
        nft = ISweetpadNFT(newNft);
    }

    function setSweetpadTicket(address newTicket) external override onlyOwner {
        require(newTicket != address(0), "SweetpadNFTFreezing: Ticket contract address can't be 0");
        ticket = ISweetpadTicket(newTicket);
    }

    function blocksPerDay() external pure override returns (uint256) {
        return BLOCKS_PER_DAY;
    }

    /**
     * @notice Return the tickets count for SweetpadNFT
     * @param nftId NFT ID for which you need to get the number of tickets
     */
    function getTicketsCountForNFT(uint256 nftId) public view override returns (uint256) {
        return nft.tierToBoost(nft.idToTier(nftId));
    }

    function _freeze(uint256 nftId, uint256 freezePeriod)
        private
        returns (uint256 ticketsToMint, uint256 freezeEndBlock)
    {
        require(freezePeriod >= 182, "SweetpadNFTFreezing: Freeze period must be greater than 182 days");

        ticketsToMint = freezePeriod >= 1095 ? getTicketsCountForNFT(nftId) * 2 : getTicketsCountForNFT(nftId);
        freezeEndBlock = freezePeriod * BLOCKS_PER_DAY + block.number;

        nftData[nftId] = NFTData({freezer: msg.sender, freezeStartBlock: block.number, freezeEndBlock: freezeEndBlock});

        userNFTs[msg.sender].push(nftId);
    }
}
