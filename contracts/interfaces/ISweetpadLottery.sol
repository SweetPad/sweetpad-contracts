//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ISweetpadLottery {

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function getMaxRange() external view returns(uint32);

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    function numbersDrawn(
        uint256 _lotteryId,
        bytes32 _requestId, 
        uint256 _randomNumber
    ) 
        external;
}