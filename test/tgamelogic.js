const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const d = require("./tdeploy.js");

describe("Debug active in game", function () {

  beforeEach(async () => {
    await d.initDeploy(true);
  });

  describe("Test Game logic", function () {

    it("Game won", async function () {    
      await expect (d.getGameContract().connect(d.getAcc1()).newGame()).to.emit(d.getGameContract(), "NewGame").withArgs(d.getAcc1().address, 1, anyValue, anyValue);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateRunning()); 
      expect (await d.getGameContract().getGameId(d.getAcc1().address)).to.equal(1);  

      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);

      // 6+4=10 10*75=750 750-50=700 9/3=3 700+3=703 7-5=2 703+2=705
      await expect (d.getGameContract().connect(d.getAcc1()).verifyUserOperations
                  (1, 
                    [1,   3,    2, 4,   1, 2,   1], 
                    [6,   10, 750, 9, 700, 7, 703],  
                    [4,   75,  50, 3,   3, 5,   2], 
                    [10, 750, 700, 3, 703, 2, 705])).to.emit(d.getGameContract(), "ResultGame").withArgs(d.getAcc1().address, 1, true, anyValue);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateWon());  
    });

    it("Game lost", async function () {    
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();     
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);

      // 75+5=80, 4*80=320
      await expect(d.getGameContract().connect(d.getAcc1()).verifyUserOperations(1, [1, 3], [75, 4], [5, 80], [80, 320])).to.emit(d.getGameContract(), "ResultGame").withArgs(d.getAcc1().address, 1, false, anyValue);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateLost());  
    });

    it("New game cannot be created if already running", async function () {    
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();     
      await expect(d.getGameContract().connect(d.getAcc1()).newGame()).to.be.revertedWith("Game is already running"); 
    });

    it("Game cannot be verified if not running", async function () {      
      await expect(d.getGameContract().connect(d.getAcc1()).verifyUserOperations(1, [1, 3], [75, 4], [5, 80], [80, 320])).to.be.revertedWith("Game is not running"); 
    });

    it("Game player only verify its game", async function () {  
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame(); 
      await d.getGameContract().connect(d.getAcc2()).newGame();       
      await expect(d.getGameContract().connect(d.getAcc2()).verifyUserOperations(1, [1, 3], [75, 4], [5, 80], [80, 320])).to.be.revertedWith("Game player id mismatch"); 
    });

    it("Game can be created after losing", async function () {    
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();     
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations(1, [1, 3], [75, 4], [5, 80], [80, 320]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateLost());  

      await d.getGameContract().connect(d.getAcc1()).newGame();    
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateRunning());  
    });

    it("Game can be created after winning", async function () {    
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

      await d.getGameContract().connect(d.getAcc1()).newGame();    
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateRunning());  
    });

    it("Game can only be verified once", async function () {    
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();     
      const dbggame = await d.getGameContract().setDebugGame(d.getAcc1().address, 705, 5, 4, 7, 9, 6, 3, 50, 75);
      const v1 = await d.getGameContract().connect(d.getAcc1()).verifyUserOperations(1, [1, 3], [75, 4], [5, 80], [80, 320]);
      expect (await d.getGameContract().getGameState(d.getAcc1().address)).to.equal(d.getGameStateLost());  

      await expect(d.getGameContract().connect(d.getAcc2()).verifyUserOperations(1, [1, 3], [75, 4], [5, 80], [80, 320])).to.be.revertedWith("Game is not running"); 
    });

    it("After time pass new Game can be started", async function () {  
      const crtNewGame = await d.getGameContract().connect(d.getAcc1()).newGame();     
      await expect(d.getGameContract().connect(d.getAcc1()).newGame()).to.be.revertedWith("Game is already running");
      const timeStamp = (await ethers.provider.getBlock("latest")).timestamp; 
      await time.increaseTo(timeStamp + d.getUnlockTime());
      await expect(d.getGameContract().connect(d.getAcc1()).newGame())
        .to.emit(d.getGameContract(), "ResultGame").withArgs(d.getAcc1().address, 1, false, "Timse passed")
        .to.emit(d.getGameContract(), "NewGame").withArgs(d.getAcc1().address, 1, anyValue, anyValue);

      expect (await d.getGameContract().getGameNcPlayed(d.getAcc1().address)).to.equal(2);  
      expect (await d.getGameContract().getGameNcWon(d.getAcc1().address)).to.equal(0);  
    });

  });

});