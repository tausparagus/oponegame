const { expect } = require("chai");
const { ethers } = require("hardhat");
const d = require("./tdeploy.js");

describe("Optoken tests", function () {

  beforeEach(async () => {
    await d.initDeploy(false);
  });

  describe("Test Eth", function () {
    it("ETH Balances", async function () {
      let owner_bal = await ethers.provider.getBalance(d.getOwner().address);
      let acc1_bal = await ethers.provider.getBalance(d.getAcc1().address);
      let acc2_bal = await ethers.provider.getBalance(d.getAcc2().address);
      let game_bal = await ethers.provider.getBalance(d.getGameContract().address);
      console.log("d.getOwner() has " + d.convertToNumber(owner_bal) + " ETH");
      console.log("d.getAcc1() has " + d.convertToNumber(acc1_bal) + " ETH");
      console.log("d.getAcc2() has " + d.convertToNumber(acc2_bal) + " ETH");
      console.log("game has " + d.convertToNumber(game_bal) + " ETH");

      const stosend = "2";
      const etosend = ethers.constants.WeiPerEther.mul(ethers.BigNumber.from(stosend)); //ethers.BigNumber.from(1E18);

      // Send from d.getAcc1() to d.getAcc2() amount stosend
      let transactionHash = await d.getAcc1().sendTransaction({
        to: d.getAcc2().address,
        value: ethers.utils.parseEther(stosend), 
      });
      acc1_bal = await ethers.provider.getBalance(d.getAcc1().address);
      console.log("Send " + stosend + " from d.getAcc1() to d.getAcc2(), now d.getAcc1() has " + d.convertToNumber(acc1_bal) + " ETH");

      // Acc2 has right amount of eth after d.getAcc1() sends
      expect(await ethers.provider.getBalance(d.getAcc2().address)).to.equal(acc2_bal.add(etosend));
      acc2_bal = await ethers.provider.getBalance(d.getAcc2().address);
      console.log("now d.getAcc2() has " + d.convertToNumber(acc2_bal) + " ETH");

      // to send eth to game contract define receive() payable external {} - contract cant send eth to some other
      // cant send eth to token contract if receive is not defined
      await expect(d.getGameContract().withdraw()).to.be.revertedWith("Contract has no balance to withdraw"); 
      const stocontract = "10.0";
      transactionHash = await d.getAcc1().sendTransaction({
        to: d.getGameContract().address,
        value: ethers.utils.parseEther(stocontract), 
      });

      game_bal = await ethers.provider.getBalance(d.getGameContract().address);
      console.log("Send " + stocontract + " from d.getAcc1() to game, now game has " + d.convertToNumber(game_bal) + " ETH");
      // Game has right amount of eth after d.getAcc1() sends
      expect(await ethers.provider.getBalance(d.getGameContract().address)).to.equal(ethers.utils.parseEther(stocontract));
      // Only d.getOwner() can withdraw
      await expect(d.getGameContract().connect(d.getAcc1()).withdraw()).to.be.revertedWith("Ownable: caller is not the owner"); 
      // Owner withdraw success
      await d.getGameContract().withdraw();
      
      owner_bal = await ethers.provider.getBalance(d.getOwner().address);
      console.log("After withdraw from game, now d.getOwner() has " + d.convertToNumber(owner_bal) + " ETH");        

    });  
  });

  describe("Buy OpToken", function () {
    it("Buy sanity", async function () {    
      let curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Init Balance = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

      // No eth sending, cannot buy token
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(1)).to.be.revertedWith("Non-zero value needed to buy token"); 

      //  optoken 0.005 eth      => 5 * 1 * (10**15)
      let ethval = 0.005;
      let tokamount = 1;
      // Buying token but not correct amount of eth sent
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(tokamount, { value: ethers.utils.parseEther("0.05") })).to.be.revertedWith("Optoken payment not correct"); 

      // Buying token and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(tokamount, { value: ethers.utils.parseEther(ethval.toString()) }))
        .to.emit(d.getGameContract(), "BuyOpToken").withArgs(d.getAcc1().address, ethval * 1E18, tokamount);

      curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      expect(curAcc1TokenBalance).to.equal(ethers.utils.parseEther(tokamount.toString())); 
      console.log("Acc1 Token Balance After Buy = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

    });

    it("Buy more", async function () {    
      let curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Init Balance = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

      //  optoken 0.005 eth      => 5 * 1 * (10**15)
      let ethval = 0.005;
      let tokamount = 1000;
      let toteth = ethval * tokamount;

      // Buying token and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(tokamount, { value: ethers.utils.parseEther(toteth.toString()) }))
        .to.emit(d.getGameContract(), "BuyOpToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(toteth.toString()), tokamount);

      curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      expect(curAcc1TokenBalance).to.equal(ethers.utils.parseEther(tokamount.toString())); 
      console.log("Acc1 Token Balance After Buy = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

      let addbuy = 34;
      toteth = ethval * addbuy;
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(addbuy, { value: ethers.utils.parseEther(toteth.toString()) }))
      .to.emit(d.getGameContract(), "BuyOpToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(toteth.toString()), addbuy);

      curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      expect(curAcc1TokenBalance).to.equal(ethers.utils.parseEther((tokamount+addbuy).toString())); 
      console.log("Acc1 Token Balance After Second Buy = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

    });

    it("Set price buy token", async function () {    
      let curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Init Balance = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

      // No eth sending, cannot buy token
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(1)).to.be.revertedWith("Non-zero value needed to buy token"); 

      //  optoken 0.005 eth      => 5 * 1 * (10**15)     
      let newbaseprice = 1000;
      let ethval = newbaseprice/10;
      let tokamount = 1;
      
      await d.getGameContract().setBasePrice(newbaseprice);

      // Buying token but not correct amount of eth sent
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(tokamount, { value: ethers.utils.parseEther("0.05") })).to.be.revertedWith("Optoken payment not correct"); 
 
      // Buying token and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyOpToken(tokamount, { value: ethers.utils.parseEther(ethval.toString()) }))
        .to.emit(d.getGameContract(), "BuyOpToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(ethval.toString()), tokamount);

      curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      expect(curAcc1TokenBalance).to.equal(ethers.utils.parseEther(tokamount.toString())); 
      console.log("Acc1 Token Balance After Buy = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

    });
  });
});