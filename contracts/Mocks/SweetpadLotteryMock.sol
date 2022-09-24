//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;
// Imported OZ helper contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
// import "@openzeppelin/contracts/proxy/Initializable.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";
// Allows for intergration with ChainLink VRF
// Interface for Lottery NFT to mint tokens
import "../interfaces/ISweetpadTicket.sol";
import "hardhat/console.sol";

// Allows for time manipulation. Set to 0x address on test/mainnet deploy
// import "./Testable.sol";

contract SweetpadLotteryMock is Ownable {
    // Libraries
    using SafeMath for uint256;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality
    using Address for address;

    // State variables
    // Instance of Cake token (collateral currency for lotto)
    // IERC20 internal cake_;
    // Storing of the NFT
    // TODO check
    // ISweetpadTicket internal nft_;
    // Storing of the randomness generator
    // Request ID for random number
    bytes32 internal requestId_;
    // Counter for lottery IDs
    uint256 private lotteryIdCounter_;

    // Lottery size
    uint16 public sizeOfLottery_;
    // Max range for numbers (starting at 0)
    uint16 public maxValidRange_;

    // Represents the status of the lottery
    enum Status {
        NotStarted, // The lottery has not started yet
        Open, // The lottery is open for ticket purchases
        Closed, // The lottery is no longer open for ticket purchases
        Completed // The lottery has been closed and the numbers drawn
    }
    // All the needed info around a lottery
    struct LottoInfo {
        uint256 lotteryID; // ID for lotto
        Status lotteryStatus; // Status for lotto
        address ido;
        // uint256 prizePoolInCake;    // The amount of cake for prize money
        // uint256 costPerTicket;      // Cost per ticket in $cake
        // uint8[] prizeDistribution;  // The distribution for prize money
        uint256 startingTimestamp; // Block timestamp for star of lotto
        uint256 closingTimestamp; // Block timestamp for end of entries
        uint16[] winningNumbers; // The winning numbers
    }
    // Lottery ID's to info
    mapping(uint256 => LottoInfo) public allLotteries_;
    mapping(uint256 => uint256) internal rendomNumbers;
    mapping(address => uint256) public idoToId;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event RequestNumbers(uint256 lotteryId, bytes32 requestId);

    event UpdatedSizeOfLottery(address admin, uint16 newLotterySize);

    event UpdatedMaxRange(address admin, uint16 newMaxRange);

    event LotteryOpen(uint256 lotteryId, uint256 ticketSupply);

    event LotteryClose(uint256 lotteryId, uint256 ticketSupply);

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    constructor(
        // address _cake,
        // address _timer,
        uint8 _sizeOfLotteryNumbers,
        uint16 _maxValidNumberRange // uint8 _bucketOneMaxNumber, // TODO check // address lotteryNFT_ // Testable(_timer)
    ) {
        // require(
        //     _discountForBucketOne < _discountForBucketTwo &&
        //     _discountForBucketTwo < _discountForBucketThree,
        //     "Discounts must increase"
        // );
        // require(
        //     _cake != address(0),
        //     "Contracts cannot be 0 address"
        // );
        require(_sizeOfLotteryNumbers != 0 && _maxValidNumberRange != 0, "Lottery setup cannot be 0");
        // require(lotteryNFT_ != address(0), "Contracts cannot be 0 address");
        // nft_ = ISweetpadTicket(lotteryNFT_);
        // cake_ = IERC20(_cake);
        sizeOfLottery_ = _sizeOfLotteryNumbers;
        maxValidRange_ = _maxValidNumberRange;

        // bucketOneMax_ = _bucketOneMaxNumber;
        // bucketTwoMax_ = _bucketTwoMaxNumber;
        // discountForBucketOne_ = _discountForBucketOne;
        // discountForBucketTwo_ = _discountForBucketTwo;
        // discountForBucketThree_ = _discountForBucketThree;
    }

    // function initialize(
    //     address _lotteryNFT,
    //     address _IRandomNumberGenerator
    // )
    //     external
    //     initializer
    //     onlyOwner()
    // {
    //     require(
    //         _lotteryNFT != address(0) &&
    //         _IRandomNumberGenerator != address(0),
    //         "Contracts cannot be 0 address"
    //     );
    //     nft_ = ILotteryNFT(_lotteryNFT);
    //     randomGenerator_ = IRandomNumberGenerator(_IRandomNumberGenerator);
    // }

    function getBasicLottoInfo(uint256 _lotteryId) external view returns (LottoInfo memory) {
        return (allLotteries_[_lotteryId]);
    }

    function getMaxRange() external view returns (uint16) {
        return maxValidRange_;
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // Restricted Access Functions (onlyOwner)

    function updateSizeOfLottery(uint16 _newSize) external onlyOwner {
        require(sizeOfLottery_ != _newSize, "Cannot set to current size");
        require(sizeOfLottery_ != 0, "Lottery size cannot be 0");
        sizeOfLottery_ = _newSize;

        emit UpdatedSizeOfLottery(msg.sender, _newSize);
    }

    function updateMaxRange(uint16 _newMaxRange) external onlyOwner {
        require(maxValidRange_ != _newMaxRange, "Cannot set to current size");
        require(maxValidRange_ != 0, "Max range cannot be 0");
        maxValidRange_ = _newMaxRange;

        emit UpdatedMaxRange(msg.sender, _newMaxRange);
    }

    function getWiningNumbers(uint256 _lotteryId) external {
        // require(allLotteries_[_lotteryId].lotteryStatus == Status.Completed, "Draw numbers first");
        allLotteries_[_lotteryId].winningNumbers = [1, 1, 1, 1, 5, 6, 7, 8, 9];
        // console.log(" ~ file: SweetpadLotteryMock.sol ~ line 172", allLotteries_[_lotteryId].winningNumbers[0]);
    }

    // * @param   _prizeDistribution An array defining the distribution of the
    //  *          prize pool. I.e if a lotto has 5 numbers, the distribution could
    //  *          be [5, 10, 15, 20, 30] = 100%. This means if you get one number
    //  *          right you get 5% of the pool, 2 matching would be 10% and so on.
    //  * @param   _prizePoolInCake The amount of Cake available to win in this
    //  *          lottery.

    /**
     * @param   _startingTimestamp The block timestamp for the beginning of the
     *          lottery.
     * @param   _closingTimestamp The block timestamp after which no more tickets
     *          will be sold for the lottery. Note that this timestamp MUST
     *          be after the starting block timestamp.
     */
    //  TODO add functionaliti to connect lottery and ido
    function createNewLotto(
        // uint8[] calldata _prizeDistribution,
        // uint256 _prizePoolInCake,
        // uint256 _costPerTicket,
        uint256 _startingTimestamp,
        uint256 _closingTimestamp,
        address _ido
    ) external onlyOwner returns (uint256 lotteryId) {
        // require(
        //     _prizeDistribution.length == sizeOfLottery_,
        //     "Invalid distribution"
        // );
        // uint256 prizeDistributionTotal = 0;
        // for (uint256 j = 0; j < _prizeDistribution.length; j++) {
        //     prizeDistributionTotal = prizeDistributionTotal.add(
        //         uint256(_prizeDistribution[j])
        //     );
        // }
        // Ensuring that prize distribution total is 100%
        // require(
        //     prizeDistributionTotal == 100,
        //     "Prize distribution is not 100%"
        // );
        // require(
        //     _prizePoolInCake != 0 && _costPerTicket != 0,
        //     "Prize or cost cannot be 0"
        // );
        // require(_startingTimestamp != 0 && _startingTimestamp < _closingTimestamp, "Timestamps for lottery invalid");
        require(idoToId[_ido] == 0, "SweetpadLottery: Lottery for current IDO contract was already created");
        // Incrementing lottery ID
        lotteryIdCounter_ = lotteryIdCounter_ + 1;
        lotteryId = lotteryIdCounter_;
        uint16[] memory winningNumbers = new uint16[](sizeOfLottery_);
        Status lotteryStatus;
        // if (_startingTimestamp >= block.timestamp) {
        lotteryStatus = Status.Open;
        // } else {
        //     lotteryStatus = Status.NotStarted;
        // }
        // Saving data in struct
        LottoInfo memory newLottery = LottoInfo(
            lotteryId,
            lotteryStatus,
            _ido,
            // _prizePoolInCake,
            // _costPerTicket,
            // _prizeDistribution,
            _startingTimestamp,
            _closingTimestamp,
            winningNumbers
        );
        allLotteries_[lotteryId] = newLottery;
        idoToId[_ido] = lotteryId;
        // TODO fix
        // Emitting important information around new lottery.
        // emit LotteryOpen(
        //     lotteryId,
        //     nft_.getTotalSupply()
        // );
    }

    //-------------------------------------------------------------------------
    // General Access Functions

    // claim reward don't remove!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // function claimReward(uint256 _lotteryId, uint256 _tokenId) external notContract() {
    //     // Checking the lottery is in a valid time for claiming
    //     require(
    //         allLotteries_[_lotteryId].closingTimestamp <= block.timestamp,
    //         "Wait till end to claim"
    //     );
    //     // Checks the lottery winning numbers are available
    //     require(
    //         allLotteries_[_lotteryId].lotteryStatus == Status.Completed,
    //         "Winning Numbers not chosen yet"
    //     );
    //     require(
    //         nft_.getOwnerOfTicket(_tokenId) == msg.sender,
    //         "Only the owner can claim"
    //     );
    //     // Sets the claim of the ticket to true (if claimed, will revert)
    //     require(
    //         nft_.claimTicket(_tokenId, _lotteryId),
    //         "Numbers for ticket invalid"
    //     );
    //     // Getting the number of matching tickets
    //     uint8 matchingNumbers = _getNumberOfMatching(
    //         nft_.getTicketNumbers(_tokenId),
    //         allLotteries_[_lotteryId].winningNumbers
    //     );
    //     // Getting the prize amount for those matching tickets
    //     uint256 prizeAmount = _prizeForMatching(
    //         matchingNumbers,
    //         _lotteryId
    //     );
    //     // Removing the prize amount from the pool
    //     allLotteries_[_lotteryId].prizePoolInCake = allLotteries_[_lotteryId].prizePoolInCake.sub(prizeAmount);
    //     // Transfering the user their winnings
    //     cake_.safeTransfer(address(msg.sender), prizeAmount);
    // }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    //-------------------------------------------------------------------------

    // TODO start tickets ids from 1 and check if user number is 0 breack
    // TODO fix functionality
    function getNumberOfMatching(uint16[] memory _usersNumbers, uint16[] memory _winningNumbers)
        public
        pure
        returns (uint8 noOfMatching)
    {
        // Loops through all wimming numbers
        for (uint256 i = 0; i < _winningNumbers.length; i++) {
            // If the winning numbers and user numbers match
            if (_usersNumbers[i] == _winningNumbers[i]) {
                // The number of matching numbers incrases
                noOfMatching += 1;
            }
        }
    }

    function _split() public view returns (uint16[] memory) {
        // Temparary storage for winning numbers
        uint16[] memory winningNumbers = new uint16[](sizeOfLottery_);
        // Loops the size of the number of tickets in the lottery
        for (uint256 i = 0; i < sizeOfLottery_; i++) {
            uint256 duplicated;
            // Encodes the random number with its position in loop
            bytes32 hashOfRandom = keccak256(
                abi.encodePacked("0x8ba28b464185c48a3e1a05aec7116d926a90695d7360ceac9cc4b8e4369b52e5", i)
            );
            // Casts random number hash into uint256
            uint256 numberRepresentation = uint256(hashOfRandom);
            // Sets the winning number position to a uint16 of random hash number
            for (uint256 j = 0; j < winningNumbers.length; j++) {
                if (winningNumbers[j] > 0) {
                    if (winningNumbers[j] == uint16(numberRepresentation.mod(maxValidRange_))) {
                        duplicated += 1;
                    }
                }
            }
            if (duplicated > 0) {
                continue;
            }
            winningNumbers[i] = uint16(numberRepresentation.mod(maxValidRange_));
        }
        return winningNumbers;
    }

    function getOpenLotteries() public view returns (uint256[] memory openLotteries) {
        for (uint256 i = 1; i <= lotteryIdCounter_; i++) {
            if (allLotteries_[i].closingTimestamp > block.timestamp) {
                openLotteries[i - 1] = allLotteries_[i].lotteryID;
            }
        }
        return openLotteries;
    }
}
