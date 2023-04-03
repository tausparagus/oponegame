// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OpToken is ERC20, Ownable {
    //uint256 constant public maxFixSupply = 1000000;

    constructor(uint256 maxFixSupply) ERC20("OpToken", "GOP") {
        if (maxFixSupply == 0) {
            maxFixSupply = 1000000;
        }
        _mint(msg.sender, maxFixSupply * (10 ** decimals()));
    }

}
