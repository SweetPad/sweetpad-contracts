// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Staking {
    using SafeERC20 for IERC20;

    uint256 public constant BLOCKS_PER_DAY = 10;

    struct UserInfo {
        uint256 frozenUntil;
        uint256 period;
        uint256 frozenAmount;
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

    function freezeSWT(uint256 amount_, uint256 period_) external {
        require(sweetToken.balanceOf(msg.sender) >= amount_, "Insufficient tokens");
        require(182 <= period_ && period_ <= 1095, "Wrong period");
        require(getPower(amount_, period_) >= 10000 ether, "At least 10.000 xSWT is required");
        stakes[msg.sender].push(
            UserInfo({
                frozenUntil: block.number + period_ * BLOCKS_PER_DAY,
                period: period_,
                frozenAmount: amount_,
                power: getPower(amount_, period_)
            })
        );
        totalPower[msg.sender] += getPower(amount_, period_);
        sweetToken.transferFrom(msg.sender, address(this), amount_);
    }

    function unfreezeSWT(uint256 id, uint256 amount_) external {
        require((getStakes(msg.sender)).length >= 1 && (getStakes(msg.sender)).length > id, "Wrong id");
        require(stakes[msg.sender][id].frozenAmount != 0, "Staked amount is Zero");
        require(
            getPower(stakes[msg.sender][id].frozenAmount - amount_, stakes[msg.sender][id].period) >= 10000 ether ||
                getPower(stakes[msg.sender][id].frozenAmount - amount_, stakes[msg.sender][id].period) == 0,
            "At least 10.000 xSWT is required"
        );
        require(block.number >= stakes[msg.sender][id].frozenUntil, "Locked period dosn`t pass");
        totalPower[msg.sender] -= getPower(amount_, stakes[msg.sender][id].period);
        stakes[msg.sender][id].power -= getPower(amount_, stakes[msg.sender][id].period);
        stakes[msg.sender][id].frozenAmount -= amount_;
        sweetToken.transfer(msg.sender, amount_);
    }
}
