// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ISweetpadNFT.sol";

/**
 * @title SweetpadNFT
 * @dev Contract module which provides functionality to mint new ERC721 tokens
 *      Each token connected with image. The image saves on IPFS. Also each token belongs one of the Sweet tiers, and give
 *      some tickets for lottery.
 */
contract SweetpadNFT is ISweetpadNFT, ERC721, Ownable {
    using Counters for Counters.Counter;

    /// @dev ERC721 id, Indicates a specific token or token type
    Counters.Counter private idCounter;

    string private baseURI = "ipfs://";

    /// @dev The data for each SweetpadNFT token
    mapping(uint256 => Tier) public override idToTier;
    mapping(Tier => uint256) public override tierToBoost;

    /// @dev Array of user NFTs
    mapping(address => uint256[]) public userNFTs;

    /**
     * @notice Initialize contract
     */
    constructor() ERC721("Sweet Dragon", "SWTD") {
        tierToBoost[Tier.One] = 5;
        tierToBoost[Tier.Two] = 12;
        tierToBoost[Tier.Three] = 30;
    }

    /*** External user-defined functions ***/
    function setBaseURI(string memory baseURI_) external override onlyOwner {
        baseURI = baseURI_;
    }

    function currentID() external view override returns (uint256) {
        return idCounter.current();
    }

    /**
     * @notice Function to get tickets quantity by tokens id.
     * @param id_ Token id
     * @return ticketsQuantity Tickets quantity
     */
    function getTicketsQuantityById(uint256 id_) external view override returns (uint256) {
        return tierToBoost[idToTier[id_]];
    }

    /**
     * @notice Function to get tickets quantity by tokens ids.
     * @param ids_ Array of token ids
     * @return ticketsQuantity Array of tickets quantity
     */
    function getTicketsQuantityByIds(uint256[] calldata ids_) external view override returns (uint256[] memory) {
        uint256[] memory ticketsQuantity = new uint256[](ids_.length);
        for (uint256 i = 0; i < ids_.length; i++) {
            ticketsQuantity[i] = tierToBoost[idToTier[ids_[i]]];
        }
        return ticketsQuantity;
    }

    /**
     * @notice Transfer token to another account
     * @param to_ The address of the token receiver
     * @param id_ token id
     * @param data_ The _data argument MAY be re-purposed for the new context.
     */
    function safeTransfer(
        address to_,
        uint256 id_,
        bytes memory data_
    ) external {
        _safeTransfer(msg.sender, to_, id_, data_);

        popNFT(msg.sender, id_);
        pushNFT(to_, id_);
    }

    /**
     * @notice Transfer tokens to another account
     * @param to_ The address of the tokens receiver
     * @param ids_ Array of token ids
     * @param data_ The _data argument MAY be re-purposed for the new context.
     */
    function safeBatchTransfer(
        address to_,
        uint256[] memory ids_,
        bytes memory data_
    ) external {
        for (uint256 i = 0; i < ids_.length; i++) {
            _safeTransfer(msg.sender, to_, ids_[i], data_);

            popNFT(msg.sender, ids_[i]);
            pushNFT(to_, ids_[i]);
        }
    }

    /**
     * @notice Transfer tokens from 'from' to 'to'
     * @param from_ The address of the tokens owner
     * @param to_ The address of the tokens receiver
     * @param ids_ Array of token ids
     * @param data_ The _data argument MAY be re-purposed for the new context.
     */
    function safeBatchTransferFrom(
        address from_,
        address to_,
        uint256[] memory ids_,
        bytes memory data_
    ) external override {
        for (uint256 i = 0; i < ids_.length; i++) {
            safeTransferFrom(from_, to_, ids_[i], data_);

            popNFT(from_, ids_[i]);
            pushNFT(to_, ids_[i]);
        }
    }

    /**
     * @notice Mint new 721 standard token
     * @param tier_ tier
     */
    function safeMint(address account_, Tier tier_) external override onlyOwner {
        _mint(account_, tier_);
    }

    /**
     * @notice Mint new ERC721 standard tokens in one transaction
     * @param account_ The address of the owner of tokens
     * @param tiers_ Array of tiers
     */
    function safeMintBatch(address account_, Tier[] memory tiers_) external override onlyOwner {
        for (uint256 i = 0; i < tiers_.length; i++) {
            _mint(account_, tiers_[i]);
        }
    }

    function supportsInterface(bytes4 interfaceId) public pure override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId;
    }

    function tokenURI(uint256 tokenId_) public view override(ERC721, IERC721Metadata) returns (string memory) {
        return
            _exists(tokenId_) ? string(abi.encodePacked(_baseURI(), Strings.toString(tokenId_), ".json")) : _baseURI();
    }

    /**
     * @notice Returns user NFTs
     */
    function getUserNfts(address user) external view override returns (uint256[] memory) {
        return userNFTs[user];
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @notice Mint new 721 standard token
     * @param tier_ tier
     */
    function _mint(address account_, Tier tier_) private {
        idCounter.increment();
        uint256 id = idCounter.current();

        _safeMint(account_, id);
        idToTier[id] = tier_;

        pushNFT(account_, id);

        emit Create(id, tier_, account_);
    }

    function pushNFT(address user, uint256 nftId) internal {
        userNFTs[user].push(nftId);
    }

    function popNFT(address user, uint256 nftId) internal {
        uint256[] memory _userNFTs = userNFTs[user];
        uint256 len = _userNFTs.length;

        for (uint256 i = 0; i < len; i++) {
            if (_userNFTs[i] == nftId) {
                if (i != len - 1) {
                    userNFTs[user][i] = userNFTs[user][len - 1];
                }
                userNFTs[user].pop();

                break;
            }
        }
    }
}
