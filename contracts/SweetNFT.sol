// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SweetNFT
 * @dev Contract module which provides functionality to mint new ERC721 tokens
 *      Each token connected with image. The image saves on IPFS. Also each token belongs one of the Sweet tiers, and give
 *      some tickets for lottery.
 */
contract SweetNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    /// @dev ERC1155 id, Indicates a specific token or token type
    Counters.Counter private idCounter;

    uint8[] public boost = [5, 12, 30];
    string private baseURI = "ipfs://";

    /// @dev The data for each SweetNFT token
    mapping(uint256 => uint8) public idToTier;

    /// @notice Emitted when new NFT is minted
    event NFTMinted(uint256 indexed id, uint8 tier, address owner);

    /**
     * @notice Initialize contract
     */
    constructor() ERC721("SweetNFT", "SWTNFT") {}

    /*** External user-defined functions ***/

    function supportsInterface(bytes4 interfaceId) public view override(ERC721) returns (bool) {
        return interfaceId == type(IERC721).interfaceId;
    }

    /**
     * @notice Mint new 721 standard token
     * @param tier_ tier
     */
    function mint(address account_, uint8 tier_) public onlyOwner {
        require(tierExists(tier_), "SweetNFT: Tier doesn't exist");
        idCounter.increment();
        uint256 id = idCounter.current();

        _mint(account_, id);
        idToTier[id] = tier_;

        emit NFTMinted(id, tier_, account_);
    }

    /**
     * @notice Mint new ERC721 standard tokens in one transaction
     * @param account_ The address of the owner of tokens
     * @param tiers_ Array of tiers
     */
    function mintBatch(address account_, uint8[] memory tiers_) external onlyOwner {
        for (uint256 i = 0; i < tiers_.length; i++) {
            mint(account_, tiers_[i]);
        }
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
        for (uint256 j; j < ids_.length; j++) {
            _safeTransfer(msg.sender, to_, ids_[j], data_);
        }
    }

    /// @notice Checks if the specified Tier exists
    /// @param tier_ The Tier that is being checked
    function tierExists(uint8 tier_) public view returns (bool) {
        return tier_ < 4 && tier_ > 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return
            idToTier[tokenId] != 0
                ? string(abi.encodePacked(_baseURI(), "/", Strings.toString(tokenId), ".json"))
                : _baseURI();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function currentID() external view returns (uint256) {
        return idCounter.current();
    }
}
