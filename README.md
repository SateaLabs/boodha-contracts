# boodha-contracts

## 初始化
```
yarn install 
```

## 测试
```
npx hardhat test
```

## 合并文件
```
npx hardhat flatten contracts/Claimer.sol > release/Claimer-all.txt
npx hardhat flatten contracts/Karma.sol > release/Karma-all.txt
npx hardhat flatten contracts/NFTAward.sol > release/NFTAward-all.txt
```

## 合约地址
| Contract      | berachain Bartio Testnet | berachain Bartio Mainnet |
| ----------- | ----------- | ----------- |
| Claimer      | 0x8CAF0509c74363c938aCD2A33D2c9745Ed0863fa       |  0x  |
| Karma   | 0x2979be6395f92Dca5B6d99393F7446c5D98808C2        |  0x  |
| NFTAward-Test   | 0x9594fcdb0a6d691cdff0026750268D3Ce7F254e5        |  0x   |


## 奖品领取
> 奖品分为ERC20 和 ERC721两种，只能使用代理合约才能领取，合约只负责链上奖品的领取

### 流程
1. 用户完成活动，服务端记录认证
2. 服务端为用户生成领取奖品的签名认证
3. 用户使用签名认证调用合约领取奖品

### 技术细节

* 签名

| 参数      | 类型      | 
| ----------- | ----------- |
| 调用合约的钱包地址      | address       | 
| 接收奖品的钱包地址   | address        |
| 奖品合约地址   | address        |
| 奖品数量   | uint256        |
| 开始时间   | uint256        |
| 领取奖品的唯一序列   | bytes32        |


* 领取奖品

使用Claimer合约地址调用合约方法claim 或者 batchClaim。

1. claim
```
    function claim(
        address to,
        address delegateAward,
        uint256 number,
        uint256 startTime,
        bytes32 sequenceId,
        bytes memory sign
    ) public {

    }
```
2. batchClaim
```
    function batchClaim(
        address to,
        uint256 startTime,
        address[] memory _delegateAwards,
        uint256[] memory numbers,
        bytes32[] memory sequenceIds,
        bytes[] memory signs
    ) external {}
```



