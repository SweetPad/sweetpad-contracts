// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./interfaces/ISweetpadTicket.sol";
import "./interfaces/ISweetpadFreezing.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
// TODO write Interfaces
import "./SweetpadLottery.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SweetpadIDO is AccessControl {
    using SafeERC20 for IERC20;
    ISweetpadTicket public sweetpadTicket;
    ISweetpadFreezing public sweetpadFreezing;
    ISweetpadNFTFreezing public sweetpadNFTFreezing;
    SweetpadLottery public sweetpadLottery;
    uint256 public percentForLottery;
    uint256 public percentForGuaranteedAllocation;
    uint256 public totalPower;
    uint256 public commission;
    uint256 public tokensToSell;
    uint256 public availableTokensToSell;
    uint256 public tokenPrice;
    // amount of BUSD per ticket that user can buy tokens
    uint256 public allocationPerTicket;
    uint256 public idoSaleStart;
    uint256 public idoSecondSaleStart;
    uint256 public idoSaleEnd;
    uint256 public idoSecondSaleEnd;
    // TODO set correct address
    IERC20 public BUSD = IERC20(0x6147Bc9c226748B47BFeA290f58CD0E5dC2E5D72);
    IERC20 public asset;
    // TODO add comment how to get value for role
    bytes32 public constant CLIENT_ROLE = 0xa5ff3ec7a96cdbba4d2d5172d66bbc73c6db3885f29b21be5da9fa7a7c025232;
    mapping(address => bool) public unlockedToSecondStage;
    mapping(address => uint256) public tokensBoughtFirstStage;
    mapping(address => uint256) public tokensBoughtSecondStage;
    uint256 private powerForSecondStage;

    constructor(
        ISweetpadTicket sweetpadTicket_,
        ISweetpadFreezing sweetpadFreezing_,
        ISweetpadNFTFreezing sweetpadNFTFreezing_,
        SweetpadLottery sweetpadLottery_,
        IERC20 asset_,
        address client_,
        address admin_
    ) {
        sweetpadTicket = sweetpadTicket_;
        sweetpadFreezing = sweetpadFreezing_;
        sweetpadNFTFreezing = sweetpadNFTFreezing_;
        sweetpadLottery = sweetpadLottery_;
        asset = asset_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(CLIENT_ROLE, client_);
    }

    function setup(
        uint256 lotteryPercent_,
        uint256 guarantedPercent_,
        uint256 totalPower_,
        uint256 commission_,
        uint256 tokensToSell_,
        uint256 tokenPrice_,
        uint256 allocationPerTicket_,
        // block numbers to control ido sale start and end
        uint256 idoSaleStart_,
        uint256 idoSaleEnd_,
        uint256 idoSecondSaleStart_,
        uint256 idoSecondSaleEnd_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            lotteryPercent_ > 100 && lotteryPercent_ <= 1500,
            "SweetpadIDO: Trying to set incorrect percent for lottery allocation"
        );
        require(
            guarantedPercent_ >= 8500 && guarantedPercent_ <= 9900,
            "SweetpadIDO: Trying to set incorrect percent for guaranted allocation"
        );
        require(guarantedPercent_ + lotteryPercent_ == 10000, "SweetpadIDO: Incorrect percents");
        require(totalPower_ > 0, "SweetpadIDO: TotalPower can't be zero");
        require(tokensToSell_ > 0, "SweetpadIDO: TokensToSell can't be zero");
        require(tokenPrice_ > 0, "SweetpadIDO: TokenPrice can't be zero");
        require(allocationPerTicket_ > 0, "SweetpadIDO: Allocation per ticket can't be zero");
        require(idoSaleStart_ >= block.number, "SweetpadIDO: Invalid block number");
        require(idoSaleEnd_ > idoSaleStart_, "SweetpadIDO: IDO sale end block must be greater then start block");
        require(
            idoSecondSaleStart_ > idoSaleEnd_, 
            "SweetpadIDO: IDO second sale start block must be greater then first end block"
        );
        require(
            idoSecondSaleStart_ <= idoSecondSaleEnd_,
            "SweetpadIDO: IDO second sale end block must be greater then start block"
        );
        percentForLottery = lotteryPercent_;
        percentForGuaranteedAllocation = guarantedPercent_;
        totalPower = totalPower_;
        commission = commission_;
        tokensToSell = tokensToSell_;
        availableTokensToSell = tokensToSell_;
        tokenPrice = tokenPrice_;
        allocationPerTicket = allocationPerTicket_;

        idoSaleStart = idoSaleStart_;
        idoSaleEnd = idoSaleEnd_;
        idoSecondSaleStart = idoSecondSaleStart_;
        idoSecondSaleEnd = idoSecondSaleEnd_;
    }

    function buyFirstStage(uint256 amount_) external {
        require(idoSaleStart <= block.number && idoSaleEnd > block.number, "SweetpadIDO: Wrong period to buy");
        require(amount_ > 0, "SweetpadIDO: Amount must be greater then zero");
        uint256 userPower = sweetpadFreezing.totalPower(msg.sender);
        require(userPower > 0, "SweetpadIDO: User's power can't be zero");
        // TODO write view function and use it
        // TODO write view function to get availableTokenPrice and availabletokens count
        uint256 availableTokens = (tokensToSell * 1e18 * percentForGuaranteedAllocation * userPower) /
            10000 /
            totalPower;
        uint256 availableTokensPrice = (availableTokens * tokenPrice) /
            10000 /
            totalPower -
            tokensBoughtFirstStage[msg.sender];
        require(availableTokensPrice >= amount_, "SweetpadIDO: Trying to buy more then available");
        // User pays for tokens
        BUSD.safeTransferFrom(msg.sender, address(this), amount_);
        tokensBoughtFirstStage[msg.sender] += (amount_ * 1e18) / tokenPrice;
        // User get assets
        asset.safeTransfer(msg.sender, (amount_ * 1e18) / tokenPrice);
        availableTokensToSell -= (amount_ * 1e18) / tokenPrice;

        if (availableTokens - tokensBoughtFirstStage[msg.sender] == 0) {
            unlockedToSecondStage[msg.sender] = true;
            powerForSecondStage += userPower;
        }
    }

    function buySecondStage(uint256 amount_) external {
        require(
            idoSecondSaleStart <= block.number && idoSecondSaleEnd > block.number,
            "SweetpadIDO: Wrong period to buy"
        );
        require(amount_ > 0, "SweetpadIDO: Amount must be greater then zero");
        uint256 userPower = sweetpadFreezing.totalPower(msg.sender);
        require(userPower > 0, "SweetpadIDO: User's power can't be zero");
        require(unlockedToSecondStage[msg.sender], "SweetpadIDO: User can't buy tokens from second stage");
        uint256 availableTokensSecondStage = (availableTokensToSell * userPower) /
            powerForSecondStage -
            tokensBoughtSecondStage[msg.sender];
        require(
            availableTokensSecondStage >= tokensBoughtSecondStage[msg.sender],
            "SweetpadIDO: User already bought max amount of tokens"
        );
        uint256 availableTokensPriceSecondStage = availableTokensSecondStage * tokenPrice;
        require(availableTokensPriceSecondStage >= amount_, "SweetpadIDO: Trying to buy more then available");
        // User pays for tokens
        BUSD.safeTransferFrom(msg.sender, address(this), amount_);
        // User get assets
        asset.safeTransfer(msg.sender, (amount_ * 1e18) / tokenPrice);
        tokensBoughtSecondStage[msg.sender] += (amount_ * 1e18) / tokenPrice;
        availableTokensToSell -= (amount_ * 1e18) / tokenPrice;
    }

    function buyFromWonTickets(uint256 amount_) external {
        // uint256 numberOfTickets = getNumberOfWinningTickets(msg.sender);
        uint256 allocation = getAllocationFromLottery(msg.sender);
        require(allocation >= amount_, "SweetpadIDO: Insufficient allocation");
        // User pays for tokens
        BUSD.safeTransferFrom(msg.sender, address(this), amount_);
        // User get assets
        asset.safeTransfer(msg.sender, (amount_ * 1e18) / tokenPrice);
    }

    function getWinningTicketsNumber() external view returns (uint256) {
        return getNumberOfWinningTickets(msg.sender);
    }

    function getNumberOfWinningTickets(address user_) public view returns (uint256 numberOfWinningTickets) {
        uint16[] memory winningNumbers = (sweetpadLottery.getBasicLottoInfo(sweetpadLottery.idoToId(address(this))))
            .winningNumbers;
        uint256[] memory tickets = sweetpadNFTFreezing.getTicketsForIdo(user_, address(this));
        for (uint256 i; i < winningNumbers.length; i++) {
            for (uint256 j; j < tickets.length; j++) {
                if (tickets[j] == 0) {
                    continue;
                }
                if (winningNumbers[i] == tickets[j]) {
                    if (j != tickets.length - 1) {
                        tickets[j] = tickets[tickets.length - 1];
                    }
                    tickets[tickets.length - 1] = 0;
                    numberOfWinningTickets += 1;
                }
            }
        }
        return numberOfWinningTickets;
    }

    function getAllocationFromLottery(address user_) public view returns (uint256 allocation) {
        uint256 numberOfTickets = getNumberOfWinningTickets(user_);
        allocation = numberOfTickets * allocationPerTicket;
        return allocation;
    }
}
