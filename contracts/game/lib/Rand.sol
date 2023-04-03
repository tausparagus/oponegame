// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Rand
 * @dev Generate random number
 */
library Rand {

  function generateSeed(uint randSeed) internal view returns(uint)
  {
    randSeed = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randSeed)));
    randSeed++; 
    return randSeed;
  }
  
  function randModUint(uint randSeed, uint modulus) internal view returns(uint)
  {
    uint rand = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randSeed))) % modulus;

    //console.log("randSeed=", randSeed);
    //console.log("rand=", rand);
    return (rand);
  }

  function randUint8(uint randSeed, uint8 min, uint8 max) internal view returns (uint8){
    uint randomNum = randModUint(randSeed, (max-min) + 1) + min;
    return uint8(randomNum);
	}

  function randUint16(uint randSeed, uint16 min, uint16 max) internal view returns (uint16){
    uint randomNum = randModUint(randSeed, (max-min) + 1) + min;
    return uint16(randomNum);
  }
}