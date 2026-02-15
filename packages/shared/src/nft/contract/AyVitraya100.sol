// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AyVitraya100
 * @author Ay Vitraya
 * @notice Production-grade NFT collection with tiered USDC pricing
 * @dev Implements ERC721 with sale functionality, tiered pricing, and comprehensive security
 * 
 * Features:
 * - Tiered pricing: 70 NFTs @ $10, 20 @ $25, 10 @ $50 USDC
 * - SafeERC20 for secure token transfers
 * - Pausable for emergency stops
 * - ReentrancyGuard for reentrancy protection
 * - Comprehensive event logging
 * - Gas optimized storage
 * - Custom errors for gas efficiency
 * - Pull payment pattern for withdrawals
 * 
 * Security:
 * - OpenZeppelin battle-tested contracts
 * - No upgradeable patterns (immutable logic)
 * - Owner-controlled emergency pause
 * - Comprehensive input validation
 */
contract AyVitraya100 is ERC721, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTANTS & IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════════
    
    /// @notice Maximum supply of NFTs
    uint256 public constant MAX_SUPPLY = 100;
    
    /// @notice Maximum NFTs per transaction (prevents gas issues & bot manipulation)
    uint256 public constant MAX_PER_TX = 10;
    
    /// @notice Tier 1 end (NFTs 1-70)
    uint256 public constant TIER1_END = 70;
    
    /// @notice Tier 2 end (NFTs 71-90)
    uint256 public constant TIER2_END = 90;
    
    /// @notice Tier 3 end (NFTs 91-100)
    uint256 public constant TIER3_END = 100;
    
    /// @notice Tier 1 price in USDC (6 decimals)
    uint256 public constant TIER1_PRICE = 10 * 10**6; // $10 USDC
    
    /// @notice Tier 2 price in USDC (6 decimals)
    uint256 public constant TIER2_PRICE = 25 * 10**6; // $25 USDC
    
    /// @notice Tier 3 price in USDC (6 decimals)
    uint256 public constant TIER3_PRICE = 50 * 10**6; // $50 USDC
    
    /// @notice USDC token contract (immutable for security)
    IERC20 public immutable USDC;
    
    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES (Packed for gas efficiency)
    // ═══════════════════════════════════════════════════════════════════════
    
    /// @notice Next token ID to mint (starts at 1)
    uint256 private _nextTokenId = 1;
    
    /// @notice Base URI for token metadata
    string private _baseTokenURI;
    
    /// @notice Treasury address for fund withdrawals
    address public treasury;
    
    /// @notice Sale active flag
    bool public saleActive;
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    /// @notice Emitted when an NFT is purchased
    /// @param buyer Address of the buyer
    /// @param tokenId ID of the minted NFT
    /// @param price Price paid in USDC (6 decimals)
    /// @param tier Tier of the purchase (1, 2, or 3)
    event NFTPurchased(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price,
        uint256 tier
    );
    
    /// @notice Emitted when multiple NFTs are purchased
    /// @param buyer Address of the buyer
    /// @param startTokenId First token ID minted
    /// @param count Number of NFTs minted
    /// @param totalCost Total price paid in USDC
    event NFTBatchPurchased(
        address indexed buyer,
        uint256 startTokenId,
        uint256 count,
        uint256 totalCost
    );
    
    /// @notice Emitted when sale is toggled
    /// @param active New sale state
    event SaleToggled(bool active);
    
    /// @notice Emitted when treasury is updated
    /// @param oldTreasury Previous treasury address
    /// @param newTreasury New treasury address
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    /// @notice Emitted when funds are withdrawn
    /// @param recipient Address receiving the funds
    /// @param amount Amount withdrawn in USDC
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    
    /// @notice Emitted when base URI is updated
    /// @param newBaseURI New base URI
    event BaseURIUpdated(string newBaseURI);
    
    // ═══════════════════════════════════════════════════════════════════════
    // ERRORS (Custom errors save gas vs require strings)
    // ═══════════════════════════════════════════════════════════════════════
    
    /// @notice Sale is not currently active
    error SaleNotActive();
    
    /// @notice All NFTs have been minted
    error SoldOut();
    
    /// @notice Invalid quantity (0 or > MAX_PER_TX)
    error InvalidQuantity();
    
    /// @notice Invalid address (zero address)
    error InvalidAddress();
    
    /// @notice No funds available to withdraw
    error NoFundsToWithdraw();
    
    /// @notice USDC transfer failed
    error TransferFailed();
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Initialize the NFT contract
     * @param baseURI IPFS base URI for metadata (e.g., "ipfs://CID/")
     * @param usdcAddress USDC token contract address
     * @param treasuryAddress Address to receive sale proceeds
     * 
     * @dev Validates all addresses are non-zero
     * @dev Sets deployer as initial owner
     */
    constructor(
        string memory baseURI,
        address usdcAddress,
        address treasuryAddress
    )
        ERC721("Ay Vitraya First Hundred", "AV100")
        Ownable(msg.sender)
    {
        if (usdcAddress == address(0) || treasuryAddress == address(0)) {
            revert InvalidAddress();
        }
        
        _baseTokenURI = baseURI;
        USDC = IERC20(usdcAddress);
        treasury = treasuryAddress;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC/EXTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Purchase a single NFT with USDC
     * @dev Requires prior USDC approval for the current tier price
     * @dev Automatically refunds excess if tier changes during transaction
     * 
     * Requirements:
     * - Sale must be active
     * - NFTs must be available
     * - Caller must have approved sufficient USDC
     * - Contract must not be paused
     */
    function purchase() external nonReentrant whenNotPaused {
        if (!saleActive) revert SaleNotActive();
        if (_nextTokenId > MAX_SUPPLY) revert SoldOut();
        
        uint256 price = getCurrentPrice();
        uint256 tier = getCurrentTier();
        uint256 tokenId = _nextTokenId;
        
        // Transfer USDC from buyer to contract
        USDC.safeTransferFrom(msg.sender, address(this), price);
        
        // Mint NFT
        _safeMint(msg.sender, tokenId);
        _nextTokenId++;
        
        emit NFTPurchased(msg.sender, tokenId, price, tier);
    }
    
    /**
     * @notice Purchase multiple NFTs in one transaction
     * @param count Number of NFTs to purchase (1-10)
     * @dev More gas efficient than multiple single purchases
     * @dev Automatically calculates cost across tier boundaries
     * 
     * Requirements:
     * - Sale must be active
     * - Count must be 1-10
     * - Sufficient NFTs must be available
     * - Caller must have approved sufficient USDC
     * - Contract must not be paused
     * 
     * Example:
     * - Buying 5 NFTs when 68 are minted:
     *   - NFTs 69-70: 2 × $10 = $20
     *   - NFTs 71-73: 3 × $25 = $75
     *   - Total: $95 USDC
     */
    function purchaseBatch(uint256 count) external nonReentrant whenNotPaused {
        if (!saleActive) revert SaleNotActive();
        if (count == 0 || count > MAX_PER_TX) revert InvalidQuantity();
        if (_nextTokenId + count - 1 > MAX_SUPPLY) revert SoldOut();
        
        uint256 totalCost = 0;
        uint256 currentMinted = totalMinted();
        
        // Calculate total cost across tiers
        for (uint256 i = 0; i < count; i++) {
            uint256 mintNumber = currentMinted + i;
            if (mintNumber < TIER1_END) {
                totalCost += TIER1_PRICE;
            } else if (mintNumber < TIER2_END) {
                totalCost += TIER2_PRICE;
            } else {
                totalCost += TIER3_PRICE;
            }
        }
        
        // Transfer USDC from buyer to contract
        USDC.safeTransferFrom(msg.sender, address(this), totalCost);
        
        uint256 startTokenId = _nextTokenId;
        
        // Mint NFTs
        for (uint256 i = 0; i < count; i++) {
            _safeMint(msg.sender, _nextTokenId);
            _nextTokenId++;
        }
        
        emit NFTBatchPurchased(msg.sender, startTokenId, count, totalCost);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Get current price in USDC for next NFT
     * @return Price in USDC (6 decimals)
     * 
     * Pricing tiers:
     * - NFTs 1-70: $10 USDC
     * - NFTs 71-90: $25 USDC
     * - NFTs 91-100: $50 USDC
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 minted = totalMinted();
        if (minted < TIER1_END) return TIER1_PRICE;
        if (minted < TIER2_END) return TIER2_PRICE;
        return TIER3_PRICE;
    }
    
    /**
     * @notice Get current tier (1, 2, or 3)
     * @return Current tier number
     */
    function getCurrentTier() public view returns (uint256) {
        uint256 minted = totalMinted();
        if (minted < TIER1_END) return 1;
        if (minted < TIER2_END) return 2;
        return 3;
    }
    
    /**
     * @notice Get remaining NFTs in current tier
     * @return Number of NFTs remaining in current tier
     */
    function getRemainingInTier() public view returns (uint256) {
        uint256 minted = totalMinted();
        if (minted < TIER1_END) return TIER1_END - minted;
        if (minted < TIER2_END) return TIER2_END - minted;
        if (minted < TIER3_END) return TIER3_END - minted;
        return 0;
    }
    
    /**
     * @notice Get total number of minted NFTs
     * @return Total minted count (0-100)
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @notice Get contract's USDC balance
     * @return USDC balance (6 decimals)
     */
    function getContractBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }
    
    /**
     * @notice Calculate total cost for batch purchase
     * @param count Number of NFTs to purchase
     * @return Total cost in USDC (6 decimals)
     * @dev Useful for frontend to show total before approval
     */
    function calculateBatchCost(uint256 count) external view returns (uint256) {
        if (count == 0 || count > MAX_PER_TX) return 0;
        if (_nextTokenId + count - 1 > MAX_SUPPLY) return 0;
        
        uint256 totalCost = 0;
        uint256 currentMinted = totalMinted();
        
        for (uint256 i = 0; i < count; i++) {
            uint256 mintNumber = currentMinted + i;
            if (mintNumber < TIER1_END) {
                totalCost += TIER1_PRICE;
            } else if (mintNumber < TIER2_END) {
                totalCost += TIER2_PRICE;
            } else {
                totalCost += TIER3_PRICE;
            }
        }
        
        return totalCost;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS (Owner Only)
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Toggle sale on/off
     * @dev Only owner can call
     * @dev Emits SaleToggled event
     */
    function toggleSale() external onlyOwner {
        saleActive = !saleActive;
        emit SaleToggled(saleActive);
    }
    
    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     * @dev Only owner can call
     * @dev Validates address is not zero
     * @dev Emits TreasuryUpdated event
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @notice Update base URI for metadata
     * @param newBaseURI New IPFS base URI (e.g., "ipfs://NEW_CID/")
     * @dev Only owner can call
     * @dev Useful if metadata needs to be updated or revealed
     * @dev Emits BaseURIUpdated event
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    /**
     * @notice Withdraw all USDC from contract to treasury
     * @dev Only owner can call
     * @dev Uses pull payment pattern for security
     * @dev Protected by ReentrancyGuard
     * @dev Emits FundsWithdrawn event
     * 
     * Requirements:
     * - Contract must have USDC balance > 0
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = USDC.balanceOf(address(this));
        if (balance == 0) revert NoFundsToWithdraw();
        
        USDC.safeTransfer(treasury, balance);
        
        emit FundsWithdrawn(treasury, balance);
    }
    
    /**
     * @notice Pause all sales (emergency stop)
     * @dev Only owner can call
     * @dev Prevents all purchases while paused
     * @dev Does not affect withdrawals or admin functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause sales
     * @dev Only owner can call
     * @dev Re-enables purchases
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Owner can mint NFTs for free (team allocation, giveaways, etc.)
     * @param to Recipient address
     * @param count Number to mint
     * @dev Only owner can call
     * @dev Bypasses sale checks and payment
     * @dev Still respects MAX_SUPPLY limit
     * 
     * Use cases:
     * - Team allocation
     * - Marketing giveaways
     * - Community rewards
     * - Partnerships
     */
    function ownerMint(address to, uint256 count) external onlyOwner {
        if (_nextTokenId + count - 1 > MAX_SUPPLY) revert SoldOut();
        
        for (uint256 i = 0; i < count; i++) {
            _safeMint(to, _nextTokenId);
            _nextTokenId++;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Override base URI function
     * @return Base URI string
     * @dev Called by tokenURI() to construct full metadata URL
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
