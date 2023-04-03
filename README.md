# Operation One Game

Crunch numbers, reach your target number by arithmetic operations
Improve your math and play for fun
Earn game tokens by playing
Claim NFTs as you win
Play the game in BTTC test network: https://oneopgm.netlify.app/  
Get BTT test tokens: https://testfaucet.bt.io/#/
Watch demo: https://youtu.be/lV6J75223rI

==========
How to build:
Clone repository
"npm install" to install dependencies

==========
How to compile contracts:
npx hardhat compile
Some warnings may appear from included openzeppelin contracts. 

==========
How to test contracts under ./test:
Each test script deploys contracts to local hardhat node by using tdeploy.js
tdeploy.js: Deploys token, timelocktoken and game contracts.
Sends optoken (GOP) to game and timelocktoken contracts.

Test game logic to win-lose:
npx hardhat test ./test/tgamelogic.js

Test to win/claim/buy optoken (GOP):
npx hardhat test ./test/toptoken1.js
npx hardhat test ./test/toptoken2.js
npx hardhat test ./test/toptoken3.js

Test to win/claim/buy merit token NFT (GOM):
npx hardhat test ./test/tmerit2.js
npx hardhat test ./test/tmerit3.js

==========
Deploy to local Hardhat test chain:
"npx hardhat node" to run your test chain

How to test in your local hardhat test node:
1- open terminal, start node: "npx hardhat node"
2- new terminal, deploy your contracts locally: npx hardhat run --network localhost scripts/deploy.js
See your contract addresses in the node terminal 
Creates three contracts and owner account who creates contracts sends GOPs to other contracts. 
3- Start your webserver to run your frontend webpage
> cd frontend; node ..\node_modules\http-server\bin\http-server
./frontend/game.js has contract addresses needed for the web to run, make sure those addresses are the same from step 2.
in browser open: http://127.0.0.1:8080  => index.html from ./frontend is loaded with javascript files
in browser metamask: add hardhat test network: 127.0.0.1:8545
in browser metamask add your hardhat test accounts so that you can connect to the game and play: npx hardhat accounts
in browser game page: connect to game, and start playing
In local accounts make sure to reset account in advanced settings of metamaks the first time you interact

==========
Game is deployed to BTTC Donau Test chain:
token contract: 0x21138b615229AE73d18B6451358c2b0F1Ede66C4 
timelock contract: 0xD78401495F7019c9cb6ac531533F419FCCF640E4
game contract: 0x105394F8f5BCDa4B992a0D899bc5844B96edD705
To use BTTC test contract addresses, make sure to set isBTTC = true; in ./frontend/game.js

==========
Development notes:
./token/OpToken.sol: ERC20 token, creates GOP token with fix supply, GOP token can be claimed/bought via Game contract
./token/OpTimelockToken.sol: TokenTimelock contract
-Token sent to timelock token are released in releaseTime (given in constructor)
-See in ./test/deploy.js unlocktimestamp = 1717236000; // npx epoch-cli "2024/06/01 13:00"
./lib/Rand.sol: used for generating pseudorandom numbers for game
./logic/GameLogic.sol:
-Keeps track of users and their games, creates the game with numbers and its verification
./OpGame.sol: main entry, inherits ERC721-NFT (GOM) token and GameLogic, 
-handles claiming/buying GOP and GOM tokens

==========
How to deploy to BTTC donau test chain:
Go to remix page
https://remix.ethereum.org/#lang=en&optimize=true&runs=200
In Solidity compiler menu on the left enable optimization with 200 runs on the advanced configuration setting
Create a blank workspace and copy soliditiy files from this repository to Remix and compile
In Solidity deploy menu on the left select environment Injected provider-Metamask
Make sure in Metamask BTTC donau test chain is selected
See how-to https://doc.bt.io/docs/tutorial/quick-migration-guide-for-ethereum-dApp
The account connected to Remix is your owner account for the contracts
Make sure the account has enough BTT to create transactions
Get BTT test tokens: https://testfaucet.bt.io/#/
Deploy your contracts from this menu by providing constructor inputs for eact contract
In another account, play game as a user

