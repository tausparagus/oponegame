const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const d = require("./tdeploy.js");

describe("Optoken tests", function () {

  beforeEach(async () => {
    await d.initDeploy(false);
  });


  it("Contracts has right amount of tokens", async function () {
    // Check decimal and initial amount of optoken created
    expect(await d.getOpContract().decimals()).to.equal(18);
    expect(await d.getOpContract().totalSupply()).to.equal(ethers.utils.parseUnits(d.getOpInitBalance().toString(), 18));

    // Check timelock contract has right amount of balance initially
    let curTimeContractTokenBalance = await d.getOpContract().balanceOf(d.getTimeContract().address);
    const initTimeContractTokenBalance = ethers.utils.parseEther(d.getOpTimeBalance().toString());
    expect(curTimeContractTokenBalance).to.equal(initTimeContractTokenBalance); 
    console.log("Timelock Contract Token Init Balance = ", d.convertToNumber(curTimeContractTokenBalance), " GOP");

    // Check game contract has right amount of balance initially
    let curGameContractTokenBalance = await d.getOpContract().balanceOf(d.getGameContract().address);
    const initGameContractTokenBalance = ethers.utils.parseEther(d.getOpGameBalance().toString());
    expect(curGameContractTokenBalance).to.equal(initGameContractTokenBalance); 
    console.log("Game Contract Token Init Balance = ", d.convertToNumber(curGameContractTokenBalance), " GOP");
    
    // Check owner contract has right amount of balance after sent to timelock and game
    let curOwnerTokenBalance = await d.getOpContract().balanceOf(d.getOwner().address);
    expect(curOwnerTokenBalance).to.equal(ethers.utils.parseEther(d.getOpOwnerBalance().toString())); 
    console.log("Owner Token Init final Balance = ", d.convertToNumber(curOwnerTokenBalance), " GOP");

    // Token from timelock cannot be released assuming right now is before d.getUnlockTime()
    await expect (d.getTimeContract().release()).to.be.revertedWith("TokenTimelock: current time is before release time");

    const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;
    console.log("cur time = ", timeStamp, " unlock = ", d.getUnlockTime());

    // Timelock release time is equal to d.getUnlockTime()
    expect (await d.getTimeContract().releaseTime()).to.equal(d.getUnlockTime());   
    
    // Increase time beyond d.getUnlockTime() and release successfully
    await time.increaseTo(d.getUnlockTime());
    await d.getTimeContract().release();

    // After release timelock contract has no token
    curTimeContractTokenBalance = await d.getOpContract().balanceOf(d.getTimeContract().address);
    expect(curTimeContractTokenBalance).to.equal("0"); 
    console.log("Timelock Contract Token Balance After Release = ", d.convertToNumber(curTimeContractTokenBalance), " GOP");

    // After release owner has right amount of balance, assuming owner has not sent any tokens in before release
    curOwnerTokenBalance = await d.getOpContract().balanceOf(d.getOwner().address);
    expect(curOwnerTokenBalance).to.equal(ethers.utils.parseEther((d.getOpOwnerBalance() + d.getOpTimeBalance()).toString())); 
    console.log("Owner Token Balance After Release = ", d.convertToNumber(curOwnerTokenBalance), " GOP");
  });  

});