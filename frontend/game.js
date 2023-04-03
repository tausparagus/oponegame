const isBTTC = false;
var timeTokenContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
var oneopTokenContractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
var oneopgmContractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
var timeTokenContractAddress_testBTTC = "0xD78401495F7019c9cb6ac531533F419FCCF640E4";
var oneopTokenContractAddress_testBTTC = "0x21138b615229AE73d18B6451358c2b0F1Ede66C4";
var oneopgmContractAddress_testBTTC = "0x105394F8f5BCDa4B992a0D899bc5844B96edD705";
var optoken_price = 0.005;
var merit_price = 0.05;
var optoken_price_testBTTC = 1e6;
var merit_price_testBTTC = 1e7;

const Merit = {
    WON: 0, WON_10: 1, WON_100: 2, LUCKY_777: 3, LUCKY_888: 4, LUCKY_666: 5
}
var game = (function () {

	'use strict';

	var publicGame = {};

	var oneopContract;
	var optokenContract;

	var isconnected = false;
	var userAccount;

	var curGamePlayer;
	var isgamerunning = false;
	var isgamewon = false;
	var curGameId;
	var ops, nr1s, nr2s, ress;
	var timer = null, gamets, counterts;
	const playtime = 300;

	function displayAccounts(web3, accs) {
		$("#accounts").empty();
		let cnt = 0; let balance = 0;
		for (ac of accs) {
			web3.eth.getBalance(ac).then(bal => {
				balance = bal / 1E+18;
				$("#accounts").append(`<div class="account">
				<ul>
				<li>${cnt}: ${ac} - ${balance} ETH</li>
				</ul>
			</div>`);	
			cnt ++;	
			});	
		}
	}

	function displayAccount(web3, ac) {
		gui.showLog("display account");
		$("#accounts").empty();
		let cnt = 0; let balance = 0;
		web3.eth.getBalance(ac).then(bal => {
			balance = bal / 1E+18;
			$("#accounts").append(`<div class="account">
			<ul>
			<li> Metmask account: ${ac} - ${balance} ETH</li>
			</ul>
		</div>`);	
		cnt ++;	
		});	
	}

	function startTimer() {
		if (timer != null) {
			clearInterval(timer);
			timer = null;
		}
		timer = setInterval(callbackTimer, 1000);
		gui.showTime(counterts);
	}

	function stopTimer() {
		clearInterval(timer);
		gui.hideTarget("PLAY");
		timer = null;
		counterts = 0;
	}

	function callbackTimer() {
		let cursec = Math.floor(Date.now() / 1000);
		let displaced = cursec - gamets;
		if (displaced >= playtime) {
			counterts = 0; 
		} else {
			if (counterts != 0) {
				counterts = playtime - 1 - displaced;
			}
		}

		if (counterts < 1) {
			counterts = 0;
			stopTimer();
		}

		gui.showTime(counterts == 0 ? "" : counterts);
	}

	publicGame.disconnect = function () {
		isconnected = false;
		userAccount = undefined;
		gui.removeOperations();
		displayClaimableOpToken();
        displayOpTokenBalance();
		gui.showPlayer("");
		gui.showHideConnect(true);
		gui.showStatus("");
        gui.showInfo("");
        gui.showTime("");
	}

	publicGame.openPageGame = function () {
		gui.showPageGame();
	}

	publicGame.openPageFeat = function () {
		gui.showPageFeat();
		displayClaimableOpToken();
		displayOpTokenBalance();
		getPlayerStat();
		//displayMeritTokenBalance();
		//displayMeritClaimable();
	}

	publicGame.connectContract = function (overwrite) {
		gui.showLog("connectContract: " + " overwrite = " + overwrite + " isconnected = " + isconnected);

		if (isBTTC) {
			timeTokenContractAddress = timeTokenContractAddress_testBTTC;
			oneopTokenContractAddress = oneopTokenContractAddress_testBTTC;
			oneopgmContractAddress = oneopgmContractAddress_testBTTC;
			optoken_price = optoken_price_testBTTC;
			merit_price = merit_price_testBTTC;
		}

		if (!overwrite && isconnected) {
			gui.showStatus("Already connected");	
			return;
		}
		isconnected = false;
		userAccount = undefined;

		//let web3 = new Web3('ws://127.0.0.1:8545'); 
		//let web3 = new Web3(Web3.givenProvider);
		if (!window.ethereum) {
			gui.showAlert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
			return;
		}
		window.web3 = new Web3(window.ethereum);
		//await window.ethereum.enable();
		oneopContract = new web3.eth.Contract(oneopABI, oneopgmContractAddress);
		web3.eth.getAccounts().then(e => { 
			if (e.length != 0) {
				isconnected = true;
				userAccount = e[0];
				gui.showLog("A: " + userAccount);
				gui.showHideConnect(false);
				//displayAccount(web3, userAccount);
				gui.showPlayer(userAccount);
				checkIsGameRunning();
			}
		});

		optokenContract = new web3.eth.Contract(optokenABI, oneopTokenContractAddress);
		gui.showPageGame();	

		/* with metamask eth_logs fail in hardhat instead directly check from function call
		oneopContract.events.NewGame({ filter: { _to: userAccount } })
		.on("data", function (event) {
			let data = event.returnValues;
			gui.showLog("Event NewGame:" + data);
			parseGameData(data);
		}).on("error", console.error);

		oneopContract.events.ResultGame({ filter: { _to: userAccount } })
		.on("data", function (event) {
		let data = event.returnValues;
		gui.showLog("Event ResultGame:" + data);
		parseGameResult(data);
	}).on("error", console.error);
	*/
	}

	function getPlayerStat () {
		gui.showLog("getPlayerStat, isconnected = " + isconnected);
		if (!isconnected) {
			//gui.showStatus("Not connected");
			return false;
		}

		gui.showLog("Getting player stat");
		return oneopContract.methods.getPlayerStat()
		.call({ from: userAccount })
		.then(res => { 
			//gui.showLog(res);
			parseStatData(res);
		});
	}

	function checkIsGameRunning () {
		gui.showLog("checkIsGameRunning, isconnected = " + isconnected);
		if (!isconnected) {
			return false;
		}

		return oneopContract.methods.isGameRunning()
		.call({ from: userAccount })
		.then(res => { 
			gui.showLog(res);
			if (res.gameid != 0) {
				res.player = userAccount;
				parseGameData(res);
				return true;
			}
			else {
				isgamerunning = false; 
				gui.removeOperations();
			}
		});
	}

	publicGame.checkGameRunning = function () {
		gui.showLog("checkGameRunning, isconnected = " + isconnected);
		if (!isconnected) {
			gui.showStatus("Not connected");
			return false;
		}

		gui.showStatus("Checking existing game");
		return oneopContract.methods.isGameRunning()
		.call({ from: userAccount })
		.then(res => { 
			gui.showLog(res);
			if (res.gameid != 0) {
				gui.showStatus("Game already running");
				res.player = userAccount;
				parseGameData(res);
				return true;
			}
			else {
				isgamerunning = false; 
				createNewGame();
			}
		});
	}

	function createNewGame() {
		if (!isconnected) {
			gui.showStatus("Not connected");
			return;
		}
		if (isgamerunning) {
			gui.showStatus("Game is already running");
			return;
		}
		gui.showStatus("Creating new game");
		gui.removeOperations();
		return oneopContract.methods.newGame()
		.send({ from: userAccount })
		.on("receipt", function (receipt) {
			gui.showStatus("Created game");	
			gui.showError("");
			parseGameData(receipt.events.NewGame.returnValues);
		})
		.on("error", function (error) {
			gui.showError(error.message);
		});
	}

	function verifyGameResult() {
		gui.showStatus("Verifying game result");
		return oneopContract.methods.verifyUserOperations(curGameId, ops, nr1s, nr2s, ress)
		.send( 
			{ from: userAccount })
		.on("receipt", function (receipt) {
			gui.showStatus("Successfully verified result");	
			gui.showError("");
			parseGameResult(receipt.events.ResultGame.returnValues);
		})
		.on("error", function (error) {
			gui.showError(error.message);
		});
	}

	function parseStatData(data) {
		gui.showNcPlayed(data.ncplayed);
		gui.showNcWon(data.ncwon);
		gui.showMeritDataAll(data.opmeritClaimed, data.opmeritWon);
	}

	function parseGameData(data) {
        gui.showInfo("");
		gui.showTime("");
		gui.showStatus("Game is running");
		//gui.showPlayer(data.player + " id = " + data.gameid);
		curGameId = data.gameid;
		curGamePlayer = data.player;
		gui.showTarget(data.target);
		gui.showGameData(data.nums);
		if (data.tsstarted) {
			//let date = new Date(data.tsstarted * 1000);
			//gui.showTime(date.toLocaleDateString("default") +  " " + date.toLocaleTimeString("default"));
			gamets = data.tsstarted;
			let cursec = Math.floor(Date.now() / 1000);
			let displaced = cursec - gamets;
			if (displaced >= playtime) {
				isgamerunning = false;
				createNewGame();
			} else {
				counterts = playtime - 1 - displaced;
				isgamerunning = true;
			}
		}
		else {
			gamets = Math.floor(Date.now() / 1000);
			counterts = playtime - 1;
			isgamerunning = true;
		}
		
		if (isgamerunning) {
			startTimer();
		}
	}

	function parseGameResult(data) {
		gui.showStatus("Parsing game result");
		if (curGameId == data.gameid && curGamePlayer == data.player)
		{
			isgamerunning = false;
			isgamewon = data.isWon;
			gui.showWon(isgamewon, data.reason);
			gui.hideTarget("PLAY");
			stopTimer();
			gui.showTime("");
		}
		else 
		{
			if (curGameId != data.gameid) gui.showStatus("Result mismatch: GameId");
			else gui.showStatus("Result mismatch: Player");
		}
	}


	var opval1 = 0, opval2 = 0, curop = 0, opdoing = 0;
	publicGame.setNum = function (id) {
		if (!isconnected) {
			gui.showStatus("Not connected");
			return;
		}
		if (!isgamerunning) {
			gui.showStatus("Game is not running");
			return;
		}

		//gui.showLog("id=" + id);
		//gui.showLog("id=" + id + " val=" + $('#' + id).attr("value"));
		if (curop == 0) {
			opval1 = parseInt($('#' + id).attr("value"));
			opdoing = 1;
			displayCurrentOperation();
		}
		else {
			opval2 = parseInt($('#' + id).attr("value"));
			if (addNewOperation()) {
				opdoing = 0;
				opval1 = 0;
				opval2 = 0;
				curop = 0;
				displayCurrentOperation();
			}
			else {
				opval2 = 0;
			}
		}
	}

	publicGame.setOp = function (id) {
		//gui.showLog("id=" + id, " val=" + $('#' + id).attr("value"));
		if (!isgamerunning) {
			gui.showStatus("Game is not running");
			return;
		}

		if (opval1 == 0) {
			curop = 0;
		}
		else {
			curop = id;
		}
		displayCurrentOperation();
	}

	var cntres = 0;
	function addNewOperation() {
		if (curop != 0) {
			let curoptxt = "";
			let resval = 0;
			if (curop == 1) {
				curoptxt = "+";
				resval = opval1 + opval2;
			}
			else if (curop == 2) {
				curoptxt = "-";
				resval = opval1 - opval2;
			}
			else if (curop == 3) {
				curoptxt = "*";
				resval = opval1 * opval2;
			}
			else if (curop == 4) {
				if (opval1 % opval2 != 0) {
					return false;
				}
				curoptxt = "/";
				resval = opval1 / opval2;
			}

			let txtres = opval1 + " " + curoptxt + " " + opval2 + " = ";  
			//gui.showLog(txtres + resval);

			let idres = "res_" + cntres;
			let idlineop = "lineop_" + cntres;
			let idopval1 = "opval1_" + cntres;
			let idopval2 = "opval2_" + cntres;
			let idopcur = "opcur_" + cntres;

			gui.showOperation(idlineop, cntres, idopval1, opval1, idopcur, curoptxt, idopval2, opval2, idres, resval);
			cntres ++;
			return true;
		}

		return false;
	}

	publicGame.sendResultOps = function () {
		if (!isgamerunning) {
			gui.showStatus("Game is not running");
			return;
		}
		
		if (buildResultOpsToSend()) {
			verifyGameResult();
		}
		else {
			gui.showStatus("No operations to send!");
		}
	}

	function buildResultOpsToSend() {
		var ind = -1;
		ops = []; nr1s = []; nr2s = []; ress = [];
		$('.newop').children().each( (index, element) => {
			//gui.showLog(index);     // children's index
			//gui.showLog(element);   // children's element 
			//ops = new Uint8Array(ind); nr1s = new Array(ind); nr2s = new Array(ind); ress = new Array(ind);
			
			if (element.id.startsWith("opval1_")) {
				ind++;
				nr1s[ind] = element.value; 
			}
			else if (element.id.startsWith("opcur_")) {
				if (element.value.startsWith("+")) {
					ops[ind] = 1;
				}
				else if (element.value.startsWith("-")) {
					ops[ind] = 2;
				}
				else if (element.value.startsWith("*")) {
					ops[ind] = 3;
				}
				else if (element.value.startsWith("/")) {
					ops[ind] = 4;
				}
			}	
			else if (element.id.startsWith("opval2_")) {
				nr2s[ind] = element.value; 
			}
			else if (element.id.startsWith("res_")) {
				ress[ind] = element.value;
			}
		
			//gui.showLog("ind= " + ind + " => " + element.id); 
			
		});

		if (ind == -1) {
			return false;
		}

		return true;
	}

	publicGame.delOp = function (id) {
		if (isgamerunning) {
			gui.removeOperation(id);
		}
	}

	function displayCurrentOperation() {
		if (opdoing == 0) {
			//$("#gmTempOper").empty();
			gui.hideTmpOper();
		}
		else {
			if (curop == 0) {
				//$("#gmTempOper").text(opval1)
				gui.showTmpOperVal(opval1);
			}
			else {
				let curoptxt = "+";
				if (curop == 2) curoptxt = "-";
				else if (curop == 3) curoptxt = "*";
				else if (curop == 4) curoptxt = "/";
				//$("#gmTempOper").text(opval1 + curoptxt)
				gui.showTmpOperValOp(opval1, curoptxt);
			}
		}
	}

	function displayClaimableOpToken () {
		if (!isconnected) {
			//gui.showStatus("Not connected");
			return;
		}

		gui.showLog("Getting claimable optoken");

		getClaimableOpToken().then(function (result) {
			//gui.showLog("getClaimableOpToken " + result);
			const formattedResult = result; // / 1E18;
			//$("#claimableOpToken").text("Claimable optoken balance = " + formattedResult + " GOP");	
			$("#claimableOpToken").text(formattedResult);	

			if (formattedResult > 0) {
				gui.showHideClaimOpToken(true);
			}
			else {
				gui.showHideClaimOpToken(false);
			}
		});
	}

	function getMeritPrice(meritId) {
		let mult = 1;
		switch(meritId) {
			case Merit.WON:
			  mult = 1;
			  break;
			case Merit.WON_10:
			  mult = 2;
			  break;
  		    case Merit.WON_100:
			  mult = 5;
			  break;
			case Merit.LUCKY_777:
			  mult = 10;
			  break;
			case Merit.LUCKY_888:
			  mult = 20;
			  break;
			case Merit.LUCKY_666:
			  mult = 10;
			  break;
			default:
			  mult = 1;
			  break;
		}
		return merit_price * mult;
	}

	publicGame.buyMerit = function (meritId) {
		if (!isconnected) { gui.showStatus("Not connected"); return; }

		web3.eth.getBalance(userAccount).then(bal => {
			let balance = bal / 1E+18;
			let meritPrice = getMeritPrice(meritId);
			console.log("balance = ", balance, " meritPrice =  ", meritPrice);
			if (balance > meritPrice) {
				buyDirectMerit(meritId, meritPrice * 1E+18);
			}
			else {
				gui.showStatus("Not enough balance to buy merit");
			}

		});	
	}

	function buyDirectMerit(meritId, amountToSend) {
		if (!isconnected) { gui.showStatus("Not connected"); return; }

		gui.showLog("Buying merit");

		return oneopContract.methods.buyMeritToken(meritId)
		.send({ from: userAccount, value: amountToSend })
		.on("receipt", function (receipt) {
			//console.log(receipt);
			if (receipt.events.BuyMeritToken.returnValues.tokenId > 0) {
				gui.showStatus("Bought merit");
				gui.showError("");
				gui.showMeritData(meritId, 1, 0);
			}
		})
		.on("error", function (error) {
			gui.showError(error.message);
		});
	}

	publicGame.buyOpToken = function () {
		if (!isconnected) { gui.showStatus("Not connected"); return; }

		let buycnt = $("#opTokenQuantity").val();
		gui.showLog("Buy optoken = " + buycnt);
		buycnt = Math.floor(buycnt);
		$("#opTokenQuantity").val(buycnt);
		if (buycnt < 1) {
			gui.showStatus("Buy amount should be non-zero");
			return;
		}
		web3.eth.getBalance(userAccount).then(bal => {
			let balance = bal / 1E+18;
			let totval = buycnt * optoken_price;
			console.log("balance = ", balance, " optoken_price =  ", optoken_price, " totval = ", totval);
			if (balance > totval) {
				//buyDirectOpToken(buycnt, totval * 1E+18);
				buyDirectOpToken(buycnt, web3.utils.toWei(totval.toString(), 'ether'));
			}
			else {
				gui.showStatus("Not enough balance to buy optoken");
			}


		});	
	}

	function buyDirectOpToken(tokenAmt, amountToSend) {
		if (!isconnected) { gui.showStatus("Not connected"); return; }

		gui.showLog("Buying optoken");

		return oneopContract.methods.buyOpToken(tokenAmt)
		.send({ from: userAccount, value: amountToSend })
		.on("receipt", function (receipt) {
			//console.log(receipt);
			if (receipt.events.BuyOpToken.returnValues.amountOfTokens > 0) {
				gui.showStatus("Bought optoken");
				gui.showError("");
				displayOpTokenBalance();
			}
		})
		.on("error", function (error) {
			gui.showError(error.message);
		});
	}

	publicGame.claimMerit = function (meritid) {
		if (!isconnected) { gui.showStatus("Not connected"); return; }

		checkClaimOpMerit(meritid).then(function (result) {
			if (result) {
				claimDirectMerit(meritid);
			}
		});
	}

	function claimDirectMerit(meritid) {
		if (!isconnected) { gui.showStatus("Not connected"); return; }

		gui.showLog("Claiming merit");

		return oneopContract.methods.claimOpMerit(meritid)
		.send({ from: userAccount })
		.on("receipt", function (receipt) {
			//console.log(receipt);
			if (receipt.events.ClaimMerit.returnValues.tokenId > 0) {
				gui.showStatus("Claimed merit");
				gui.showError("");
				gui.showMeritData(receipt.events.ClaimMerit.returnValues.meritId, 1, 0);
			}
			//getPlayerStat();
			//displayMeritClaimable();	
			//displayMeritTokenBalance();
		})
		.on("error", function (error) {
			gui.showError(error.message);
		});
	}

	publicGame.claimOpToken = function () {
		if (!isconnected) {
			gui.showStatus("Not connected");
			return;
		}

		getClaimableOpToken().then(function (result) {
			const formattedResult = result; // / 1E18;
			if (formattedResult > 0) {
				claimDirectOpToken();
			}
		});
	}

	function claimDirectOpToken() {
		if (!isconnected) {
			gui.showStatus("Not connected");
			return;
		}

		gui.showLog("Claiming optoken");

		return oneopContract.methods.claimOpToken()
		.send({ from: userAccount })
		.on("receipt", function (receipt) {
			//console.log(receipt);
			if (receipt.events.ClaimOpToken.returnValues.amountOfTokens > 0) {
				gui.showStatus("Claimed optoken");
				gui.showHideClaimOpToken(false);
				gui.showError("");
				displayOpTokenBalance();
			}
			
			//displayClaimableOpToken();	
			//displayOpTokenBalance();
		})
		.on("error", function (error) {
			gui.showError(error.message);
		});
	}

	function displayOpTokenBalance() {
		if (!isconnected) {
			//gui.showStatus("Not connected");
			return;
		}

		gui.showLog("Getting optoken balance");

		getOpTokenBalance().then(function (result) {		
			const formattedResult = result / 1E18;
			gui.showLog("getOpTokenBalance " + formattedResult);
			//$("#currentOpToken").text("Current optoken balance = " + formattedResult + " GOP");	
			$("#currentOpToken").prop("value", "Balance GOP = " + formattedResult);
		});
	}

	async function getOpTokenBalance() {
		let balance = await optokenContract.methods.balanceOf(userAccount).call();
		return balance;
	}

	async function getClaimableOpToken() {
		let balance = await oneopContract.methods.getClaimableOpToken().call({ from: userAccount })
		return balance;
	}

	function displayMeritTokenBalance() {
		if (!isconnected) { gui.showStatus("Not connected"); return; }
		gui.showLog("Getting merittoken balance");

		getMeritTokenBalance().then(function (result) {		
			gui.showLog("getMeritTokenBalance " + result);
			$("#currentMeritToken").text("Current merit balance = " + result + " GOM");	
		});
	}

	function displayMeritClaimable(id) {
		if (!isconnected) { gui.showStatus("Not connected"); return; }
		gui.showLog("Checking claimable merit 0");

		checkClaimOpMerit(id).then(function (result) {		
			gui.showLog("checkClaimOpMerit " + result);
			if (result) {
				$("#cmerit0").text("Yes");	
			}
			else {
				$("#cmerit0").text("No");	
			}
		});
	}

	async function getMeritTokenBalance() {
		let balance = await oneopContract.methods.balanceOf(userAccount).call();
		return balance;
	}

	async function checkClaimOpMerit(meritid) {
		let claimable = await oneopContract.methods.checkClaimOpMerit(meritid).call({ from: userAccount })
		return claimable;
	}


	return publicGame;

})();