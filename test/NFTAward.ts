import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("NFTAward", function () {
  const name="nFTAward token";
  const symbol="nFTAward"
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [signer,user1, user2] = await hre.ethers.getSigners();

    const Claimer = await hre.ethers.getContractFactory("Claimer");
    const claimer = await Claimer.deploy(signer.address);

    const NFTAward = await hre.ethers.getContractFactory("NFTAward");
    const nFTAward = await NFTAward.deploy(name,symbol,claimer.getAddress(),false,false);

    return { signer, user1, user2,claimer,nFTAward };
  }

  describe("Deployment", function () {
    it("Should init setting the right", async function () {
      const { signer, user1, user2,claimer,nFTAward} = await loadFixture(deployFixture);
      expect(await nFTAward.name()).to.equal(name);
      expect(await nFTAward.symbol()).to.equal(symbol);
      expect(await nFTAward.cap()).to.equal(-1);
      expect(await nFTAward.canTransfer()).to.equal(false);
      expect(await nFTAward.canBurn()).to.equal(false);
      expect(await nFTAward.delegate()).to.equal(await claimer.getAddress());
    });

    it("Should owner check the right", async function () {
      const { signer, user1, user2,claimer,nFTAward} = await loadFixture(deployFixture);
      await expect( nFTAward.setDelegate(claimer.getAddress())).not.to.be.reverted;
      await expect( nFTAward.connect(user1).setDelegate(claimer.getAddress())).to.be.reverted;
    });

    it("Should change setting the right", async function () {
      const { signer, user1, user2,claimer,nFTAward} = await loadFixture(deployFixture);
      await nFTAward.setDelegate(nFTAward.getAddress());
      expect(await nFTAward.delegate()).to.equal(await nFTAward.getAddress());

      await nFTAward.capSetting(-10);
      expect(await nFTAward.cap()).to.equal(-10);

      await nFTAward.transferSetting(false);
      expect(await nFTAward.canTransfer()).to.equal(false);

      await nFTAward.burnSetting(false);
      expect(await nFTAward.canBurn()).to.equal(false);

      expect(await nFTAward.whileList(hre.ethers.ZeroAddress)).to.equal(false);
      await nFTAward.setWhileList(hre.ethers.ZeroAddress,true);
      expect(await nFTAward.whileList(hre.ethers.ZeroAddress)).to.equal(true);
    });

    it("Should mint check the right", async function () {
      const { signer, user1, user2,claimer,nFTAward} = await loadFixture(deployFixture);

      await expect( nFTAward.connect(user1).mint(user2,1)).to.be.reverted;

      await nFTAward.setDelegate(signer.address);
      await nFTAward.mint(signer.address,1);
      expect( await nFTAward.balanceOf(signer.address)).to.be.equals(1);

      await nFTAward.capSetting(1);
      await expect( nFTAward.mint(signer.address,2)).not.to.be.reverted;
      expect( await nFTAward.balanceOf(signer.address)).to.be.equals(1);

      await nFTAward.capSetting(2);
      await nFTAward.transferSetting(false);
      await expect( nFTAward.mint(signer.address,1)).not.to.be.reverted;

      expect( await nFTAward.totalSupply()).to.be.equals(2);
    });

    it("Should burn check the right", async function () {
      const { signer, user1, user2,claimer,nFTAward} = await loadFixture(deployFixture);
      await nFTAward.setDelegate(signer.address);
      await nFTAward.mint(user1.address,1);

      await expect( nFTAward.connect(user1).burn(0)).to.be.reverted;

      await nFTAward.burnSetting(true);
      await expect( nFTAward.connect(user1).burn(0)).not.to.be.reverted;

      await nFTAward.burnSetting(true);
      await nFTAward.mint(user1.address,1);
      await nFTAward.transferSetting(false);
      await expect( nFTAward.connect(user1).burn(0)).not.to.be.reverted;

      expect( await nFTAward.totalSupply()).to.be.equals(0);
    });

    it("Should transfer check the right", async function () {
      const { signer, user1, user2,claimer,nFTAward} = await loadFixture(deployFixture);
      await nFTAward.setDelegate(signer.address);
      await nFTAward.mint(user1.address,10);
      await expect( nFTAward.connect(user1).transferFrom(user1.address,user2.address,0)).to.be.reverted;
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(0)

      await nFTAward.transferSetting(true);
      await expect( nFTAward.connect(user1).transferFrom(user1.address,user2.address,0)).not.to.be.reverted;
      expect(await nFTAward.balanceOf(user2.address)).to.be.equals(1)
      
      expect( await nFTAward.totalSupply()).to.be.equals(10);
    });

    it("Should set whileList check the right", async function () {
      const { signer, user1, user2, claimer, nFTAward } = await loadFixture(deployFixture);
      await nFTAward.setDelegate(signer.address);
      await nFTAward.transferSetting(false);

      // await nFTAward.setWhileList(user1.address,true);
      await nFTAward.mint(user1.address, 10);
      await nFTAward.burnSetting(true);
      await nFTAward.connect(user1).burn(0);

      await nFTAward.setWhileList(user1.address,true);

      nFTAward.connect(user1).transferFrom(user1.address,user2.address,1);
    });
  });
});
