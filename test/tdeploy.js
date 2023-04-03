let owner;
let acc1;
let acc2;
let accs;

let optokenContract;
let optimelocktokenContract;
let gameContract;

const unlocktimestamp = 1717236000; // npx epoch-cli "2024/06/01 13:00"
const tokenInitMintBalance = 1000000;
const tokenInitGameContractBalance =  tokenInitMintBalance / 2;
const tokenInitTimelockContractBalance = tokenInitMintBalance / 4;
const finalInitOwnerBalance = tokenInitMintBalance - tokenInitGameContractBalance - tokenInitTimelockContractBalance;
const tokenMaxClaimable = 100;
const basePrice = 5;
const meritBaseUri = "https://bafybeidomraxkoj2l6htwrbgiybltifmw3f4ukuwdkugpmymgorqhh3vf4.ipfs.dweb.link/";

const GameState = {
    NOTRUN: 0, RUNNING: 1, LOST: 2, WON: 3
}
const Merit = {
    WON: 0, WON_10: 1, WON_100: 2, LUCKY_777: 3, LUCKY_888: 4, LUCKY_666: 5
}
 
module.exports = {
    convertToNumber: function (hex) {
        if (!hex) return 0
        let decimals = 18
        //console.log(`Converting to number ${hex} with ${decimals} decimals`)
        return ethers.utils.formatUnits(hex, decimals)
    },
    isEqualEth: function (hex1, hex2) {
        if (!hex1) return 0
        if (!hex2) return 0
        console.log("isEqualEth ${hex1} with ${hex2}");
        return (hex1 == hex2)
    },
    hello: function () {console.log("Hello this is tdeploy.js");},
    getOwner: function () {return owner},
    getAcc1: function () {return acc1},
    getAcc2: function () {return acc2},
    getAccounts: function () {return accs},
    getOpContract: function () {return optokenContract},
    getTimeContract: function () {return optimelocktokenContract},
    getGameContract: function () {return gameContract},
    getOpInitBalance: function () {return tokenInitMintBalance},
    getOpTimeBalance: function () {return tokenInitTimelockContractBalance},
    getOpGameBalance: function () {return tokenInitGameContractBalance},
    getOpOwnerBalance: function () {return finalInitOwnerBalance},
    getTokenMaxClaimable: function () {return tokenMaxClaimable},
    getBasePrice: function () {return basePrice},
    getUnlockTime: function () {return unlocktimestamp;},
    getGameStateNotrun: function () {return GameState.NOTRUN;},
    getGameStateWon: function () {return GameState.WON;},
    getGameStateLost: function () {return GameState.LOST;},
    getGameStateRunning: function () {return GameState.RUNNING;},
    getMeritWon: function () {return Merit.WON;},
    getMeritWo10: function () {return Merit.WON_10;},
    getMeritWn100: function () {return Merit.WON_100;},
    getMeritL777: function () {return Merit.LUCKY_777;},
    getMeritL888: function () {return Merit.LUCKY_888;},
    getMeritL666: function () {return Merit.LUCKY_666;},
    getMeritBaseUri: function () {return meritBaseUri;},
    initDeploy: async function(isdebuggame) {
        [owner, acc1, acc2, ...accs] = await ethers.getSigners();
        console.log("Owner = ", owner.address);
        console.log("Account 1 = ", acc1.address);
        console.log("Account 2 = ", acc2.address);

        // Deploy token contract - owner has tokenInitMintBalance
        OpTokenFactory = await ethers.getContractFactory('OpToken');
        optokenContract = await OpTokenFactory.deploy(tokenInitMintBalance);
        console.log("OpToken deployed to:", optokenContract.address);

        // Deploy timelock contract
        OpTimelockTokenFactory = await ethers.getContractFactory('OpTimelockToken');
        optimelocktokenContract = await OpTimelockTokenFactory.deploy(optokenContract.address, owner.address, unlocktimestamp);
        console.log("OpTimelockToken deployed to:", optimelocktokenContract.address); 

        // Send to timelock contract from owner of amount tokenInitTimelockContractBalance
        await optokenContract.transfer(optimelocktokenContract.address, ethers.utils.parseEther(tokenInitTimelockContractBalance.toString()));
        console.log("Send from ", owner.address, " to ", optimelocktokenContract.address, " " , tokenInitTimelockContractBalance, " GOP"); 

        // Deploy game Contract
        const GameContractFactory = await ethers.getContractFactory('OpGame');
        gameContract = await GameContractFactory.deploy(isdebuggame, optokenContract.address, basePrice, "https://bafybeidomraxkoj2l6htwrbgiybltifmw3f4ukuwdkugpmymgorqhh3vf4.ipfs.dweb.link/");
        console.log("OpGame deployed to:", gameContract.address); 

        // Send to game contract from owner of amount tokenInitGameContractBalance, so users can claim from contract
        await optokenContract.transfer(gameContract.address, ethers.utils.parseEther(tokenInitGameContractBalance.toString()));
        console.log("Send from ", owner.address, " to ", gameContract.address, " " , tokenInitGameContractBalance, " GOP"); 

        // Now owner has finalInitOwnerBalance

    }
}


