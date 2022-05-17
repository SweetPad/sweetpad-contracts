// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking {
    uint256 public constant BLOCKS_PER_DAY = 1000;

    struct UserInfo {
        uint256 lockedPeriod;
        uint256 stakedAmount;
        uint256 power;
    }

    mapping(address => UserInfo[]) public stakes;

    mapping(address => uint256) public totalPower;

    IERC20 public sweetToken;

    constructor(IERC20 sweetToken_) {
        require(address(sweetToken_) != address(0), "Token address cant be Zero address");
        sweetToken = sweetToken_;
    }

    function getPower(uint256 amount_, uint256 period_) public pure returns (uint256 power) {
        require(182 <= period_ && period_ <= 1095, "Wrong period");
        if (period_ == 182) {
            power = amount_ / 2;
            return power;
        }

        if (period_ > 182 && period_ <= 365) {
            power = (period_ * amount_) / 365;
            return power;
        }

        if (period_ > 365 && period_ <= 1095) {
            power = ((period_ - 365 + 730) * amount_) / 730;
            return power;
        }
    }

    function getStakes(address staker_) public view returns (UserInfo[] memory) {
        return stakes[staker_];
    }

    function stakeSWT(uint256 amount_, uint256 period_) external returns (uint256) {
        require(sweetToken.balanceOf(msg.sender) >= amount_, "INSUFFICIENT TOKENS");
        require(getPower(amount_, period_) >= 10000 ether, "At least 10.000 xSWT is required");
        uint256 power;
        if (period_ == 182) {
            power = amount_ / 2;
        }

        if (period_ > 182 && period_ <= 365) {
            power = (period_ * amount_) / 365;
        }

        if (period_ > 365 && period_ <= 1095) {
            power = ((period_ - 365 + 730) * amount_) / 730;
        }
        sweetToken.transferFrom(msg.sender, address(this), amount_);
        stakes[msg.sender].push(
            UserInfo({lockedPeriod: block.number + period_ * BLOCKS_PER_DAY, stakedAmount: amount_, power: power})
        );
        totalPower[msg.sender] += power;
    }
}
