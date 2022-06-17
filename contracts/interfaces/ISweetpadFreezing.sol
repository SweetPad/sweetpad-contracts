// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISweetpadFreezing {
    enum Asset {
        SWTToken,
        LPToken
    }
    struct FreezeInfo {
        uint256 frozenUntil; // blockNumber when can be unfrozen
        uint256 period; // Number of blocks that tokens are frozen
        uint256 frozenAmount; // Amount of tokens are frozen
        uint256 power; // power of current frozen amount
        Asset token; // Variable to identify if the token is SWT or LP
    }

    function freezeInfo(address, uint256)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            Asset
        );

    function sweetToken() external view returns (IERC20);

    function lpToken() external view returns (IERC20);

    function multiplier() external view returns (uint256);

    function getBlocksPerDay() external view returns (uint256);

    function getMinFreezePeriod() external view returns (uint256);

    function getMaxFreezePeriod() external view returns (uint256);

    function totalPower(address) external view returns (uint256);

    function freezeSWT(uint256, uint256) external;

    function freezeLP(uint256, uint256) external;

    function unfreezeSWT(uint256, uint256) external;

    function unfreezeLP(uint256) external;

    function setMultiplier(uint256) external;

    function getFreezes(address) external view returns (FreezeInfo[] memory);

    function getPower(uint256, uint256) external pure returns (uint256);

    /// @notice Emitted when tokens are frozen
    event Freeze(uint256 id, address indexed account, uint256 amount, uint256 power, Asset);
    /// @notice Emitted when tokens are unFrozen
    event UnFreeze(uint256 id, address indexed account, uint256 power, Asset);
    /// @notice Emmited when multiplier reseted
    event MultiplierReseted(uint256 multiplier);
}
