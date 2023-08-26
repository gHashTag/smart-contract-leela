const hre = require('hardhat');
const fs = require('fs');
require('dotenv').config();

let provider = process.env.TENDERLY_PROVIDER;
let username = process.env.TENDERLY_USERNAME;
let project = process.env.TENDERLY_PROJECT;

async function main() {
  try {
    const LeelaGame = await hre.ethers.getContractFactory('LeelaGame');

    const leelaGame = await LeelaGame.deploy();
    // console.log('leelaGame', leelaGame);
    console.log(`LeelaGame deployed to ${leelaGame.target}`);

    // Получите метаданные о контракте
    const contractArtifact = await hre.artifacts.readArtifact('LeelaGame');

    // Сохраните метаданные в JSON файл
    fs.writeFileSync(
      'LeelaGame.json',
      JSON.stringify(contractArtifact, null, 2),
    );

    let data = { address: leelaGame.target };

    if (!fs.existsSync('./verify')) {
      fs.mkdirSync('./verify');
    }

    fs.writeFile('./verify/address.json', JSON.stringify(data), (err) => {
      if (err) console.log(err);
    });

    // Получите байткод и ABI
    const bytecode = LeelaGame.bytecode;
    const abi = LeelaGame.interface.fragments;

    // console.log('bytecode', bytecode);
    // console.log('abi', abi);

    fs.writeFileSync(
      './verify/bytecode.json',
      JSON.stringify(bytecode, null, 2),
    );
    fs.writeFileSync('./verify/contractAbi.json', JSON.stringify(abi, null, 2));

    console.log('Bytecode and ABI saved.');

    //npx hardhat verify --network mumbai <address>
  } catch (error) {
    console.log('error', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
