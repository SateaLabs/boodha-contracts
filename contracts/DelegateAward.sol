// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAward.sol";

abstract contract DelegateAward is Ownable, IAward {
    error DelegateUnauthorizedAccount(address account);

    error DelegateNotCanTransfer(bool value);

    error DelegateNotCanBurn(bool value);

    int256 public cap = -1;

    bool public canTransfer;

    bool public canBurn;

    address public delegate;

    mapping(address => bool) public whileList;

    constructor(address _delegate, bool _canTransfer, bool _canBurn) {
        delegate = _delegate;
        canTransfer = _canTransfer;
        canBurn = _canBurn;
    }

    modifier onlyDelegate() {
        if (delegate != msg.sender) {
            revert DelegateUnauthorizedAccount(msg.sender);
        }
        _;
    }

    modifier checkCanTransfer(address from, address to) {
        if (
            from != address(0) &&
            to != address(0) &&
            !canTransfer &&
            whileList[to] != true
        ) {
            revert DelegateNotCanTransfer(canTransfer);
        }
        _;
    }

    modifier checkCanBurn() {
        if (!canBurn) {
            revert DelegateNotCanBurn(canBurn);
        }
        _;
    }

    function setWhileList(address account, bool value) external onlyOwner {
        whileList[account] = value;
    }

    function setDelegate(address _delegate) external onlyOwner {
        delegate = _delegate;
    }

    function capSetting(int256 value) external onlyOwner {
        cap = value;
    }

    function transferSetting(bool value) external override onlyOwner {
        canTransfer = value;
    }

    function burnSetting(bool value) external override onlyOwner {
        canBurn = value;
    }
}
