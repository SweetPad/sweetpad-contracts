// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SweetpadReserve is AccessControl {
    using SafeERC20 for IERC20;
    
    IERC20 public sweetToken;
    bytes32 public constant DISTRIBUTOR = bytes32(0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d);
    uint256 public availableTokens = 25000000 ether;
    // TODO, we need to change BLOCKS_PER_DAY to a real one before deploying a mainnet
    uint256 private constant BLOCKS_PER_YEAR = 10475500;
    uint256 public lockedPeriod;

    event Claimed(address user, uint256 amount);

    constructor(address admin, address sweetToken_) {
        require(sweetToken_ != address(0), "SweetpadReserve: Token address can't be zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        lockedPeriod = block.number + BLOCKS_PER_YEAR;
        sweetToken = IERC20(sweetToken_);
    }

    function claim(uint256 amount) external onlyRole(DISTRIBUTOR) {
        require(block.number >= lockedPeriod, "SweetpadReserve: Too soon to claim");
        require(availableTokens >= amount, "SweetpadReserve: Insufficient tokens");
        sweetToken.safeTransfer(msg.sender, amount);
        availableTokens -= amount;
        emit Claimed(msg.sender, amount);
    }
}
