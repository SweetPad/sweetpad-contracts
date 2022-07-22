// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract SweetpadTeamTokenomics is AccessControl {
    using SafeERC20 for IERC20;
    IERC20 public sweetToken;
    bytes32 public constant DISTRIBUTOR = bytes32(0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d);
    uint256 public lockedTokens = 19000000 ether;
    uint256 public claimedTokens;
    uint256 public unlockedTokens;
    uint256 public unlockPerMonth = 1600000 ether;

    uint256 private constant BLOCKS_PER_DAY = 28700;
    uint256 public constant BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30;
    uint256 public startBlock;

    constructor(address admin, address sweetToken_) {
        require(sweetToken_ != address(0), "SweetpadTeamTokenomics: Token address can't be zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        sweetToken = IERC20(sweetToken_);
        startBlock = block.number + BLOCKS_PER_DAY * 140;
    }

    function getUnlockedTokens() public view returns(uint256 unlocked){
        if (((block.number - startBlock) / BLOCKS_PER_MONTH) * unlockPerMonth > lockedTokens) {
            unlocked = lockedTokens;
        } else {
            unlocked = ((block.number - startBlock) / BLOCKS_PER_MONTH) * unlockPerMonth;
        }
        return unlocked;
    }

    function claim(uint256 amount) external onlyRole(DISTRIBUTOR) {
        require(block.number >= startBlock + BLOCKS_PER_MONTH, "SweetpadTeamTokenomics: Too soon to claim");
        require(getUnlockedTokens() >= amount, "SweetpadTeamTokenomics: Insufficient unlocked tokens");
        unlockedTokens += getUnlockedTokens() - amount;
        lockedTokens -= getUnlockedTokens();
        claimedTokens += amount;
        startBlock += ((block.number - startBlock) / BLOCKS_PER_MONTH) * BLOCKS_PER_MONTH;
        sweetToken.safeTransfer(msg.sender, amount);
    }
}
