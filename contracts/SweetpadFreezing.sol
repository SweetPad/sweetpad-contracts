// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "ApeSwap-AMM-Periphery/contracts/interfaces/IApeRouter02.sol";
import "ApeSwap-AMM-Periphery/contracts/interfaces/IApePair.sol";
import "./interfaces/ISweetpadFreezing.sol";

/**
 * @title SweetpadFreezing
 * @dev Contract module which provides functionality to freeze assets on contract and get allocation.
 */
contract SweetpadFreezing is ISweetpadFreezing, Ownable {
    using SafeERC20 for IERC20;

    uint16 private constant DAYS_IN_YEAR = 10;

    // TODO, we need to change BLOCKS_PER_DAY to a real one before deploying a mainnet
    uint256 private constant BLOCKS_PER_DAY = 1;

    // Min period counted with blocks that user can freeze assets
    uint256 private constant MIN_FREEZE_PERIOD = 5 * BLOCKS_PER_DAY;

    // Max period counted with blocks that user can freeze assets
    uint256 private constant MAX_FREEZE_PERIOD = 30 * BLOCKS_PER_DAY;

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

    IApeRouter02 public router = IApeRouter02(ROUTER_ADDRESS);

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
        _transferAssetsToContract (msg.sender, amount_, Asset.SWTToken);
    }

    /**
     * @notice Freeze LP tokens
     * @param amount_ Amount of tokens to freeze
     * @param period_ Period of freezing
     */
    function freezeLP(uint256 amount_, uint256 period_) external override {
        uint256 power = (getPower(amount_, period_) * multiplier) / 100;
        require(power >= 10000 ether, "SweetpadFreezing: At least 10.000 xSWT is required");
        _freeze(msg.sender, amount_, period_, power, Asset.LPToken);
        _transferAssetsToContract (msg.sender, amount_, Asset.LPToken);
    }

    /**
     * @notice Freeze LP tokens
     * @param period_ Period of freezing
     * @param deadline_ Timestamp after which the transaction will revert.
     */
    function freezeWithBNB(
        uint256 period_,
        uint256 amountOutMin,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint256 deadline_
    ) external payable {
        // slither-disable-next-line reentrancy-events
        uint256[] memory swapResult = _swapExactETHForSwtTokens(msg.value / 2, amountOutMin, deadline_);

        uint256 tokenAmount = swapResult[1];

        // slither-disable-next-line reentrancy-events
        uint256 liquidity = _addLiquidityETH(
            msg.sender,
            msg.value / 2,
            address(sweetToken),
            tokenAmount,
            amountTokenMin,
            amountETHMin,
            deadline_
        );

        uint256 power = (getPower(liquidity, period_) * multiplier) / 100;
        require(power >= 10000 ether, "SweetpadFreezing: At least 10.000 xSWT is required");
        _freeze(msg.sender, liquidity, period_, power, Asset.LPToken);
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
        emit MultiplierReseted(multiplier);
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

    function getBlocksPerDay() external pure override returns (uint256) {
        return BLOCKS_PER_DAY;
    }

    function getMinFreezePeriod() external pure override returns (uint256) {
        return MIN_FREEZE_PERIOD;
    }

    function getMaxFreezePeriod() external pure override returns (uint256) {
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
    }

    function _transferAssetsToContract (address from, uint256 amount, Asset token) private {
        if (token == Asset.SWTToken) {
            sweetToken.safeTransferFrom(from, address(this), amount);
            return;
        }
        lpToken.safeTransferFrom(from, address(this), amount);
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

    function _transferBackUnusedAssets(
        address to,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 ethAmountAdded,
        uint256 tokenAmountAdded
    ) private {
        uint256 ethToTransfer = ethAmount - ethAmountAdded;
        uint256 tokenToTransfer = tokenAmount - tokenAmountAdded;

        if (ethToTransfer > 0) {
            payable(to).transfer(ethToTransfer);
        }

        if (tokenToTransfer > 0) {
            sweetToken.safeTransfer(to, tokenToTransfer);
        }
    }

    function _addLiquidityETH(
        address account,
        uint256 ethAmount,
        address token,
        uint256 tokenAmount,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint256 deadline_
    )
        private
        returns (
            uint256
        )
    {
        // slither-disable-next-line reentrancy-events
        sweetToken.safeApprove(ROUTER_ADDRESS, tokenAmount);

        (uint256 amountTokenAdded, uint256 amountETHAdded, uint256 liquidity) = router.addLiquidityETH{value: ethAmount}(
            token,
            tokenAmount,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline_
        );

        _transferBackUnusedAssets(account, ethAmount, tokenAmount, amountETHAdded, amountTokenAdded);

        return liquidity;
    }

    function _swapExactETHForSwtTokens(
        uint256 amount,
        uint256 amountOutMin,
        uint256 deadline_
    ) private returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);

        // slither-disable-next-line naming-convention
        path[0] = router.WETH();
        path[1] = address(sweetToken);

        amounts = router.swapExactETHForTokens{value: amount}(amountOutMin, path, address(this), deadline_);
        return amounts;
    }
}
