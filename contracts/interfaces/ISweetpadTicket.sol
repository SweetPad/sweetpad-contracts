// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ISweetpadTicket is IERC1155 {
    function totalTickets() external returns (uint256);

    function accountTickets(address) external returns (uint256);

    function mint(
        address to_,
        uint256 id_,
        uint256 amount_
    ) external;

    function burn(address account, uint256 id) external;

    function mintBatch(
        address to_,
        uint256[] memory ids_,
        uint256[] memory amounts_
    ) external;

    function burnBatch(address account, uint256[] memory ids) external;
}
