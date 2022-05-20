// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract SweetpadTicket is ERC1155, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private idCounter;

    uint256 public totalTickets;
    mapping (address=>uint256) public accountTickets;

    function currentID() external view returns (uint256) {
        return idCounter.current();
    }


    function mint(address to_, uint256 amount_, bytes memory data_) external onlyOwner {
        idCounter.increment();
        uint256 id = idCounter.current();

        totalTickets += amount_;
        accountTickets[to_] += amount_;

        _mint(to_, id, amount_, data_);
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override {
        require(
            false,
            "SweetpadTicket: can't transfer you tickets"
        );
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override {
        require(
            false,
            "SweetpadTicket: can't transfer you tickets"
        );
    }
}
