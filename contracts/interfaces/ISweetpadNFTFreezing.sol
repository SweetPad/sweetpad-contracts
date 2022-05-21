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

    function freeze(uint256) external;

    function FREEZE_DURATION() external view returns (uint256);

    function nft() external view returns (ISweetpadNFT);

    function ticket() external view returns (ISweetpadTicket);

    function getTicketsCountForNFT(uint256) external view returns (uint256);

    function setSweetpadNFT(address) external;

    function setSweetpadTicket(address) external;

    event Frozen(address indexed, uint256, uint256);
}
