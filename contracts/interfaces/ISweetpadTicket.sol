// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

interface ISweetpadTicket is IERC721, IERC721Metadata {
    function totalTickets() external returns (uint256);

    function mint(
        address,
        uint256,
        address
    ) external;
}
