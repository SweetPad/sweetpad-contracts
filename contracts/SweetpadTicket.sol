// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/ISweetpadTicket.sol";
import "./interfaces/ISweetpadNFT.sol";
import "./interfaces/ISweetpadNFTFreezing.sol";
import "hardhat/console.sol";

contract SweetpadTicket is ISweetpadTicket, ERC721, Ownable {
    uint256 public override totalTickets;
    // TODO check if fe need this
    ISweetpadNFT public sweetpadNFT;
    ISweetpadNFTFreezing public nftFreezing;

    uint256 private constant BLOCKS_PER_DAY = 10; // TODO for mainnet change to 28674
    uint256 private constant MAX_PERIOD = 1095 * BLOCKS_PER_DAY;

    mapping(address => uint256) public currentId;

    struct NFTData {
        // Account that froze NFT
        address freezer;
        // block after which freezer can unfreeze NFT
        uint256 freezeEndBlock;
        // Block number to freez
        uint256 period;
    }

    constructor(ISweetpadNFT sweetpadNFT_) ERC721("Sweet Ticket", "SWTT") {
        sweetpadNFT = sweetpadNFT_;
    }

    function setNFTFreezing(ISweetpadNFTFreezing nftFreezing_) external onlyOwner {
        nftFreezing = nftFreezing_;
    }

    function mint(
        address to_,
        uint256 amount_, 
        address sweetpadIdo_ 
    ) external override onlyOwner {
        // TODO
        for (uint256 i; i < amount_; i++) {
            currentId[sweetpadIdo_]++;
            _mint(to_, currentId[sweetpadIdo_]);
            nftFreezing.addTickets(to_, sweetpadIdo_, currentId[sweetpadIdo_]);
        }
    }

// TODO fix to revert safeTransferFrom too
    function transferFrom(
        address,
        address,
        uint256
    ) public virtual override(ERC721, IERC721) {
        revert("SweetpadTicket: can't transfer tickets");
    }
}
