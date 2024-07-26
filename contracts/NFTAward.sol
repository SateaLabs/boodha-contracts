// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./DelegateAward.sol";

contract NFTAward is Ownable, DelegateAward, ERC721Enumerable {
    string public baseURI;

    constructor(
        string memory name_,
        string memory symbol_,
        address _delegate,
        bool _canTransfer,
        bool _canBurn
    )
        Ownable(msg.sender)
        DelegateAward(_delegate, _canTransfer, _canBurn)
        ERC721(name_, symbol_)
    {}

    function tokenURI(uint256 tokenId) public override view virtual returns (string memory) {
       return _baseURI();
    }
    
    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function mint(address to, uint256 number) external override onlyDelegate {
        for (uint256 i = 0; i < number; i++) {
            uint256 tokenId = totalSupply();
            if (int256(tokenId) < cap || cap == -1) {
                _safeMint(to, tokenId);
            } else {
                break;
            }
        }
    }

    function burn(uint256 value) external override checkCanBurn {
        _burn(value);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override checkCanTransfer(to) returns (address) {
        return super._update(to, tokenId, auth);
    }
}
