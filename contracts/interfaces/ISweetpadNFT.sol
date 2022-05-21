// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

interface ISweetpadNFT is IERC721, IERC721Metadata {
    enum Tier {
        One,
        Two,
        Three
    }

    function idToTier(uint256) external view returns (Tier);

    function tierToBoost(Tier) external view returns (uint256);

    function setBaseURI(string memory) external;

    function currentID() external view returns (uint256);

    function safeMint(address, Tier) external;

    function safeMintBatch(address, Tier[] memory) external;

    /// @notice Emitted when new NFT is minted
    event Create(uint256 indexed, Tier indexed, address indexed);
}
