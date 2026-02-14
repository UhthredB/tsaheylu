// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/nft/contract/AyVitraya100.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC contract for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // Mint 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract AyVitraya100Test is Test {
    AyVitraya100 public nft;
    MockUSDC public usdc;

    address public owner = address(this);
    address public treasury = address(0x1);
    address public buyer1 = address(0x2);
    address public buyer2 = address(0x3);

    string constant BASE_URI = "ipfs://QmTest/";

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy NFT contract
        nft = new AyVitraya100(BASE_URI, address(usdc), treasury);

        // Fund buyers with USDC
        usdc.mint(buyer1, 10000 * 10**6); // 10k USDC
        usdc.mint(buyer2, 10000 * 10**6); // 10k USDC
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEPLOYMENT TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_Deployment() public view {
        assertEq(nft.name(), "Ay Vitraya First Hundred");
        assertEq(nft.symbol(), "AV100");
        assertEq(nft.MAX_SUPPLY(), 100);
        assertEq(nft.totalMinted(), 0);
        assertEq(nft.treasury(), treasury);
        assertFalse(nft.saleActive());
    }

    function test_InitialPricing() public view {
        assertEq(nft.TIER1_PRICE(), 10 * 10**6); // $10
        assertEq(nft.TIER2_PRICE(), 25 * 10**6); // $25
        assertEq(nft.TIER3_PRICE(), 50 * 10**6); // $50
        assertEq(nft.getCurrentPrice(), 10 * 10**6);
        assertEq(nft.getCurrentTier(), 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SALE CONTROL TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_ToggleSale() public {
        assertFalse(nft.saleActive());
        nft.toggleSale();
        assertTrue(nft.saleActive());
        nft.toggleSale();
        assertFalse(nft.saleActive());
    }

    function test_OnlyOwnerCanToggleSale() public {
        vm.prank(buyer1);
        vm.expectRevert();
        nft.toggleSale();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PURCHASE TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_CannotPurchaseWhenSaleInactive() public {
        vm.startPrank(buyer1);
        usdc.approve(address(nft), 10 * 10**6);

        vm.expectRevert(AyVitraya100.SaleNotActive.selector);
        nft.purchase();
        vm.stopPrank();
    }

    function test_SinglePurchase() public {
        // Enable sale
        nft.toggleSale();

        // Buyer1 purchases
        vm.startPrank(buyer1);
        usdc.approve(address(nft), 10 * 10**6);
        nft.purchase();
        vm.stopPrank();

        // Verify
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.ownerOf(1), buyer1);
        assertEq(nft.balanceOf(buyer1), 1);
        assertEq(usdc.balanceOf(address(nft)), 10 * 10**6);
    }

    function test_BatchPurchase() public {
        nft.toggleSale();

        // Buy 5 NFTs
        vm.startPrank(buyer1);
        usdc.approve(address(nft), 50 * 10**6);
        nft.purchaseBatch(5);
        vm.stopPrank();

        assertEq(nft.totalMinted(), 5);
        assertEq(nft.balanceOf(buyer1), 5);
        assertEq(usdc.balanceOf(address(nft)), 50 * 10**6);
    }

    function test_CannotPurchaseZero() public {
        nft.toggleSale();

        vm.startPrank(buyer1);
        vm.expectRevert(AyVitraya100.InvalidQuantity.selector);
        nft.purchaseBatch(0);
        vm.stopPrank();
    }

    function test_CannotPurchaseMoreThanMax() public {
        nft.toggleSale();

        vm.startPrank(buyer1);
        vm.expectRevert(AyVitraya100.InvalidQuantity.selector);
        nft.purchaseBatch(11); // MAX_PER_TX is 10
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER PRICING TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_Tier1Pricing() public {
        nft.toggleSale();

        // Mint 70 NFTs (entire tier 1)
        vm.startPrank(buyer1);
        usdc.approve(address(nft), 700 * 10**6);
        nft.purchaseBatch(10);
        nft.purchaseBatch(10);
        nft.purchaseBatch(10);
        nft.purchaseBatch(10);
        nft.purchaseBatch(10);
        nft.purchaseBatch(10);
        nft.purchaseBatch(10);
        vm.stopPrank();

        assertEq(nft.totalMinted(), 70);
        assertEq(nft.getCurrentTier(), 2);
        assertEq(nft.getCurrentPrice(), 25 * 10**6);
    }

    function test_CrossTierPurchase() public {
        nft.toggleSale();

        // Owner mints 68 NFTs to get close to tier boundary
        nft.ownerMint(buyer1, 68);

        // Now buy 5 more (2 in tier 1, 3 in tier 2)
        uint256 expectedCost = (2 * 10 * 10**6) + (3 * 25 * 10**6);

        vm.startPrank(buyer2);
        usdc.approve(address(nft), expectedCost);
        nft.purchaseBatch(5);
        vm.stopPrank();

        assertEq(nft.totalMinted(), 73);
        assertEq(usdc.balanceOf(address(nft)), expectedCost);
    }

    function test_CalculateBatchCost() public {
        // At start (tier 1)
        uint256 cost1 = nft.calculateBatchCost(10);
        assertEq(cost1, 100 * 10**6); // 10 × $10

        // Mint 68, then check cost for 5
        nft.ownerMint(buyer1, 68);
        uint256 cost2 = nft.calculateBatchCost(5);
        assertEq(cost2, (2 * 10 * 10**6) + (3 * 25 * 10**6));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // OWNER FUNCTIONS TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_OwnerMint() public {
        nft.ownerMint(buyer1, 5);
        assertEq(nft.totalMinted(), 5);
        assertEq(nft.balanceOf(buyer1), 5);
    }

    function test_OnlyOwnerCanMint() public {
        vm.prank(buyer1);
        vm.expectRevert();
        nft.ownerMint(buyer1, 1);
    }

    function test_SetTreasury() public {
        address newTreasury = address(0x999);
        nft.setTreasury(newTreasury);
        assertEq(nft.treasury(), newTreasury);
    }

    function test_CannotSetZeroAddressTreasury() public {
        vm.expectRevert(AyVitraya100.InvalidAddress.selector);
        nft.setTreasury(address(0));
    }

    function test_Withdraw() public {
        nft.toggleSale();

        // Buyer purchases
        vm.startPrank(buyer1);
        usdc.approve(address(nft), 100 * 10**6);
        nft.purchaseBatch(10);
        vm.stopPrank();

        // Owner withdraws
        uint256 treasuryBefore = usdc.balanceOf(treasury);
        nft.withdraw();
        uint256 treasuryAfter = usdc.balanceOf(treasury);

        assertEq(treasuryAfter - treasuryBefore, 100 * 10**6);
        assertEq(usdc.balanceOf(address(nft)), 0);
    }

    function test_CannotWithdrawWithZeroBalance() public {
        vm.expectRevert(AyVitraya100.NoFundsToWithdraw.selector);
        nft.withdraw();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAUSE TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_Pause() public {
        nft.toggleSale();
        nft.pause();

        vm.startPrank(buyer1);
        usdc.approve(address(nft), 10 * 10**6);
        vm.expectRevert();
        nft.purchase();
        vm.stopPrank();
    }

    function test_Unpause() public {
        nft.toggleSale();
        nft.pause();
        nft.unpause();

        vm.startPrank(buyer1);
        usdc.approve(address(nft), 10 * 10**6);
        nft.purchase();
        vm.stopPrank();

        assertEq(nft.totalMinted(), 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUPPLY LIMIT TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_CannotExceedMaxSupply() public {
        nft.ownerMint(buyer1, 100);

        nft.toggleSale();

        vm.startPrank(buyer1);
        usdc.approve(address(nft), 10 * 10**6);
        vm.expectRevert(AyVitraya100.SoldOut.selector);
        nft.purchase();
        vm.stopPrank();
    }

    function test_TokenURI() public {
        nft.ownerMint(buyer1, 1);
        string memory uri = nft.tokenURI(1);
        assertEq(uri, "ipfs://QmTest/1");
    }

    function test_SetBaseURI() public {
        string memory newURI = "ipfs://QmNewCID/";
        nft.setBaseURI(newURI);

        nft.ownerMint(buyer1, 1);
        string memory uri = nft.tokenURI(1);
        assertEq(uri, "ipfs://QmNewCID/1");
    }
}
