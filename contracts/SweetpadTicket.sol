// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISweetpadTicket.sol";

contract SweetpadTicket is ISweetpadTicket, ERC1155(""), Ownable {
    uint256 public override totalTickets;
    mapping(address => uint256) public override accountTickets;

    function mint(
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes memory data_
    ) external override onlyOwner {
        totalTickets += amount_;
        accountTickets[to_] += amount_;
        _mint(to_, id_, amount_, data_);
    }

    function mintBatch(
        address to_,
        uint256[] memory ids_,
        uint256[] memory amounts_,
        bytes memory data_
    ) external override onlyOwner {
        uint256 mintedTickets = 0;
        for (uint256 i = 0; i < amounts_.length; i++) {
            mintedTickets += amounts_[i];
        }
        totalTickets += mintedTickets;
        accountTickets[to_] += mintedTickets;
        _mintBatch(to_, ids_, amounts_, data_);
    }

    function burn(
        address account_,
        uint256 id_,
        uint256 amount_
    ) external override onlyOwner {
        totalTickets -= amount_;
        accountTickets[account_] -= amount_;
        _burn(account_, id_, amount_);
    }

    function burnBatch(
        address account_,
        uint256[] memory ids_,
        uint256[] memory amounts_
    ) external override onlyOwner {
        uint256 burnedTickets = 0;
        for (uint256 i = 0; i < amounts_.length; i++) {
            burnedTickets += amounts_[i];
        }
        totalTickets -= burnedTickets;
        accountTickets[account_] -= burnedTickets;
        _burnBatch(account_, ids_, amounts_);
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override(ERC1155, IERC1155) {
        require(false, "SweetpadTicket: can't transfer tickets");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override(ERC1155, IERC1155) {
        require(false, "SweetpadTicket: can't transfer tickets");
    }
}
