// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ISweetpadTicket is IERC1155 {
    function mint(address, uint256) external;
}
