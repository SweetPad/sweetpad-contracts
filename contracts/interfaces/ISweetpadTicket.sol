// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ISweetpadTicket is IERC721 {
    function totalTickets() external returns (uint256);

    function mint(
        address,
        uint256,
        address
    ) external;
}
