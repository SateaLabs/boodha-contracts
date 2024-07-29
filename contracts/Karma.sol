// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./DelegateAward.sol";

contract Karma is Ownable, DelegateAward, ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        address _delegate,
        bool _canTransfer,
        bool _canBurn
    )
        Ownable(msg.sender)
        DelegateAward(_delegate, _canTransfer, _canBurn)
        ERC20(name_, symbol_)
    {}

    function mint(address to, uint256 value) external override onlyDelegate {
        uint256 _totalSupply = totalSupply();
        if (cap == -1 || int256(_totalSupply + value) <= cap) {
            _mint(to, value);
        } else {
            revert("cap!");
        }
    }

    function burn(uint256 value) external override checkCanBurn {
        _burn(msg.sender, value);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override checkCanTransfer(from, to) {
        super._update(from, to, value);
    }
}
