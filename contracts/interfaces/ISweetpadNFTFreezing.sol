// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ISweetpadNFT.sol";
import "./ISweetpadTicket.sol";

interface ISweetpadNFTFreezing {
    struct NFTData {
        // Account that froze NFT
        address freezer;
        // block after which freezer can unfreeze NFT
        uint256 freezeEndBlock;
    }

    function freeze(uint128, uint128) external;

    function freezeBatch(uint128[] calldata, uint128[] calldata) external;

    function BLOCKS_PER_DAY() external view returns (uint256);

    function nft() external view returns (ISweetpadNFT);

    function ticket() external view returns (ISweetpadTicket);

    function getNftsFrozeByUser(address) external view returns (uint256[] memory);

    function setSweetpadNFT(address) external;

    function setSweetpadTicket(address) external;

    function getTicketsCountForNFT(uint256) external view returns (uint256);

    event Frozen(address indexed user, uint256 nftId, uint256 freezeEndBlock, uint256 ticketsMinted);
}
