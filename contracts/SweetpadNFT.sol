// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SweetpadNFT
 * @dev Contract module which provides functionality to mint new ERC721 tokens
 *      Each token connected with image. The image saves on IPFS. Also each token belongs one of the Sweet tiers, and give
 *      some tickets for lottery.
 */
contract SweetpadNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    /// @dev ERC1155 id, Indicates a specific token or token type
    Counters.Counter private idCounter;

    enum Tier {
        One,
        Two,
        Three
    }

    string private baseURI = "ipfs://";

    /// @dev The data for each SweetpadNFT token
    mapping(uint256 => Tier) public idToTier;
    mapping(Tier => uint256) public tierToBoost;

    /// @notice Emitted when new NFT is minted
    event Create(uint256 indexed id, Tier indexed tier, address indexed owner);

    /**
     * @notice Initialize contract
     */
    constructor() ERC721("SweetpadNFT", "SWTNFT") {
        tierToBoost[Tier.One] = 5;
        tierToBoost[Tier.Two] = 12;
        tierToBoost[Tier.Three] = 30;
    }

    /*** External user-defined functions ***/
    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function currentID() external view returns (uint256) {
        return idCounter.current();
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
        for (uint256 i; i < ids_.length; i++) {
            _safeTransfer(msg.sender, to_, ids_[i], data_);
        }
    }

    /**
     * @notice Mint new 721 standard token
     * @param tier_ tier
     */
    function safeMint(address account_, Tier tier_) external onlyOwner {
        _mint(account_, tier_);
    }

    /**
     * @notice Mint new ERC721 standard tokens in one transaction
     * @param account_ The address of the owner of tokens
     * @param tiers_ Array of tiers
     */
    function safeMintBatch(address account_, Tier[] memory tiers_) external onlyOwner {
        for (uint256 i = 0; i < tiers_.length; i++) {
            _mint(account_, tiers_[i]);
        }
    }

    function supportsInterface(bytes4 interfaceId) public pure override(ERC721) returns (bool) {
        return interfaceId == type(IERC721).interfaceId;
    }

    function tokenURI(uint256 tokenId_) public view override returns (string memory) {
        return
            _exists(tokenId_) ? string(abi.encodePacked(_baseURI(), Strings.toString(tokenId_), ".json")) : _baseURI();
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

        emit Create(id, tier_, account_);
    }
}
