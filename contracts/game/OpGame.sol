// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./logic/GameLogic.sol";
import "./token/OpToken.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Things to update for different blockchains
// buyOpToken() => baseprice => constructor
// buyMeritToken() => baseprice => constructor
// maxFixSupply in OpToken.sol => constructor
// getClaimableOpToken() => maxClaimable = 100
// maxTimePass in GameLogic.sol => 300 = 5min

contract OpGame is GameLogic, ERC721 {
    using Strings for uint8;
    using Counters for Counters.Counter;
	uint256 private baseprice = 5;	

    OpToken private opTokenContract;
    Counters.Counter private _tokenIdCounter;
    string private baseuri;

	event BuyOpToken(address buyer, uint256 amountOfVal, uint256 amountOfTokens);
	event BuyMeritToken(address buyer, uint256 amountOfVal, uint8  meritId, uint256 tokenId);

    constructor(bool isdebug, address tokenAddress, uint256 bprice, string memory uri) ERC721("OpMerit", "GOM") {
        isDebugActive = isdebug;
        opTokenContract = OpToken(tokenAddress);
		baseprice = bprice;
        baseuri = uri;
    }

	/* ==================== EXTERNAL  ================================ */
	function claimAllOpMerit() external returns (bool success) {
		bool ret;
		ret = _claimOpMerit(MERIT_WON);
		ret = _claimOpMerit(MERIT_WON_10) || ret;
		ret = _claimOpMerit(MERIT_WON_100) || ret;   
		ret = _claimOpMerit(MERIT_LUCKY_777) || ret;   
		ret = _claimOpMerit(MERIT_LUCKY_888) || ret;  
		ret = _claimOpMerit(MERIT_LUCKY_666) || ret;  
		console.log("claimAllOpMerit = ", ret);
		return ret;
	}

	function claimOpMerit(uint8 meritId) external returns (bool success) {
		require(meritId <= MERIT_LUCKY_666, "Invalid merit");
		bool ret;
		ret = _claimOpMerit(meritId);
		console.log("claimOpMerit meritId = %d", meritId);
		return ret;
	}
	
	function checkClaimOpMerit(uint8 meritId) public view returns (bool success){
		require(meritId <= MERIT_LUCKY_666, "Invalid merit");
		if ((curGames[msg.sender].opmeritWon[meritId] == 1) && (curGames[msg.sender].opmeritClaimed[meritId] == 0)) {
			return true;
		}
		
		return false;
	}
	
	function claimOpToken() external returns (bool success){
		uint256 claimable = getClaimableOpToken();
		require (claimable > 0, "No claimable token");
		if (claimable > 0) {
			// update optokenClaimed before transfer
			curGames[msg.sender].optokenClaimed += claimable;
		
			(bool sent) = opTokenContract.transfer(msg.sender, claimable * 1e18);
			require(sent, "Failed to transfer token to user");
			emit ClaimOpToken(msg.sender, claimable);
			return true;
		}
		
		return false;
	}
	
	/* ==================== PUBLIC ================================ */
	function getClaimableOpToken() public view returns (uint256 canclaim) {
		uint256 maxClaimable = 100;
		if (curGames[msg.sender].optokenClaimed >= maxClaimable) {
			return 0;
		}
		
		uint256 availClaimable = maxClaimable - curGames[msg.sender].optokenClaimed;
		uint256 claimable = curGames[msg.sender].ncplayed - curGames[msg.sender].optokenClaimed;
		
		if (claimable > 0) {
			if (claimable >= availClaimable) {
				claimable = availClaimable;
			}
			uint256 gameContractBalance = opTokenContract.balanceOf(address(this));
			console.log("getClaimableOpToken gameContractBalance = %d", gameContractBalance);
			if (gameContractBalance >= claimable) {
				return claimable;
			}
		}
		
		return 0;
	}
	
	/* ==================== ERC721 ================================ */
	function _baseURI() internal view override returns (string memory) {
		return baseuri;
	}
	
	function setBaseURI(string calldata uri) public onlyOwner {
		baseuri = uri;
	}
	
	function setBasePrice(uint256 bprice) public onlyOwner {
		baseprice = bprice;
	}

	function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
		_requireMinted(tokenId);

		// Individual merit names are due to upload of nfts to nftstore
	
		string memory baseURI = _baseURI();
		uint8 meritId = meritIds[tokenId];
		string memory meritName = "";
		if (meritId == MERIT_WON) { meritName = "1.png"; }
		else if (meritId == MERIT_WON_10) { meritName = "hithard.png"; }
		else if (meritId == MERIT_WON_100) { meritName = "genius8all.png"; }
		else if (meritId == MERIT_LUCKY_777) { meritName = "777_fiddle.png"; }
		else if (meritId == MERIT_LUCKY_888) { meritName = "prof.png"; }
		else if (meritId == MERIT_LUCKY_666) { meritName = "33_needle.png"; }
		return string(abi.encodePacked(baseURI, meritName));
	}
	
	function _opMeritMint(address to, uint8 meritId) private returns (uint256){
		uint256 tokenId = _tokenIdCounter.current();
		_tokenIdCounter.increment();
		meritIds[tokenId] = meritId;
		_safeMint(to, tokenId);
		emit ClaimMerit(msg.sender, tokenId, meritId);
		console.log("opMeritMint tokenId=%d, meritId=%d", tokenId, meritId);
		return tokenId;
	}
	
	function _claimOpMerit(uint8 meritId) private returns (bool){
		if ((curGames[msg.sender].opmeritWon[meritId] == 1) && (curGames[msg.sender].opmeritClaimed[meritId] == 0)) {
			// update opmeritClaimed before mint
			curGames[msg.sender].opmeritClaimed[meritId] = 1;
			_opMeritMint(msg.sender, meritId);
			return true;
		}
	
		return false;
	}
	
	/* ==================== Payable ================================ */
    receive() payable external {
		console.log("receive %s => %s", msg.sender, msg.value);
    }

    fallback() external payable {
		console.log("fallback %s => %s", msg.sender, msg.value);
    }

    function withdraw () external payable onlyOwner returns (bool issuccess) { 
        uint256 amount = address(this).balance; 
        require(amount > 0, 'Contract has no balance to withdraw');
        address payable owner = payable(owner());
        (bool success, ) = owner.call{value: amount}('');
        require(success, "Failed to send");
		return success;
    }

	function buyOpToken(uint256 inpAmount) external payable returns (uint256 soldAmount) {
		require(msg.value > 0, "Non-zero value needed to buy token");
		console.log("buyOpToken inpAmount=%d val=%d", inpAmount, msg.value);

		//  optoken 0.005 eth      => 5 * 1 * (10**15)
		//  optoken 10000000 btt   => (10**8) * 100 * (10**15)
		uint256 multfac = 1; 
		if (baseprice >= 1e3) {
			multfac = 100;
		}
		uint256 expval = (1e15); // 10**15
		require(msg.value == (inpAmount * baseprice * multfac * expval), "Optoken payment not correct");

		// check if the Contract has enough amount of tokens for the transaction
		uint256 gameContractBalance = opTokenContract.balanceOf(address(this));
		console.log("buyOpToken gameContractBalance = %d", gameContractBalance / 1e18);
		require(gameContractBalance >= (inpAmount*1e18), "Contract has not enough tokens in its balance");

		// Transfer token to the msg.sender
		(bool sent) = opTokenContract.transfer(msg.sender, inpAmount * 1e18);
		require(sent, "Failed to transfer token to user");

		emit BuyOpToken(msg.sender, msg.value, inpAmount);

		return inpAmount;
  	}

	function buyMeritToken(uint8 meritId) external payable returns (bool success) {
		require(msg.value > 0, "Non-zero value needed to buy merit");
		require(meritId <= MERIT_LUCKY_666, "Invalid merit");
		require(curGames[msg.sender].opmeritClaimed[meritId] == 0, "Merit already claimed");

		console.log("buyMeritToken meritId=%d val=%d", meritId, msg.value);

		uint256 multfac = 1; 
		if (baseprice >= 1e3) {
			multfac = 100;
		}
		uint256 expval = (1e16); // 10**16
		//  meritwon 0.05 eth      => 5 * 1 * (10**16)
		//  meritwon 100000000 btt => (10**8) * 100 * (10**16)

		// Each merit has different price
		if (meritId == MERIT_WON) {
			require(msg.value == (1 * baseprice * multfac * expval), "Merit payment not correct");
		}
		else if (meritId == MERIT_WON_10) {
			require(msg.value == (2 * baseprice * multfac * expval), "Merit payment not correct");
		}	
		else if (meritId == MERIT_WON_100) {
			require(msg.value == (5 * baseprice * multfac * expval), "Merit payment not correct");
		}	
		else if (meritId == MERIT_LUCKY_777) {
			require(msg.value == (10 * baseprice * multfac * expval), "Merit payment not correct");
		}	
		else if (meritId == MERIT_LUCKY_888) {
			require(msg.value == (20 * baseprice * multfac * expval), "Merit payment not correct");
		}	
		else if (meritId == MERIT_LUCKY_666) {
			require(msg.value == (10 * baseprice * multfac * expval), "Merit payment not correct");
		}	

		// update claimed before mint
		curGames[msg.sender].opmeritClaimed[meritId] = 1;
		uint256 tokenId = _opMeritMint(msg.sender, meritId);

		emit BuyMeritToken(msg.sender, msg.value, meritId, tokenId);

		return true;
  	}
}