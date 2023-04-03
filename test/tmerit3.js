const { expect } = require("chai");
const { ethers } = require("hardhat");
const d = require("./tdeploy.js");

describe("Merit tests", function () {

  beforeEach(async () => {
    await d.initDeploy(true);
  });

  describe("Buy Merit", function () {
    it("Buy sanity", async function () {    
      let curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Init Balance = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

      // No eth sending, cannot buy token
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(0)).to.be.revertedWith("Non-zero value needed to buy merit"); 
      // await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(-1)).to.be.revertedWith("Invalid merit");  cant set negative value cause uint8


      //  meritwon 0.05 eth      => 5 * 1 * (10**16)
      let ethval = d.getBasePrice() / 100;
      let meritid = d.getMeritWon();

      // merit id should be in range
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(d.getMeritL666() + 1, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Invalid merit");
      
      // Buying merit but not correct amount of eth sent
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther("0.06") })).to.be.revertedWith("Merit payment not correct"); 

      // Buying merit and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) }))
        .to.emit(d.getGameContract(), "BuyMeritToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(ethval.toString()), meritid, 0);

      // correct amount of merits
      expect(await d.getGameContract().connect(d.getAcc1()).balanceOf(d.getAcc1().address)).to.equal(1);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(meritid)).to.equal(false);

      // Cant buy already bought or claimed merit, note: merits can be set to other accounts but still is claimed in storage
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Merit already claimed"); 

    });

    it("User won with target 666 can mint its merit token and after claim cannot buy", async function () {
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL666())).to.equal(false);
      
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();  
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 666, 5, 4, 8, 9, 6, 3, 25, 50);
      // 9+4=13 13*50=650 8+5=13 13+3=16 650+16=666
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,   1,  1,   1], 
                    [9,   13,  8, 13, 650],  
                    [4,   50,  5,  3,  16], 
                    [13, 650, 13, 16, 666]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(GameState.WON);  
      await expect(d.getGameContract().connect(d.getAcc1()).claimOpMerit(d.getMeritL666()))
      .to.emit(d.getGameContract(), "ClaimMerit").withArgs(d.getAcc1().address, 0, d.getMeritL666());

      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL666())).to.equal(false);

      let ethval = d.getBasePrice() / 100 * 10;
      let meritid = d.getMeritL666();
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Merit already claimed"); 

    });   

    it("Buy merit more", async function () {
      let game_bal = await ethers.provider.getBalance(d.getGameContract().address);
      console.log("game has " + d.convertToNumber(game_bal) + " ETH");

      let ethval =d.getBasePrice() / 100 * 20;
      let meritid = d.getMeritL888();
      let toteth = ethval;
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(meritid)).to.equal(false);
      
      // Buying first merit and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) }))
            .to.emit(d.getGameContract(), "BuyMeritToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(ethval.toString()), meritid, 0);

      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(meritid)).to.equal(false);

      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Merit already claimed"); 

      ethval = d.getBasePrice() / 100 * 2;
      meritid = d.getMeritWo10();
      toteth = toteth + ethval;
     
      // Buying second merit and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) }))
            .to.emit(d.getGameContract(), "BuyMeritToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(ethval.toString()), meritid, 1);

      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(meritid)).to.equal(false);
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Merit already claimed"); 
 
      game_bal = await ethers.provider.getBalance(d.getGameContract().address);
      console.log("game has " + d.convertToNumber(game_bal) + " ETH");
      expect(await ethers.provider.getBalance(d.getGameContract().address)).to.equal(ethers.utils.parseEther(toteth.toString()));  
      

    });   

    it("Set price buy merit", async function () {    
      let acc1_bal = await ethers.provider.getBalance(d.getAcc1().address);
      console.log("Account 1 has " + d.convertToNumber(acc1_bal) + " ETH");

      // No eth sending, cannot buy token
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(0)).to.be.revertedWith("Non-zero value needed to buy merit"); 
      // await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(-1)).to.be.revertedWith("Invalid merit");  cant set negative value cause uint8

      //  meritwon 0.05 eth      => 5 * 1 * (10**16)

      let newbaseprice = 1000;
      let ethval = newbaseprice;
      let meritid = d.getMeritWon();

      await d.getGameContract().setBasePrice(newbaseprice);

      // merit id should be in range
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(d.getMeritL666() + 1, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Invalid merit");
      
      // Buying merit but not correct amount of eth sent
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther("0.06") })).to.be.revertedWith("Merit payment not correct"); 

      // Buying merit and success, event is emitted
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) }))
        .to.emit(d.getGameContract(), "BuyMeritToken").withArgs(d.getAcc1().address, ethers.utils.parseEther(ethval.toString()), meritid, 0);

      // correct amount of merits
      expect(await d.getGameContract().connect(d.getAcc1()).balanceOf(d.getAcc1().address)).to.equal(1);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(meritid)).to.equal(false);

      // Cant buy already bought or claimed merit, note: merits can be set to other accounts but still is claimed in storage
      await expect(d.getGameContract().connect(d.getAcc1()).buyMeritToken(meritid, { value: ethers.utils.parseEther(ethval.toString()) })).to.be.revertedWith("Merit already claimed"); 

    });

  });
});