// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SweetpadAdvisers is AccessControl {
    using SafeERC20 for IERC20; 

    struct AdvisersInfo {
        uint256 lockedUntil; // blockNumber when can be claimed
        uint256 amount; // Amount of tokens the adviser will get
    }
    mapping(address => AdvisersInfo) public advisersInfo;
    IERC20 public sweetToken;
    bytes32 public constant DISTRIBUTOR = bytes32(0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d);
    uint256 public availableTokens = 4000000 ether;

    event ScheduleCreated(address to, uint256 amount, uint256 period);
    event Claimed(address adviser, uint256 amount);

    constructor(address admin, address sweetToken_) {
        require(sweetToken_ != address(0), "SweetpadAdvisers: Token address can't be zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        sweetToken = IERC20(sweetToken_);
    }

    function createSchedule(
        address to,
        uint256 amount,
        uint256 period
    ) external onlyRole(DISTRIBUTOR) {
        require(to != address(0), "SweetpadAdvisers: Advisers address can't be zero");
        require(amount > 0, "SweetpadAdvisers: Amount can't be zero");

        advisersInfo[to].lockedUntil = block.number + period;
        advisersInfo[to].amount = amount;
        availableTokens -= amount;
        emit ScheduleCreated(to, amount, period);
    }

    function claim() external {
        require(advisersInfo[msg.sender].amount > 0, "SweetpadAdvisers: Nothing to claim");
        require(block.number >= advisersInfo[msg.sender].lockedUntil, "SweetpadAdvisers: Too soon to claim");
        sweetToken.safeTransfer(msg.sender, advisersInfo[msg.sender].amount);
        emit Claimed(msg.sender, advisersInfo[msg.sender].amount);
        delete advisersInfo[msg.sender];
    }
}
