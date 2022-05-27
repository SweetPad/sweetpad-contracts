// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ISweetpadNFT.sol";
import "./ISweetpadTicket.sol";

interface ISweetpadNFTFreezing {
    struct NFTData {
        // Account that froze NFT
        address freezer;
        // freeze period
        uint256 freezePeriod;
        // block after which freezer can unfreeze NFT
        uint256 freezeEndBlock;
    }

    function freeze(uint256, uint256) external;

    function freezeBatch(uint256[] calldata, uint256[] calldata) external;

    function blocksPerDay() external pure returns (uint256);

    function minFreezePeriod() external pure returns (uint256);

    function maxFreezePeriod() external pure returns (uint256);

    function nft() external view returns (ISweetpadNFT);

    function ticket() external view returns (ISweetpadTicket);

    function nftData(uint256)
        external
        view
        returns (
            address,
            uint256,
            uint256
        );

    function getNftsFrozeByUser(address) external view returns (uint256[] memory);

    function setSweetpadNFT(address) external;

    function setSweetpadTicket(address) external;

    event Froze(address indexed user, uint256 nftId, uint256 freezeEndBlock, uint256 ticketsMinted);
}
