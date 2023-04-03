// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "../lib/Rand.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameLogic is Ownable {
	using Rand for uint256;
	
	event NewGame(address indexed player, uint256 indexed gameid, uint16 target, uint8[8] nums);
	event ResultGame(address indexed player, uint256 indexed gameid, bool isWon, string reason);
	event ClaimOpToken(address player, uint256 amountOfTokens);
	event ClaimMerit(address player, uint256 tokenId, uint8 meritId);
	
	enum GameState{NOTRUN, RUNNING, LOST, WON}
	uint8 constant internal MERIT_WON = 0;
	uint8 constant internal MERIT_WON_10 = 1;
	uint8 constant internal MERIT_WON_100 = 2;
	uint8 constant internal MERIT_LUCKY_777 = 3;
	uint8 constant internal MERIT_LUCKY_888 = 4;
	uint8 constant internal MERIT_LUCKY_666 = 5;
	
	struct Game {
		address player;
		uint256 gameid;
		uint256 ncplayed;
		uint256 ncwon;
		uint256 optokenClaimed;
		uint256 tsstarted;
		uint8[6] opmeritClaimed;
		uint8[6] opmeritWon;
		uint16 target;
		uint8[8] nums;
		GameState gs;
	}
	
	struct ValOp {
		bool isused;
		int256 nr;
	}
	
	bool internal isDebugActive;
	uint256 private randSeed = 0;
	uint256 private freeGameId = 0;
	
	uint256 constant private maxTimePass  = 300;
	
	mapping (address => Game) internal curGames;
	mapping(uint256 => uint8) internal meritIds;

	/* ==================== EXTERNAL  ================================ */
	function newGame() external returns (uint256 id){
		if (curGames[msg.sender].gameid == 0) {
		  freeGameId = freeGameId + 1;
		  curGames[msg.sender].gameid = freeGameId;
		  curGames[msg.sender].player = msg.sender;
		}

		if (curGames[msg.sender].gs == GameState.RUNNING) {
		  uint256 newts = curGames[msg.sender].tsstarted + maxTimePass;
		  if (block.timestamp >= newts) {
			_endGame(msg.sender, false, "Time passed");
		  }
		}

		require (curGames[msg.sender].gs != GameState.RUNNING, "Game is already running");
		
		curGames[msg.sender].gs = GameState.RUNNING;
		curGames[msg.sender].ncplayed += 1;
		curGames[msg.sender].tsstarted = block.timestamp;
		_fillNumsTarget(msg.sender);

		emit NewGame(msg.sender, curGames[msg.sender].gameid, curGames[msg.sender].target, curGames[msg.sender].nums);
		_printGameInfo(msg.sender);
		return curGames[msg.sender].gameid;
	}
  
	function verifyUserOperations(uint256 id, uint8[] calldata ops, int256[] calldata nr1s, int256[] calldata nr2s, int256[] calldata ress) external returns (bool success) {
		require(curGames[msg.sender].gs == GameState.RUNNING, "Game is not running");
		require(curGames[msg.sender].player == msg.sender, "Game player can only send game result");
		require(curGames[msg.sender].gameid == id, "Game player id mismatch");

		uint256 newts = curGames[msg.sender].tsstarted + maxTimePass;
		if (block.timestamp >= newts) {
		  _endGame(msg.sender, false, "Time passed");
		  return false;
		}

		uint256 len = ops.length;
		require(len > 0, "No operations");
		require(len <  20, "Too many operations");
		require(len == nr1s.length, "Length of all operations must be same");
		require(len == nr2s.length, "Length of all operations must be same");
		require(len == ress.length, "Length of all operations must be same");

		console.log("verifyUserOperations player=", msg.sender);

		 for (uint8 i=0; i<len; i++) {
		  if (!_isOperationValid(ops[i], nr1s[i], nr2s[i], ress[i])) {
			  _endGame(msg.sender, false, "Invalid operation or number");
			  return false;     
		  }
		 }

		return _verifyCorrectness(len, nr1s, nr2s, ress);
    }

	function getGameState(address player) external onlyOwner view returns (uint256 gamestate) {
		GameState gs = curGames[player].gs;
		uint256 igs = uint256(gs);
		//console.log("igs=", igs);
		return igs;
	}

	function isGameRunning() external view returns(uint256 gameid, uint256 tsstarted, uint16 target, uint8[8] memory nums) {
		uint256 id = 0;
		if (curGames[msg.sender].gs == GameState.RUNNING) {	
			id = curGames[msg.sender].gameid;
			uint256 newts = curGames[msg.sender].tsstarted + maxTimePass;
		  	if (block.timestamp >= newts) {
				id = 0;
		  	}
		}
		return (id, curGames[msg.sender].tsstarted, curGames[msg.sender].target, curGames[msg.sender].nums);
	}

	function getPlayerStat() external view returns(uint256 ncplayed, uint256 ncwon, uint256 optokenClaimed, uint8[6] memory opmeritClaimed, uint8[6] memory opmeritWon) {
		return (curGames[msg.sender].ncplayed, curGames[msg.sender].ncwon, curGames[msg.sender].optokenClaimed, curGames[msg.sender].opmeritClaimed, curGames[msg.sender].opmeritWon);
	}
	
	function getGameId(address player) external onlyOwner view returns (uint256 gameid) {
		return curGames[player].gameid;
	}
	
	function getGameNcPlayed(address player) external onlyOwner view returns (uint256 ncplayed) {
		return curGames[player].ncplayed;
	}
	
	function getGameNcWon(address player) external onlyOwner view returns (uint256 ncwon) {
		return curGames[player].ncwon;
	}
	
	function setDebugGame(address player, uint16 t, uint8 n1, uint8 n2, uint8 n3, uint8 n4, uint8 n5, uint8 n6, uint8 n7, uint8 n8) external onlyOwner {
		require (isDebugActive, "Contract has to be created with debug active");
		curGames[player].target = t;
		curGames[player].nums[0] = n1;
		curGames[player].nums[1] = n2;
		curGames[player].nums[2] = n3;
		curGames[player].nums[3] = n4;
		curGames[player].nums[4] = n5;
		curGames[player].nums[5] = n6;
		curGames[player].nums[6] = n7;
		curGames[player].nums[7] = n8;
		
		_printGameInfo(player);
	}
	
	/* ==================== PRIVATE ================================ */
	function _fillNumsTarget(address player) private {
		uint256 size = 8;

		uint8 nr = 0;
			/* the first six: digits */
			for (uint256 i=0 ; i<(size-2); i++) {
		  randSeed = randSeed.generateSeed();
				nr = Rand.randUint8(randSeed, 1,9);
		  //console.log("fd=", nr);
				curGames[player].nums[i] = nr;
			}
			/* the last two: 25,50,75 */
			for (uint256 i=0 ; i<2; i ++) {
		  randSeed = randSeed.generateSeed();
				nr = Rand.randUint8(randSeed, 1,3);
				nr = nr * 25;
		  //console.log("ld=", nr);
				curGames[player].nums[i+6] = nr;
			}
		randSeed = randSeed.generateSeed();
		curGames[player].target = Rand.randUint16(randSeed, 501,666);
	}

	function _printGameInfo(address player) private view {
		console.log("==================");
		console.log("%s: id=%d state=%d ", curGames[player].player, curGames[player].gameid, uint256(curGames[player].gs));
		console.log("ncplayed=%d ncwon=%d started=%d", curGames[player].ncplayed, curGames[player].ncwon, curGames[player].tsstarted);
		console.log("target=%d: %d %d", curGames[player].target, 
				curGames[player].nums[0], curGames[player].nums[1]
				);
		console.log("%d %d %d", curGames[player].nums[2], 
				curGames[player].nums[3], curGames[player].nums[4]
				);
		console.log("%d %d %d", curGames[player].nums[5], 
				curGames[player].nums[6], curGames[player].nums[7]
				);
	} 

	function _isOperationValid(uint8 op, int256 nr1, int256 nr2, int256 res) private pure returns (bool) {

		if (op < 1 && op > 4) return false;
		if (nr1 == 0 || nr2 == 0 || res == 0) return false;

		if (op == 1) {
			return (res == (nr1 + nr2));
		}
		else if (op == 2) {
			return (res == (nr1 - nr2));
		}
		else if (op == 3) {
			return (res == (nr1 * nr2));
		}
		else if (op == 4) {   
			int256 r = nr1 % nr2;
			if (r != 0) return false;   
			return (res == (nr1 / nr2));
		}

		return true;
	}

	function _isNumberAvailable(ValOp[] memory avNums, uint256 len, int256 nr) private pure returns (bool) {

		for (uint256 i=0; i<len; i++) {
			if (!avNums[i].isused) {
				if (avNums[i].nr == nr) {
				  avNums[i].isused = true;
				  return true;
				}
			}
		}

		// the input number is not in available numbers, it may be used already
		return false;

	}

	function _chkNumberAvail(uint8 ncUsedNumbers, uint256 avlen, ValOp[] memory availNumbers, int256[] memory usedNumbers) private pure returns (bool) {
        for (uint8 i=0; i<ncUsedNumbers; i++) {
            if (!_isNumberAvailable(availNumbers, avlen, usedNumbers[i]))
            {
                return false;
            }
        }

        return true;
	}

	function _verifyCorrectness(uint256 len, int256[] calldata nr1s, int256[] calldata nr2s, int256[] calldata ress) private returns (bool) {

		uint8 ncUsedNumbers = 0;
		int256[] memory usedNumbers = new int256[](100); // int256[] memory usedNumbers; 
		ValOp[] memory availNumbers = new ValOp[](100); // ValOp[] memory availNumbers;

		// build available numbers from the game numbers
		// no push in memory arrays
		for (uint8 i=0; i<8; i++) {
			availNumbers[i].nr = int256(int8(curGames[msg.sender].nums[i]));
			availNumbers[i].nr = int256(int8(curGames[msg.sender].nums[i]));
			//ValOp memory v = ValOp(false, int256(int8(curGames[msg.sender].nums[i])));
			//availNumbers.push(v);
		}

		bool isTargetFound = false;
		int256 itarget = int256(int16(curGames[msg.sender].target));

		for (uint8 i=0; i<len; i++) {
		  usedNumbers[ncUsedNumbers] = nr1s[i]; ncUsedNumbers++;
		  usedNumbers[ncUsedNumbers] = nr2s[i]; ncUsedNumbers++;

		  // add new available number by putting the generated result from operation
		  availNumbers[i+8].nr = ress[i];

		  if (ress[i] == itarget) {
			  isTargetFound = true;
		  }
		}

		if (isTargetFound) {
			uint256 avlen = len + 8;
			if (!_chkNumberAvail(ncUsedNumbers, avlen, availNumbers, usedNumbers))
			{
				  _endGame(msg.sender, false, "Number not available or already used");
				  return false;         
			}
			_endGame(msg.sender, true, "WON");
		}
		else {
			_endGame(msg.sender, false, "Target not found");
		}

		console.log("verifyUserOperations isTargetFound=", isTargetFound);
		return isTargetFound;
	}

	function _endGame(address player, bool iswon, string memory reason) private {
		if (iswon) {
		  curGames[player].gs = GameState.WON;
		  curGames[player].ncwon += 1;
		  _updateAccomplishments(player);
		}
		else {
		  curGames[player].gs = GameState.LOST;
		} 
		emit ResultGame(player, curGames[player].gameid, iswon, reason);
	}

	function _updateAccomplishments(address player) private {

		if (curGames[player].opmeritWon[MERIT_WON] == 0) {
		  curGames[player].opmeritWon[MERIT_WON] = 1;
		}
		else 
		{
		  if (curGames[player].ncwon >= 100 && curGames[player].opmeritWon[MERIT_WON_100] == 0) {
			curGames[player].opmeritWon[MERIT_WON_100] = 1;
		  }
		  else if (curGames[player].ncwon >= 10 && curGames[player].opmeritWon[MERIT_WON_10] == 0) {
			curGames[player].opmeritWon[MERIT_WON_10] = 1;
		  }
		}

		if (curGames[player].target == 777 && curGames[player].opmeritWon[MERIT_LUCKY_777] == 0) {
		  curGames[player].opmeritWon[MERIT_LUCKY_777] = 1;
		}
		else if (curGames[player].target == 888 && curGames[player].opmeritWon[MERIT_LUCKY_888] == 0) {
		  curGames[player].opmeritWon[MERIT_LUCKY_888] = 1;
		}
		else if (curGames[player].target == 666 && curGames[player].opmeritWon[MERIT_LUCKY_666] == 0) {
		  curGames[player].opmeritWon[MERIT_LUCKY_666] = 1;
		}
	}

}


