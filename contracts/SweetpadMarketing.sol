// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SweetpadMarketing is AccessControl {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 lockedUntil; // blockNumber when can be claimed
        uint256 amount; // Amount of tokens the user will get
    }
    mapping(address => UserInfo) public userInfo;
    IERC20 public sweetToken;
    bytes32 public constant DISTRIBUTOR = bytes32(0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d);
    uint256 public availableTokens = 9000000 ether;

    event ScheduleCreated(address to, uint256 amount, uint256 period);
    event Claimed(address user, uint256 amount);

    constructor(address admin, address sweetToken_) {
        require(sweetToken_ != address(0), "SweetpadMarketing: Token address can't be zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        sweetToken = IERC20(sweetToken_);
    }

    function createSchedule(
        address to,
        uint256 amount,
        uint256 period
    ) external onlyRole(DISTRIBUTOR) {
        require(to != address(0), "SweetpadMarketing: User address can't be zero");
        require(amount > 0, "SweetpadMarketing: Amount can't be zero");

        userInfo[to].lockedUntil = block.number + period;
        userInfo[to].amount = amount;
        availableTokens -= amount;
        emit ScheduleCreated(to, amount, period);
    }

    function claim() external {
        require(userInfo[msg.sender].amount > 0, "SweetpadMarketing: Nothing to claim");
        require(block.number >= userInfo[msg.sender].lockedUntil, "SweetpadMarketing: Too soon to claim");
        sweetToken.safeTransfer(msg.sender, userInfo[msg.sender].amount);
        emit Claimed(msg.sender, userInfo[msg.sender].amount);
        delete userInfo[msg.sender];
    }
}
