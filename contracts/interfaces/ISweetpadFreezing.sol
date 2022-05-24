// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface ISweetpadFreezing {
    struct FreezeInfo {
        uint256 frozenUntil;
        uint256 period;
        uint256 frozenAmount;
        uint256 power;
    }

    function freezeInfo(address, uint256)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );

    function totalPower(address) external view returns (uint256);

    function freezeSWT(uint256, uint256) external;

    function unfreezeSWT(uint256, uint256) external;

    function getStakes(address) external view returns (FreezeInfo[] memory);

    function getPower(uint256, uint256) external pure returns (uint256);
}
