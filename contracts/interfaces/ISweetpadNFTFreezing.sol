// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ISweetpadNFTFreezing {
    function getTicketsCountForNFT(uint256) external view returns (uint256);

    function setSweetpadNFT(address) external;
}
