import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Karma", function () {
  const name = "karma token";
  const symbol = "karma"
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [signer, user1, user2] = await hre.ethers.getSigners();

    const Claimer = await hre.ethers.getContractFactory("Claimer");
    const claimer = await Claimer.deploy(signer.address);

    const Karma = await hre.ethers.getContractFactory("Karma");
    const karma = await Karma.deploy(name, symbol, claimer.getAddress(), true, true);

    return { signer, user1, user2, claimer, karma };
  }

  describe("Deployment", function () {
    it("Should init setting the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      expect(await karma.name()).to.equal(name);
      expect(await karma.symbol()).to.equal(symbol);
      expect(await karma.cap()).to.equal(-1);
      expect(await karma.canTransfer()).to.equal(true);
      expect(await karma.canBurn()).to.equal(true);
      expect(await karma.delegate()).to.equal(await claimer.getAddress());
    });

    it("Should owner check the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      await expect(karma.setDelegate(claimer.getAddress())).not.to.be.reverted;
      await expect(karma.connect(user1).setDelegate(claimer.getAddress())).to.be.reverted;
    });

    it("Should change setting the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      await karma.setDelegate(karma.getAddress());
      expect(await karma.delegate()).to.equal(await karma.getAddress());

      await karma.capSetting(-10);
      expect(await karma.cap()).to.equal(-10);

      await karma.transferSetting(false);
      expect(await karma.canTransfer()).to.equal(false);

      await karma.burnSetting(false);
      expect(await karma.canBurn()).to.equal(false);

      expect(await karma.whileList(hre.ethers.ZeroAddress)).to.equal(false);
      await karma.setWhileList(hre.ethers.ZeroAddress,true);
      expect(await karma.whileList(hre.ethers.ZeroAddress)).to.equal(true);
    });

    it("Should mint check the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      await expect(karma.connect(user1).mint(user2, 1)).to.be.reverted;
      await karma.setDelegate(signer.address);
      await karma.mint(signer.address, 1);
      expect(await karma.balanceOf(signer.address)).to.be.equals(1);
      await karma.capSetting(1);
      await expect(karma.mint(signer.address, 2)).to.be.reverted;
      expect(await karma.totalSupply()).to.be.equals(1);

      await karma.transferSetting(false);
      await expect(karma.mint(signer.address, 1)).to.be.reverted;
    });

    it("Should burn check the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      await karma.setDelegate(signer.address);
      await karma.mint(user1.address, 1);
      await expect(karma.connect(user1).burn(1)).not.to.be.reverted;

      await karma.burnSetting(false);
      await karma.mint(user1.address, 1);
      await expect(karma.connect(user1).burn(1)).to.be.reverted;

      await karma.burnSetting(true);
      await karma.mint(user1.address, 1);
      await karma.transferSetting(false);
      await expect(karma.connect(user1).burn(1)).to.be.reverted;

      expect(await karma.totalSupply()).to.be.equals(2);
    });

    it("Should transfer check the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      await karma.setDelegate(signer.address);
      await karma.mint(user1.address, 10);
      await expect(karma.connect(user1).transfer(user2.address, 1)).not.to.be.reverted;
      expect(await karma.balanceOf(user2.address)).to.be.equals(1)

      await karma.burnSetting(false);
      await expect(karma.connect(user1).transfer(user2.address, 1)).not.to.be.reverted;

      await karma.burnSetting(true);
      await karma.transferSetting(false);
      await expect(karma.connect(user1).transfer(user2.address, 1)).to.be.reverted;

      expect(await karma.balanceOf(user2.address)).to.be.equals(2)
      expect(await karma.totalSupply()).to.be.equals(10);
    });

    it("Should set whileList check the right", async function () {
      const { signer, user1, user2, claimer, karma } = await loadFixture(deployFixture);
      await karma.setDelegate(signer.address);
      await karma.transferSetting(false);

      await karma.setWhileList(user1.address,true);
      await karma.mint(user1.address, 10);

      await karma.setWhileList(hre.ethers.ZeroAddress,true);
      await karma.connect(user1).burn(10);
    });

  });
});
