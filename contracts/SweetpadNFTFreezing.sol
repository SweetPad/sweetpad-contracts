// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "./interfaces/ISweetpadNFTFreezing.sol";
import "./interfaces/ISweetpadNFT.sol";
import "./interfaces/ISweetpadTicket.sol";

contract SweetpadNFTFreezing is ISweetpadNFTFreezing, Ownable, ERC721Holder {
    /// @notice Blocks per day for BSC
    uint256 private constant BLOCKS_PER_DAY = 10; // TODO for mainnet change to 28674
    uint256 private constant MIN_PERIOD = 182 * BLOCKS_PER_DAY;
    uint256 private constant MAX_PERIOD = 1095 * BLOCKS_PER_DAY;

    ISweetpadNFT public override nft;
    ISweetpadTicket public override ticket;

    /// @notice NFT id -> frozen NFT data
    mapping(uint256 => NFTData) public override nftData;
    /// @notice user address -> NFT id's freezed by user
    mapping(address => uint256[]) public userNFTs;

    constructor(address _nft, address _ticket) {
        setSweetpadNFT(_nft);
        setSweetpadTicket(_ticket);
    }

    /**
     * @notice Freeze Sweetpad NFT
     * @param nftId: the id of the NFT
     * @param freezePeriod: freezing period in blocks
     */
    function freeze(uint256 nftId, uint256 freezePeriod) external override {
        uint256 freezeEndBlock = _freeze(nftId, freezePeriod);
        uint256 ticketsToMint = freezePeriod == MAX_PERIOD
            ? nft.getTicketsQuantityById(nftId) * 2
            : nft.getTicketsQuantityById(nftId);

        emit Froze(msg.sender, nftId, freezeEndBlock, ticketsToMint);

        ticket.mint(msg.sender, nftId, ticketsToMint);
        nft.safeTransferFrom(msg.sender, address(this), nftId);
    }

    /**
     * @notice Freeze Sweetpad NFTs
     * @param nftIds: the ids of the NFT
     * @param freezePeriods: freezing periods in blocks
     */
    function freezeBatch(uint256[] calldata nftIds, uint256[] calldata freezePeriods) external override {
        require(nftIds.length == freezePeriods.length, "SweetpadNFTFreezing: Array lengths is not equal");

        uint256 len = nftIds.length;
        uint256[] memory ticketsToMintBatch = new uint256[](len);
        uint256[] memory freezeEndBlocks = new uint256[](len);
        ticketsToMintBatch = nft.getTicketsQuantityByIds(nftIds);

        for (uint256 i = 0; i < len; i++) {
            freezeEndBlocks[i] = _freeze(nftIds[i], freezePeriods[i]);

            if (freezePeriods[i] == MAX_PERIOD) {
                ticketsToMintBatch[i] = ticketsToMintBatch[i] * 2;
            }
        }
        emit FrozeBatch(msg.sender, nftIds, freezeEndBlocks, ticketsToMintBatch);

        ticket.mintBatch(msg.sender, nftIds, ticketsToMintBatch);
        nft.safeBatchTransferFrom(msg.sender, address(this), nftIds, "0x00");
    }

    function unfreeze(uint256 nftId) external override {
        _unfreeze(nftId);

        emit Unfroze(msg.sender, nftId);

        ticket.burn(msg.sender, nftId);
        nft.safeTransferFrom(address(this), msg.sender, nftId);
    }

    function unfreezeBatch(uint256[] calldata nftIds) external override {
        for (uint256 i = 0; i < nftIds.length; i++) {
            _unfreeze(nftIds[i]);
        }

        emit UnfrozeBatch(msg.sender, nftIds);

        ticket.burnBatch(msg.sender, nftIds);
        nft.safeBatchTransferFrom(address(this), msg.sender, nftIds, "");
    }

    /**
     * @notice Returns NFTs frozen by the user
     */
    function getNftsFrozeByUser(address user) external view override returns (uint256[] memory) {
        return userNFTs[user];
    }

    function blocksPerDay() external pure override returns (uint256) {
        return BLOCKS_PER_DAY;
    }

    function minFreezePeriod() external pure override returns (uint256) {
        return MIN_PERIOD;
    }

    function maxFreezePeriod() external pure override returns (uint256) {
        return MAX_PERIOD;
    }

    function setSweetpadNFT(address newNft) public override onlyOwner {
        require(newNft != address(0), "SweetpadNFTFreezing: NFT contract address can't be 0");
        nft = ISweetpadNFT(newNft);
    }

    function setSweetpadTicket(address newTicket) public override onlyOwner {
        require(newTicket != address(0), "SweetpadNFTFreezing: Ticket contract address can't be 0");
        ticket = ISweetpadTicket(newTicket);
    }

    function _freeze(uint256 nftId, uint256 freezePeriod) private returns (uint256 freezeEndBlock) {
        require(freezePeriod >= MIN_PERIOD && freezePeriod <= MAX_PERIOD, "SweetpadNFTFreezing: Wrong freeze period");

        freezeEndBlock = freezePeriod + block.number;

        nftData[nftId] = NFTData({freezer: msg.sender, freezeEndBlock: freezeEndBlock});

        userNFTs[msg.sender].push(nftId);
    }

    function _unfreeze(uint256 nftId) private {
        NFTData memory _nftData = nftData[nftId];
        // slither-disable-next-line incorrect-equality
        require(_nftData.freezer == msg.sender, "SweetpadNFTFreezing: Wrong unfreezer");
        require(_nftData.freezeEndBlock <= block.number, "SweetpadNFTFreezing: Freeze period don't passed");
        // slither-disable-next-line costly-loop
        delete nftData[nftId];

        uint256[] memory _userNFTs = userNFTs[msg.sender];
        uint256 len = _userNFTs.length;
        for (uint256 i = 0; i < len; i++) {
            if (_userNFTs[i] == nftId) {
                if (i != len - 1) {
                    userNFTs[msg.sender][i] = userNFTs[msg.sender][len - 1];
                }
                userNFTs[msg.sender].pop();

                break;
            }
        }
    }
}
