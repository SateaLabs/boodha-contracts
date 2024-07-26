// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./DelegateAward.sol";

contract Claimer is Ownable {
    uint256 public lockTime = 10 minutes;

    address public adminSigner;

    mapping(address detegate => bool) public delegateAwards;
    mapping(bytes32 sequence => bool) public sequences;

    event Claim(
        address to,
        address delegateAward,
        uint256 number,
        bytes32 sequenceId
    );

    constructor(address _signer) Ownable(msg.sender) {
        adminSigner = _signer;
    }

    function updateSigner(address _signer) external onlyOwner {
        adminSigner = _signer;
    }

    function registerDelegateAwards(address _delegateAward) external onlyOwner {
        delegateAwards[_delegateAward] = true;
    }

    function unRegisterDelegateAwards(
        address _delegateAward
    ) external onlyOwner {
        delegateAwards[_delegateAward] = false;
    }

    function claim(
        address to,
        address delegateAward,
        uint256 number,
        uint256 startTime,
        bytes32 sequenceId,
        bytes memory sign
    ) public {
        require(!sequences[sequenceId], "sequence ID illegal");
        require(!delegateAwards[delegateAward], "delegate award illegal");
        require(block.timestamp - startTime < lockTime, "lock time expired");
        bytes32 _message = keccak256(
            abi.encodePacked(
                msg.sender,
                to,
                delegateAward,
                number,
                startTime,
                sequenceId
            )
        );
        bytes32 _hashMessage = MessageHashUtils.toEthSignedMessageHash(
            _message
        );
        address _signer = ECDSA.recover(_hashMessage, sign);
        require(adminSigner == _signer, "sign verify fail");
        sequences[sequenceId] = true;
        DelegateAward(delegateAward).mint(to, number);
        emit Claim(to, delegateAward, number, sequenceId);
    }

    function batchClaim(
        address to,
        uint256 startTime,
        address[] memory _delegateAwards,
        uint256[] memory numbers,
        bytes32[] memory sequenceIds,
        bytes[] memory signs
    ) external {
        require(_delegateAwards.length == numbers.length, "data1 illegal");
        require(_delegateAwards.length == sequenceIds.length, "data2 illegal");
        require(_delegateAwards.length == signs.length, "data3 illegal");
        for (uint256 i = 0; i < _delegateAwards.length; i++) {
            claim(
                to,
                _delegateAwards[i],
                numbers[i],
                startTime,
                sequenceIds[i],
                signs[i]
            );
        }
    }
}
