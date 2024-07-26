// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IAward {
    function canTransfer() external view returns (bool);

    function transferSetting(bool value) external;

    function burnSetting(bool value) external;

    function mint(address to, uint256 value) external;

    function burn(uint256 value) external;
}
