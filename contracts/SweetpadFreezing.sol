// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISweetpadFreezing.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/IPancakeswapPair.sol";
import "hardhat/console.sol";

/**
 * @title SweetpadFreezing
 * @dev Contract module which provides functionality to freeze assets on contract and get allocation.
 */
contract SweetpadFreezing is ISweetpadFreezing, Ownable {
    using SafeERC20 for IERC20;
    uint16 private constant DAYS_IN_YEAR = 365;
    // TODO, we need to change BLOCKS_PER_DAY to a real one before deploying a mainnet
    uint256 private constant BLOCKS_PER_DAY = 10;
    // Min period counted with blocks that user can freeze assets
    uint256 private constant MIN_FREEZE_PERIOD = 182 * BLOCKS_PER_DAY;
    // Max period counted with blocks that user can freeze assets
    uint256 private constant MAX_FREEZE_PERIOD = 1095 * BLOCKS_PER_DAY;
    // TODO set correct mainnet addresses before deploying
    address public constant ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    /// @dev Multiplier to colculate power while freezing with LP
    uint256 public override multiplier;

    /// @dev The data for each account
    mapping(address => FreezeInfo[]) public override freezeInfo;

    /// @dev The data for each account, returns totalPower
    mapping(address => uint256) public override totalPower;

    IERC20 public override sweetToken;
    IERC20 public override lpToken;

    IPancakeRouter02 public router = IPancakeRouter02(ROUTER_ADDRESS);

    /**
     * @notice Initialize contract
     */
    constructor(IERC20 sweetToken_) {
        require(address(sweetToken_) != address(0), "SweetpadFreezing: Token address cant be Zero address");
        sweetToken = sweetToken_;
    }

    receive() external payable {
        return;
    }

    fallback() external payable {
        return;
    }

    /**
     * @notice Freeze SWT tokens
     * @param amount_ Amount of tokens to freeze
     * @param period_ Period of freezing
     */
    function freezeSWT(uint256 amount_, uint256 period_) external override {
        uint256 power = getPower(amount_, period_);
        require(power >= 10000 ether, "SweetpadFreezing: At least 10.000 xSWT is required");
        _freeze(msg.sender, amount_, period_, power, Asset.SWTToken);
    }

    /**
     * @notice Freeze LP tokens
     * @param amount_ Amount of tokens to freeze
     * @param period_ Period of freezing
     */
    function freezeLP(uint256 amount_, uint256 period_) public override {
        uint256 power = (getPower(amount_, period_) * multiplier) / 100;
        require(power >= 10000 ether, "SweetpadFreezing: At least 10.000 xSWT is required");
        _freeze(msg.sender, amount_, period_, power, Asset.LPToken);
    }

    /**
     * @notice Freeze LP tokens
     * @param period_ Period of freezing
     * @param deadline_ Timestamp after which the transaction will revert.
     */
    function freezeWithBNB(uint256 period_, uint256 deadline_) public payable {
        IPancakeswapPair lp = IPancakeswapPair(address(lpToken));

        require((lp.token0() == router.WETH()) || (lp.token1() == router.WETH()), "Wrong LP");

        IERC20 token = IERC20(lp.token0());

        if (lp.token0() == router.WETH()) {
            token = IERC20(lp.token1());
        }

        address[] memory path = new address[](2);

        path[0] = router.WETH();
        path[1] = address(token);

        uint256[] memory swapResult = router.swapExactETHForTokens{value: msg.value / 2}(
            0,
            path,
            address(this),
            deadline_
        );

        uint256 tokenAmount = swapResult[1];

        token.approve(ROUTER_ADDRESS, tokenAmount);

        (, , uint256 lpResult) = router.addLiquidityETH{value: msg.value / 2}(
            address(token),
            tokenAmount,
            0,
            0,
            address(this),
            deadline_
        );
        _freezeLPWithBNB(msg.sender, lpResult, period_, Asset.LPToken);
    }

    /**
     * @notice Unfreeze SWT tokens
     * @param id_ Id of freezing
     * @param amount_ Amount of tokens to unfreeze
     */
    function unfreezeSWT(uint256 id_, uint256 amount_) external override {
        FreezeInfo memory freezeData = freezeInfo[msg.sender][id_];
        require(freezeData.token == Asset.SWTToken, "SweetpadFreezing: Wrong ID");
        require(freezeData.frozenAmount != 0, "SweetpadFreezing: Frozen amount is Zero");
        require(freezeData.frozenAmount >= amount_, "SweetpadFreezing: Insufficient frozen amount");
        require(block.number >= freezeData.frozenUntil, "SweetpadFreezing: Locked period dosn`t pass");
        uint256 expectedPower = getPower(freezeData.frozenAmount - amount_, freezeData.period);
        require(
            expectedPower >= 10000 ether || expectedPower == 0,
            "SweetpadFreezing: At least 10.000 xSWT is required"
        );
        uint256 powerDelta = getPower(amount_, freezeData.period);
        _unfreezeSWT(msg.sender, id_, amount_, powerDelta);
    }

    /**
     * @notice Unfreeze LP tokens
     * @param id_ Id of freezing
     */
    function unfreezeLP(uint256 id_) external override {
        FreezeInfo memory freezeData = freezeInfo[msg.sender][id_];
        require(freezeData.token == Asset.LPToken, "SweetpadFreezing: Wrong ID");
        require(block.number >= freezeData.frozenUntil, "SweetpadFreezing: Locked period dosn`t pass");
        _unfreezeLP(msg.sender, id_);
    }

    /**
     * @notice Set multiplier to calculate power while freezing with LP
     * @param multiplier_ Shows how many times the power will be greater for  user while staking with LP
     */
    function setMultiplier(uint256 multiplier_) external override onlyOwner {
        require(multiplier_ != 0, "SweetpadFreezing: Multiplier can't be zero");
        multiplier = multiplier_;
    }

    /**
     * @notice Set LP token
     * @param lpToken_ Address of BNB/SWT LP
     */
    function setLPToken(IERC20 lpToken_) external onlyOwner {
        require(address(lpToken_) != address(0), "SweetpadFreezing: LP token address cant be Zero address");
        lpToken = lpToken_;
    }

    function getFreezes(address account_) external view override returns (FreezeInfo[] memory) {
        return freezeInfo[account_];
    }

    function getBlocksPerDay() external view override returns (uint256) {
        return BLOCKS_PER_DAY;
    }

    function getMinFreezePeriod() external view override returns (uint256) {
        return MIN_FREEZE_PERIOD;
    }

    function getMaxFreezePeriod() external view override returns (uint256) {
        return MAX_FREEZE_PERIOD;
    }

    function getPower(uint256 amount_, uint256 period_) public pure override returns (uint256 power) {
        require(MIN_FREEZE_PERIOD <= period_ && period_ <= MAX_FREEZE_PERIOD, "SweetpadFreezing: Wrong period");
        if (period_ == MIN_FREEZE_PERIOD) {
            power = amount_ / 2;
            return power;
        }

        if (period_ > MIN_FREEZE_PERIOD && period_ <= DAYS_IN_YEAR * BLOCKS_PER_DAY) {
            power = (period_ * amount_) / DAYS_IN_YEAR / BLOCKS_PER_DAY;
            return power;
        }

        power = ((period_ + DAYS_IN_YEAR * BLOCKS_PER_DAY) * amount_) / (DAYS_IN_YEAR * 2) / BLOCKS_PER_DAY;
        return power;
    }

    function _freeze(
        address account_,
        uint256 amount_,
        uint256 period_,
        uint256 power_,
        Asset token_
    ) private {
        freezeInfo[account_].push(
            FreezeInfo({
                frozenUntil: block.number + period_,
                period: period_,
                frozenAmount: amount_,
                power: power_,
                token: token_
            })
        );
        totalPower[account_] += power_;

        emit Freeze(freezeInfo[account_].length - 1, account_, amount_, power_, token_);
        if (token_ == Asset.SWTToken) {
            sweetToken.safeTransferFrom(account_, address(this), amount_);
            return;
        }
        lpToken.safeTransferFrom(account_, address(this), amount_);
    }

    function _freezeLPWithBNB(
        address account_,
        uint256 amount_,
        uint256 period_,
        Asset token_
    ) private {
        uint256 power = (getPower(amount_, period_) * multiplier) / 100;
        require(power >= 10000 ether, "SweetpadFreezing: At least 10.000 xSWT is required");
        freezeInfo[account_].push(
            FreezeInfo({
                frozenUntil: block.number + period_,
                period: period_,
                frozenAmount: amount_,
                power: power,
                token: token_
            })
        );
        totalPower[account_] += power;

        emit Freeze(freezeInfo[account_].length - 1, account_, amount_, power, token_);
    }

    function _unfreezeSWT(
        address account_,
        uint256 id_,
        uint256 amount_,
        uint256 power_
    ) private {
        totalPower[account_] -= power_;
        freezeInfo[account_][id_].frozenAmount -= amount_;
        freezeInfo[account_][id_].power -= power_;

        emit UnFreeze(id_, account_, amount_, Asset.SWTToken);

        sweetToken.safeTransfer(account_, amount_);
    }

    function _unfreezeLP(address account_, uint256 id_) private {
        FreezeInfo storage freezeData = freezeInfo[account_][id_];
        totalPower[account_] -= freezeData.power;
        uint256 amount = freezeData.frozenAmount;
        delete freezeInfo[account_][id_];

        emit UnFreeze(id_, account_, amount, Asset.LPToken);

        lpToken.safeTransfer(account_, amount);
    }
}
