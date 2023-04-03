// https://docs.metamask.io/guide/ethereum-provider.html#table-of-contents
// https://www.npmjs.com/package/@metamask/detect-provider

var metamask = (function () {
  'use strict';
  
  const chainId_hardhat = 31337;
  const chainId_donauBTTC = 1029;

  var publicMetamask = {};

  let currentAccount = null;
  let curChainId = chainId_hardhat;

  publicMetamask.onLoad = function () {
    detectMetamask();
    gui.onLoad();
  }

  let detectMetamask = async function () {
    const provider = await detectEthereumProvider();
    if (provider !== window.ethereum) {
      gui.showError('Do you have multiple wallets installed?');
      gui.showAlert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
      
      return;
    }

    ethereum.request({ method: 'eth_chainId' })
    .then(handleChainChanged)
    .catch((err) => {gui.showError(err); } );

    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('accountsChanged', handleAccountsChanged);
    gui.showLog("detectMetamask " + currentAccount);
  }


  /**********************************************************/
  /* Handle chain (network) and chainChanged (per EIP-1193) */
  /**********************************************************/

  function isChainSupported(cid) {
    if (cid == chainId_donauBTTC)
    {
      return true;
    }
    if (cid == chainId_hardhat)
    {
      return true;
    }
    return false;
  }

  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    //window.location.reload();
    gui.showLog("handleChainChanged: " + _chainId);
    
    let cid = parseInt(_chainId, 16);
    let cname = "";   if (_chainId == "0x7a69") cname = " Hardhat Node"; // 31337
    if (_chainId == chainId_donauBTTC) cname = " BTTC Donau Test Chain"; 
    
    gui.showStatus("Detected Metamask chainID = " + cid + cname);

    if (!isChainSupported(cid)) {
      alert("Currently supporting only hardhat/BTTC test");
      gui.showStatus("Not connected - please switch to Hardhat/BTTC test chain");
      game.disconnect();
    }

    else {
      game.connectContract(true);
    }
    curChainId = cid;
  }

  /***********************************************************/
  /* Handle user accounts and accountsChanged (per EIP-1193) */
  /***********************************************************/

  function handleAccountsChanged(accounts) {

    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      currentAccount = undefined;
      gui.showLog('Please connect to MetaMask.');
      gui.showStatus("Disconnected");
      game.disconnect();
    } else if (accounts[0] !== currentAccount) {
      currentAccount = accounts[0];
      gui.showLog("Connected to Metamask = " + currentAccount);
      gui.showStatus("Connected to Metamask = " + currentAccount);
      game.connectContract(true); 
    }
    gui.showLog("handleAccountsChanged: " + currentAccount);
  }

  /*********************************************/
  /* Access the user's accounts (per EIP-1102) */
  /*********************************************/

  // You should only attempt to request the user's accounts in response to user
  // interaction, such as a button click.
  // Otherwise, you popup-spam the user like it's 1999.
  // If you fail to retrieve the user's account(s), you should encourage the user
  // to initiate the attempt.

  // While you are awaiting the call to eth_requestAccounts, you should disable
  // any buttons the user can click to initiate the request.
  // MetaMask will reject any additional requests while the first is still
  // pending.
  publicMetamask.connectMetamask = function () {
    if (!isChainSupported(curChainId)) {
      alert("Currently supporting only hardhat/BTTC test");
      gui.showStatus("Not connected - please switch to Hardhat/BTTC test chain");
      return;
    }

    ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          gui.showLog('Please connect to MetaMask.');
          gui.showStatus("Please connect to MetaMask");
          game.disconnect();
        } else {
          gui.showError(err);
        }
      });
  }

  return publicMetamask;

})();