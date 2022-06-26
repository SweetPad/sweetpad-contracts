// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "ApeSwap-AMM-Periphery/contracts/interfaces/IApeRouter02.sol";

interface ISweetpadFreezing {
    struct FreezeInfo {
        uint256 frozenUntil; // blockNumber when can be unfrozen
        uint256 period; // Number of blocks that tokens are frozen
        uint256 frozenAmount; // Amount of tokens are frozen
        uint256 power; // power of current frozen amount
        uint8 asset; // Variable to identify if the token is SWT or LP
    }

    function freezeInfo(address, uint256)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint8
        );

    function sweetToken() external view returns (IERC20);

    function lpToken() external view returns (IERC20);

    function router() external view returns (IApeRouter02);

    function multiplier() external view returns (uint256);

    function totalFrozenSWT() external view returns (uint256);

    function totalFrozenLP() external view returns (uint256);

    function getBlocksPerDay() external pure returns (uint256);

    function getMinFreezePeriod() external pure returns (uint256);

    function getMaxFreezePeriod() external pure returns (uint256);

    function totalPower(address) external view returns (uint256);

    function freezeSWT(uint256, uint256) external;

    function freezeLP(uint256, uint256) external;

    function freezeWithBNB(
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) external payable;

    function unfreezeSWT(uint256, uint256) external;

    function unfreezeLP(uint256) external;

    function setMultiplier(uint256) external;

    function setLPToken(IERC20) external;

    function getFreezes(address) external view returns (FreezeInfo[] memory);

    function getPower(uint256, uint256) external pure returns (uint256);

    /// @notice Emitted when tokens are frozen
    event Freeze(uint256 id, address indexed account, uint256 amount, uint256 power, uint8 asset);
    /// @notice Emitted when tokens are unFrozen
    event UnFreeze(uint256 id, address indexed account, uint256 power, uint8 asset);
    /// @notice Emmited when multiplier reseted
    event MultiplierReseted(uint256 oldMultiplier, uint256 newMultiplier);
}
