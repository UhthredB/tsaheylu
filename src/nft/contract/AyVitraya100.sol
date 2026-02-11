// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AyVitraya100
 * @notice Fixed-supply 100-piece NFT collection for the Ay Vitraya First Hundred.
 *         Only the contract owner (deployer) can mint. No burn, no royalties.
 */
contract AyVitraya100 is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 100;
    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;

    constructor(string memory baseURI)
        ERC721("Ay Vitraya First Hundred", "AV100")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseURI;
    }

    /// @notice Mint a single NFT to `to`. Only callable by the contract owner.
    function mint(address to) external onlyOwner {
        require(_nextTokenId <= MAX_SUPPLY, "All 100 minted");
        _safeMint(to, _nextTokenId);
        _nextTokenId++;
    }

    /// @notice Mint `count` NFTs to `to` in one transaction.
    function mintBatch(address to, uint256 count) external onlyOwner {
        require(_nextTokenId + count - 1 <= MAX_SUPPLY, "Exceeds max supply");
        for (uint256 i = 0; i < count; i++) {
            _safeMint(to, _nextTokenId);
            _nextTokenId++;
        }
    }

    /// @notice Returns how many tokens have been minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Update the base URI (e.g. after uploading metadata to IPFS).
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
