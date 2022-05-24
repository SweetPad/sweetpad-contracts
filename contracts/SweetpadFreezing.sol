// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/ISweetpadFreezing.sol";

/**
 * @title SweetpadFreezing
 * @dev Contract module which provides functionality to freeze assets on contract and get allocation.
 */

contract SweetpadFreezing is ISweetpadFreezing {
    using SafeERC20 for IERC20;

    uint256 public constant BLOCKS_PER_DAY = 10;
    // Min period counted with blocks that user can freeze assets
    uint256 private constant MIN_FREEZE_PERIOD = 182 * BLOCKS_PER_DAY;
    // Max period counted with blocks that user can freeze assets
    uint256 private constant MAX_FREEZE_PERIOD = 1095 * BLOCKS_PER_DAY;

    /// @dev The data for each account
    mapping(address => FreezeInfo[]) public override freezeInfo;

    /// @dev The data for each account, returns totalPower
    mapping(address => uint256) public override totalPower;

    IERC20 public sweetToken;

    /**
     * @notice Initialize contract
     */
    constructor(IERC20 sweetToken_) {
        require(address(sweetToken_) != address(0), "SweetpadFreezing: Token address cant be Zero address");
        sweetToken = sweetToken_;
    }

    /**
     * @notice Freeze SWT tokens
     * @param amount_ Amount of tokens to freeze
     * @param period_ Period of freezing
     */
    function freezeSWT(uint256 amount_, uint256 period_) external override {
        uint256 power = getPower(amount_, period_);
        require(power >= 10000 ether, "SweetpadFreezing: At least 10.000 xSWT is required");
        _freezeSWT(msg.sender, amount_, period_, power);
    }

    /**
     * @notice Freeze SWT tokens
     * @param id_ Id of freezing
     * @param amount_ Amount of tokens to unfreeze
     */
    function unfreezeSWT(uint256 id_, uint256 amount_) external override {
        FreezeInfo storage freezeData = freezeInfo[msg.sender][id_];
        require(freezeData.frozenAmount != 0, "SweetpadFreezing: Staked amount is Zero");
        require(freezeData.frozenAmount >= amount_, "SweetpadFreezing: Insufficient staked amount");
        uint256 powerDelta = getPower(freezeData.frozenAmount - amount_, freezeData.period);
        uint256 power = getPower(amount_, freezeData.period);
        require(powerDelta >= 10000 ether || powerDelta == 0, "SweetpadFreezing: At least 10.000 xSWT is required");
        require(block.number >= freezeData.frozenUntil, "SweetpadFreezing: Locked period dosn`t pass");
        _unfreezeSWT(msg.sender, id_, amount_, power);
    }

    function getStakes(address account_) public view override returns (FreezeInfo[] memory) {
        return freezeInfo[account_];
    }

    function getPower(uint256 amount_, uint256 period_) public pure override returns (uint256 power) {
        require(MIN_FREEZE_PERIOD <= period_ && period_ <= MAX_FREEZE_PERIOD, "SweetpadFreezing: Wrong period");
        if (period_ == MIN_FREEZE_PERIOD) {
            power = amount_ / 2;
            return power;
        }

        if (period_ > MIN_FREEZE_PERIOD && period_ <= 365 * BLOCKS_PER_DAY) {
            power = (period_ * amount_) / 365 / BLOCKS_PER_DAY;
            return power;
        }

        power = ((period_ + 365 * BLOCKS_PER_DAY) * amount_) / 730 / BLOCKS_PER_DAY;
        return power;
    }

    function _freezeSWT(
        address account_,
        uint256 amount_,
        uint256 period_,
        uint256 power_
    ) private {
        freezeInfo[account_].push(
            FreezeInfo({frozenUntil: block.number + period_, period: period_, frozenAmount: amount_, power: power_})
        );
        totalPower[account_] += power_;
        sweetToken.safeTransferFrom(account_, address(this), amount_);
    }

    function _unfreezeSWT(
        address account_,
        uint256 id_,
        uint256 amount_,
        uint256 power_
    ) private {
        totalPower[account_] -= power_;
        freezeInfo[account_][id_].power -= power_;
        freezeInfo[account_][id_].frozenAmount -= amount_;
        sweetToken.safeTransfer(account_, amount_);
    }
}
