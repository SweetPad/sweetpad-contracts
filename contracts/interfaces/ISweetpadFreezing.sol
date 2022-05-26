// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISweetpadFreezing {
    struct FreezeInfo {
        uint256 frozenUntil; // blockNumber when can be unfrozen
        uint256 period; // Number of blocks that tokens are frozen
        uint256 frozenAmount; // Amount of tokens are frozen
    }

    function freezeInfo(address, uint256)
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        );

    function sweetToken() external view returns (IERC20);

    function getBlocksPerDay() external view returns (uint256);

    function getMinFreezePeriod() external view returns (uint256);

    function getMaxFreezePeriod() external view returns (uint256);

    function totalPower(address) external view returns (uint256);

    function freezeSWT(uint256, uint256) external;

    function unfreezeSWT(uint256, uint256) external;

    function getFreezes(address) external view returns (FreezeInfo[] memory);

    function getPower(uint256, uint256) external pure returns (uint256);

    /// @notice Emitted when tokens are frozen
    event Freeze(uint256, address indexed, uint256, uint256);
    /// @notice Emitted when tokens are unFrozen
    event UnFreeze(uint256, address indexed, uint256);
}
