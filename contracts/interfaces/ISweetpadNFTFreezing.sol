// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./ISweetpadNFT.sol";
import "./ISweetpadTicket.sol";
import "../SweetpadLottery.sol";

interface ISweetpadNFTFreezing {
    struct NFTData {
        // Account that froze NFT
        address freezer;
        // block after which freezer can unfreeze NFT
        uint256 freezeEndBlock;
    }

    function freeze(uint256, uint256) external;

    function freezeBatch(uint256[] calldata, uint256[] calldata) external;

    function unfreeze(uint256) external;

    function unfreezeBatch(uint256[] calldata) external;

    function blocksPerDay() external pure returns (uint256);

    function minFreezePeriod() external pure returns (uint256);

    function maxFreezePeriod() external pure returns (uint256);

    function nft() external view returns (ISweetpadNFT);

    function ticket() external view returns (ISweetpadTicket);

    function lottery() external view returns (SweetpadLottery);

    function nftData(uint256) external view returns (address, uint256);

    function getNftsFrozeByUser(address) external view returns (uint256[] memory);

    function setSweetpadNFT(address) external;

    function setSweetpadTicket(address) external;

    function setSweetpadLottery(address) external;

    // function tiketsForIdo(address, address) external returns(uint256[] memory);

    function addTickets(address, address, uint256) external;

    event Froze(address indexed user, uint256 nftId, uint256 freezeEndBlock, uint256 ticketsMinted);

    event FrozeBatch(address indexed user, uint256[] nftIds, uint256[] freezeEndBlocks, uint256[] ticketsMinted);

    event Unfroze(address indexed user, uint256 nftId);

    event UnfrozeBatch(address indexed user, uint256[] nftId);
}
