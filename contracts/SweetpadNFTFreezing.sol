// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
import "./interfaces/ISweetpadNFT.sol";
import "./interfaces/ISweetpadTicket.sol";

contract SweetpadNFTFreezing is ISweetpadNFTFreezing, Ownable, ERC721Holder {
    /// @notice Freeze duration in blocks (182 days)
    uint256 public constant override FREEZE_DURATION = 182 * 28674;
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
     */
    function freeze(uint256 nftId) external override {
        require(nft.ownerOf(nftId) == msg.sender, "SweetpadNFTFreezing: NFT not belong to user");

        nft.safeTransferFrom(msg.sender, address(this), nftId);

        NFTData storage _nftData = nftData[nftId];
        _nftData.freezer = msg.sender;
        _nftData.freezeEndBlock = block.number + FREEZE_DURATION;

        userNFTs[msg.sender].push(nftId);

        ticket.mint(msg.sender, getTicketsCountForNFT(nftId));

        emit Frozen(msg.sender, nftId, _nftData.freezeEndBlock);
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

    function setSweetpadTicket(address _ticket) public override onlyOwner {
        require(_ticket != address(0), "SweetpadNFTFreezing: Ticket contract address can't be 0");
        ticket = ISweetpadTicket(_ticket);
    }
}
