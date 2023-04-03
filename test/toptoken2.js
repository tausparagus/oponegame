const { expect } = require("chai");
const { ethers } = require("hardhat");
const d = require("./tdeploy.js");

describe("Optoken tests", function () {

  beforeEach(async () => {
    await d.initDeploy(true);
  });

  describe("OpToken Game", function () {

    it("Claimable optoken right amount after won", async function () {    
      let curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Init Balance = ", d.convertToNumber(curAcc1TokenBalance), " GOP");

      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();  
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateRunning()); 
      expect (await d.getGameContract().getGameId(d.getAcc1().address)).to.equal(1);  

      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);

      // 6+4=10 10*75=750 750-50=700 9/3=3 700+3=703 7-5=2 703+2=705
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,    2, 4,   1, 2,   1], 
                    [6,   10, 750, 9, 700, 7, 703],  
                    [4,   75,  50, 3,   3, 5,   2], 
                    [10, 750, 700, 3, 703, 2, 705]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());  
      expect (await d.getGameContract().connect(d.getAcc1()).getClaimableOpToken()).to.equal(1); // 1 Won 1 claimable no claim in between

      await d.getGameContract().connect(d.getAcc1()).newGame();  
      await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
      (1, 
        [1,   3,    2, 4,   1, 2,   1], 
        [6,   10, 750, 9, 700, 7, 703],  
        [4,   75,  50, 3,   3, 5,   2], 
        [10, 750, 700, 3, 703, 2, 705]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon()); 
      expect (await d.getGameContract().connect(d.getAcc1()).getClaimableOpToken()).to.equal(2); // 2 Won 2 claimable no claim in between  

    });

    it("Claim optoken after won", async function () {    
      // Play win and claim 1, expected 1 GOP
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();  
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateRunning()); 
      expect (await d.getGameContract().getGameId(d.getAcc1().address)).to.equal(1);  
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,    2, 4,   1, 2,   1], 
                    [6,   10, 750, 9, 700, 7, 703],  
                    [4,   75,  50, 3,   3, 5,   2], 
                    [10, 750, 700, 3, 703, 2, 705]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());  
      expect (await d.getGameContract().connect(d.getAcc1()).getClaimableOpToken()).to.equal(1); // 1 Won 1 claimable
      await expect(d.getGameContract().connect(d.getAcc1()).claimOpToken()).to.emit(d.getGameContract(), "ClaimOpToken").withArgs(d.getAcc1().address, 1); // claim 1 
      let curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Balance After Claim-1= ", d.convertToNumber(curAcc1TokenBalance), " GOP"); 
      expect (curAcc1TokenBalance).to.equal(ethers.utils.parseUnits("1", 18)); // 1 GOP

      // Play win and claim 1, expected 2 GOP
      await d.getGameContract().connect(d.getAcc1()).newGame();  
      await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
      (1, 
        [1,   3,    2, 4,   1, 2,   1], 
        [6,   10, 750, 9, 700, 7, 703],  
        [4,   75,  50, 3,   3, 5,   2], 
        [10, 750, 700, 3, 703, 2, 705]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon()); 
      expect (await d.getGameContract().connect(d.getAcc1()).getClaimableOpToken()).to.equal(1);   // Already claimed 1 so claimable=1
      await d.getGameContract().connect(d.getAcc1()).claimOpToken();
      curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
      console.log("Acc1 Token Balance After Claim-2= ", d.convertToNumber(curAcc1TokenBalance), " GOP");
      expect (curAcc1TokenBalance).to.equal(ethers.utils.parseUnits("2", 18)); // after claim balance 2 GOP

      // Play win and claim fails since reached max claimable, expected 2 GOP
      await d.getGameContract().connect(d.getAcc1()).newGame();  
      await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
      (1, 
        [1,   3,    2, 4,   1, 2,   1], 
        [6,   10, 750, 9, 700, 7, 703],  
        [4,   75,  50, 3,   3, 5,   2], 
        [10, 750, 700, 3, 703, 2, 705]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon()); 
      if (d.getTokenMaxClaimable() == 2) {
        expect (await d.getGameContract().connect(d.getAcc1()).getClaimableOpToken()).to.equal(0);   // If Max claimable is 2 so claimable=0
        await expect(d.getGameContract().connect(d.getAcc1()).claimOpToken()).to.be.revertedWith("No claimable token"); 
        curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
        console.log("Acc1 Token Balance After Claim-3= ", d.convertToNumber(curAcc1TokenBalance), " GOP");
        expect (curAcc1TokenBalance).to.equal(ethers.utils.parseUnits("2", 18));
      }
      else {
        expect (await d.getGameContract().connect(d.getAcc1()).getClaimableOpToken()).to.equal(1);   // Since claimed now claimable 1
        await d.getGameContract().connect(d.getAcc1()).claimOpToken();
        curAcc1TokenBalance = await d.getOpContract().balanceOf(d.getAcc1().address);
        console.log("Acc1 Token Balance After Claim-3= ", d.convertToNumber(curAcc1TokenBalance), " GOP");
        expect (curAcc1TokenBalance).to.equal(ethers.utils.parseUnits("3", 18)); // Total 3
      }

    });
  });

});