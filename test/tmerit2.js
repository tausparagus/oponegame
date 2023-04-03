const { expect } = require("chai");
const d = require("./tdeploy.js");

describe("Merit tests", function () {

  beforeEach(async () => {
    await d.initDeploy(true);
  });

  describe("Test Merit", function () {
    it("User won can mint its merit token", async function () {
      expect(await d.getGameContract().balanceOf(d.getOwner().address)).to.equal(0);
      expect(await d.getGameContract().connect(d.getAcc1()).balanceOf(d.getAcc1().address)).to.equal(0);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritWon())).to.equal(false);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritWo10())).to.equal(false);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritWn100())).to.equal(false);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL777())).to.equal(false);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL888())).to.equal(false);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL666())).to.equal(false);
      
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();  
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,    2, 4,   1, 2,   1], 
                    [6,   10, 750, 9, 700, 7, 703],  
                    [4,   75,  50, 3,   3, 5,   2], 
                    [10, 750, 700, 3, 703, 2, 705]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());  
      await expect(d.getGameContract().connect(d.getAcc1()).claimAllOpMerit()).to.emit(d.getGameContract(), "ClaimMerit").withArgs(d.getAcc1().address, 0, d.getMeritWon());
      
    });  

    it("User won with target 777 can mint its merit token", async function () {
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL777())).to.equal(false);
      
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();  
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 777, 5, 4, 7, 9, 6, 3, 25, 75);
      // 6+4=10 10*75=750 750+25=775 7-5=2 775+2=777
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,    1, 2,   1], 
                    [6,   10, 750, 7, 775],  
                    [4,   75,  25, 5,   2], 
                    [10, 750, 775, 2, 777]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());  
      await expect(d.getGameContract().connect(d.getAcc1()).claimAllOpMerit())
      .to.emit(d.getGameContract(), "ClaimMerit").withArgs(d.getAcc1().address, 0, d.getMeritWon())
      .to.emit(d.getGameContract(), "ClaimMerit").withArgs(d.getAcc1().address, 1, d.getMeritL777());

      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL777())).to.equal(false);
      //expect(await d.getGameContract().connect(d.getAcc1()).claimAllOpMerit()).to.equal(false);
      expect(await d.getGameContract().tokenURI(0)).to.equal(d.getMeritBaseUri() + "1.png");
      expect(await d.getGameContract().tokenURI(1)).to.equal(d.getMeritBaseUri() + "777_fiddle.png");

      // win again with target 777 but not claimable
      await d.getGameContract().connect(d.getAcc1()).newGame();  
      await d.getGameContract().setDebugGame(d.getAcc1().address, 777, 5, 4, 7, 9, 6, 3, 25, 75);
      await d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,    1, 2,   1], 
                    [6,   10, 750, 7, 775],  
                    [4,   75,  25, 5,   2], 
                    [10, 750, 775, 2, 777]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritWon())).to.equal(false);
      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL777())).to.equal(false);
    });  

    it("User won with target 666 can mint its merit token", async function () {
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
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());  
      await expect(d.getGameContract().connect(d.getAcc1()).claimOpMerit(d.getMeritL666()))
      .to.emit(d.getGameContract(), "ClaimMerit").withArgs(d.getAcc1().address, 0, d.getMeritL666());

      expect(await d.getGameContract().connect(d.getAcc1()).checkClaimOpMerit(d.getMeritL666())).to.equal(false);
      expect(await d.getGameContract().tokenURI(0)).to.equal(d.getMeritBaseUri() + "33_needle.png");

      await expect(d.getGameContract().connect(d.getAcc1()).transferFrom(d.getAcc1().address, d.getAcc2().address, 0)).to.emit(d.getGameContract(), "Transfer").withArgs(d.getAcc1().address, d.getAcc2().address, 0);
      expect(await d.getGameContract().connect(d.getAcc1()).balanceOf(d.getAcc1().address)).to.equal(0);
      expect(await d.getGameContract().connect(d.getAcc1()).balanceOf(d.getAcc2().address)).to.equal(1);

    });      
  });

});