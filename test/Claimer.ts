import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Claimer", function () {
  const name = "Claimer token";
  const symbol = "Claimer"

  const TEN_MINUTES_IN_SECS = 60 ;


  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    const startTime = (await time.latest());

    // Contracts are deployed using the first signer/account by default
    const [signer, user1, user2] = await hre.ethers.getSigners();

    const Claimer = await hre.ethers.getContractFactory("Claimer");
    const claimer = await Claimer.deploy(signer.address);

    const Karma = await hre.ethers.getContractFactory("Karma");
    const karma = await Karma.deploy(name, symbol, claimer.getAddress(), true, true);

    const NFTAward = await hre.ethers.getContractFactory("NFTAward");
    const nFTAward = await NFTAward.deploy(name, symbol, claimer.getAddress(), true, true);

    await claimer.registerDelegateAwards(karma.getAddress());
    await claimer.registerDelegateAwards(nFTAward.getAddress());

    return { signer, user1, user2, claimer, karma, nFTAward, startTime };
  }

  describe("Deployment", function () {
    it("Should init setting the right", async function () {
      const { signer, user1, user2, claimer, karma, nFTAward } = await loadFixture(deployFixture);
      expect(await claimer.adminSigner()).to.be.equals(signer.address);
      await expect(claimer.updateSigner(user1.address)).not.to.be.reverted;
      expect(await claimer.adminSigner()).to.be.equals(user1.address);

      expect(await claimer.delegateAwards(karma.getAddress())).to.be.equals(true)
      expect(await claimer.delegateAwards(nFTAward.getAddress())).to.be.equals(true)

      await expect(claimer.registerDelegateAwards(karma.getAddress())).not.to.be.reverted;
      await expect(claimer.registerDelegateAwards(nFTAward.getAddress())).not.to.be.reverted;
      expect(await claimer.delegateAwards(karma.getAddress())).to.be.equals(true)
      expect(await claimer.delegateAwards(nFTAward.getAddress())).to.be.equals(true)

      await expect(claimer.unRegisterDelegateAwards(karma.getAddress())).not.to.be.reverted;
      await expect(claimer.unRegisterDelegateAwards(nFTAward.getAddress())).not.to.be.reverted;
      expect(await claimer.delegateAwards(karma.getAddress())).to.be.equals(false)
      expect(await claimer.delegateAwards(nFTAward.getAddress())).to.be.equals(false)

      expect(await claimer.updateLockTime(10)).not.to.be.reverted;
    });

    it("Should owner check the right", async function () {
      const { signer, user1, user2, claimer, karma, nFTAward } = await loadFixture(deployFixture);

      await expect(claimer.connect(user1).updateSigner(user1.address)).to.be.reverted;
      await expect(claimer.connect(user1).registerDelegateAwards(karma.getAddress())).to.be.reverted;
      await expect(claimer.connect(user1).unRegisterDelegateAwards(karma.getAddress())).to.be.reverted;
    });


    it("Should claim the right", async function () {
      const { signer, user1, user2, claimer, karma, nFTAward, startTime } = await loadFixture(deployFixture);

      const sequenceId = hre.ethers.keccak256(Buffer.from("111111111", 'utf8'));
      let message = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user1.address, await karma.getAddress(), 10, startTime, sequenceId]
      );
      const signature = await signer.signMessage(hre.ethers.getBytes(message));

      // console.log(await karma.getAddress());
      // console.log((await claimer.sequences(sequenceId)));
      // console.log(user1.address, (await karma.getAddress()), 10, sequenceId, signature)

      const currentTime2 = (await time.latest()) + TEN_MINUTES_IN_SECS * 1;
      await time.increaseTo(currentTime2);
      await expect(claimer.connect(user1).claim(user1.address, await karma.getAddress(), 10, startTime, sequenceId, signature)).not.to.be.reverted;
      expect(await karma.balanceOf(user1.address)).to.be.equals(10);

      const sequenceId2 = hre.ethers.keccak256(Buffer.from("22222222", 'utf8'));
      await expect(claimer.connect(user1).claim(user1.address, await karma.getAddress(), 10, startTime, sequenceId2, signature)).to.be.reverted;
      expect(await karma.balanceOf(user1.address)).to.be.equals(10);


    });

    it("Should claim lock expired the right", async function () {
      const { signer, user1, user2, claimer, karma, nFTAward, startTime } = await loadFixture(deployFixture);

      const sequenceId = hre.ethers.keccak256(Buffer.from("111111111", 'utf8'));
      let message = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user1.address, await karma.getAddress(), 10, startTime, sequenceId]
      );
      const signature = await signer.signMessage(hre.ethers.getBytes(message));

      const currentTime2 = (await time.latest()) + TEN_MINUTES_IN_SECS * 11;
      await time.increaseTo(currentTime2);
      await expect(claimer.connect(user1).claim(user1.address, await karma.getAddress(), 10, startTime, sequenceId, signature)).to.be.reverted;
      expect(await karma.balanceOf(user1.address)).to.be.equals(0);

    });



    it("Should batch claim the right", async function () {
      const { signer, user1, user2, claimer, karma, nFTAward ,startTime} = await loadFixture(deployFixture);
      const sequenceId1 = hre.ethers.keccak256(Buffer.from("111111111", 'utf8'));
      let message1 = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user2.address, await karma.getAddress(), 10,startTime, sequenceId1]
      );
      const signature1 = await signer.signMessage(hre.ethers.getBytes(message1));

      const sequenceId2 = hre.ethers.keccak256(Buffer.from("222222222", 'utf8'));
      let message2 = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user2.address, await nFTAward.getAddress(), 11,startTime, sequenceId2]
      );
      const signature2 = await signer.signMessage(hre.ethers.getBytes(message2));

      let delegateAwards = [await karma.getAddress(), await nFTAward.getAddress()];
      // console.log(delegateAwards)
      let numbers = [10, 11];
      // console.log(numbers)
      let sequenceIds = [sequenceId1, sequenceId2]
      // console.log(sequenceIds)
      let signs = [signature1, signature2]
      // console.log(signs)
      const currentTime = (await time.latest()) + TEN_MINUTES_IN_SECS * 1;
      await time.increaseTo(currentTime);
      await expect(claimer.connect(user1).batchClaim(user2.address,startTime,delegateAwards,numbers,sequenceIds,signs )).not.to.be.reverted;
      expect(await karma.balanceOf(user2.address)).to.be.equals(10);
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(11);

      await expect(claimer.connect(user1).batchClaim(user2.address,startTime,delegateAwards,numbers,sequenceIds,signs )).to.be.reverted;
      expect(await karma.balanceOf(user2.address)).to.be.equals(10);
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(11);


    });



    it("Should batch claim exception1 the right", async function () {
      const { signer, user1, user2, claimer, karma, nFTAward,startTime } = await loadFixture(deployFixture);
      const sequenceId1 = hre.ethers.keccak256(Buffer.from("111111111", 'utf8'));
      let message1 = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user2.address, await karma.getAddress(), 10,startTime, sequenceId1]
      );
      const signature1 = await signer.signMessage(hre.ethers.getBytes(message1));

      const sequenceId2 = hre.ethers.keccak256(Buffer.from("222222222", 'utf8'));
      let message2 = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user2.address, await nFTAward.getAddress(), 11,startTime, sequenceId2]
      );
      const signature2 = await signer.signMessage(hre.ethers.getBytes(message2));

      let delegateAwards = [await karma.getAddress(), await nFTAward.getAddress()];
      // console.log(delegateAwards)
      let numbers = [10, 11];
      // console.log(numbers)
      let sequenceIds = [sequenceId1, sequenceId2]
      // console.log(sequenceIds)
      let signs = [signature1, signature2]
      // console.log(signs)

      const sequenceId3 = hre.ethers.keccak256(Buffer.from("333333333", 'utf8'));
      let message3 = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256", "bytes32"],
        [user1.address, user2.address, await nFTAward.getAddress(), 12,startTime, sequenceId3]
      );
      const signature3 = await signer.signMessage(hre.ethers.getBytes(message3));
      delegateAwards.push(await nFTAward.getAddress());
      await expect(claimer.connect(user1).batchClaim(user2.address,startTime,delegateAwards,numbers,sequenceIds,signs )).to.be.reverted;
      expect(await karma.balanceOf(user2.address)).to.be.equals(0);
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(0);

      numbers.push(13);
      sequenceIds.push(sequenceId3);
      signs.push(signature3);
      await expect(claimer.connect(user1).batchClaim(user2.address,startTime,delegateAwards,numbers,sequenceIds,signs )).to.be.reverted;
      expect(await karma.balanceOf(user2.address)).to.be.equals(0);
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(0);

      numbers[2]=12;
      await expect(claimer.connect(user1).batchClaim(user2.address,startTime,delegateAwards,numbers,sequenceIds,signs )).not.to.be.reverted;
      expect(await karma.balanceOf(user2.address)).to.be.equals(10);
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(23);
    });


  });
});
