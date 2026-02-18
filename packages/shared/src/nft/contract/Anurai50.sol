// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Anurai50
 * @notice NFT collection - 50 supply at $100 USDC each
 */
contract Anurai50 is ERC721, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_SUPPLY = 50;
    uint256 public constant MAX_PER_TX = 10;
    uint256 public constant PRICE = 100 * 10**6; // $100 USDC

    IERC20 public immutable USDC;

    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;
    address public treasury;
    bool public saleActive;

    event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event NFTBatchPurchased(address indexed buyer, uint256 startTokenId, uint256 count, uint256 totalCost);
    event SaleToggled(bool active);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event BaseURIUpdated(string newBaseURI);

    error SaleNotActive();
    error SoldOut();
    error InvalidQuantity();
    error InvalidAddress();
    error NoFundsToWithdraw();

    constructor(
        string memory baseURI,
        address usdcAddress,
        address treasuryAddress
    )
        ERC721("Anurai Fifty", "ANU50")
        Ownable(msg.sender)
    {
        if (usdcAddress == address(0) || treasuryAddress == address(0)) {
            revert InvalidAddress();
        }

        _baseTokenURI = baseURI;
        USDC = IERC20(usdcAddress);
        treasury = treasuryAddress;
    }

    function purchase() external nonReentrant whenNotPaused {
        if (!saleActive) revert SaleNotActive();
        if (_nextTokenId > MAX_SUPPLY) revert SoldOut();

        uint256 tokenId = _nextTokenId;

        USDC.safeTransferFrom(msg.sender, address(this), PRICE);
        _safeMint(msg.sender, tokenId);
        _nextTokenId++;

        emit NFTPurchased(msg.sender, tokenId, PRICE);
    }

    function purchaseBatch(uint256 count) external nonReentrant whenNotPaused {
        if (!saleActive) revert SaleNotActive();
        if (count == 0 || count > MAX_PER_TX) revert InvalidQuantity();
        if (_nextTokenId + count - 1 > MAX_SUPPLY) revert SoldOut();

        uint256 totalCost = PRICE * count;
        uint256 startTokenId = _nextTokenId;

        USDC.safeTransferFrom(msg.sender, address(this), totalCost);

        for (uint256 i = 0; i < count; i++) {
            _safeMint(msg.sender, _nextTokenId);
            _nextTokenId++;
        }

        emit NFTBatchPurchased(msg.sender, startTokenId, count, totalCost);
    }

    function getCurrentPrice() public pure returns (uint256) {
        return PRICE;
    }

    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    function getContractBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }

    function calculateBatchCost(uint256 count) external pure returns (uint256) {
        if (count == 0 || count > MAX_PER_TX) return 0;
        return PRICE * count;
    }

    function toggleSale() external onlyOwner {
        saleActive = !saleActive;
        emit SaleToggled(saleActive);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = USDC.balanceOf(address(this));
        if (balance == 0) revert NoFundsToWithdraw();

        USDC.safeTransfer(treasury, balance);
        emit FundsWithdrawn(treasury, balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function ownerMint(address to, uint256 count) external onlyOwner {
        if (_nextTokenId + count - 1 > MAX_SUPPLY) revert SoldOut();

        for (uint256 i = 0; i < count; i++) {
            _safeMint(to, _nextTokenId);
            _nextTokenId++;
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
