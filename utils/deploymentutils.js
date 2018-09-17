const fs = require('fs');
const path = require('path');
const HDWalletProvider = require('truffle-hdwallet-provider-privkey'); // eslint-disable-line import/no-extraneous-dependencies
const NonceTrackerSubprovider = require('web3-provider-engine/subproviders/nonce-tracker');

const getConfig = function getConfig() {
  try {
    const configFile = path.resolve(__dirname, '../deploy.json');
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (err) {
    console.error('\n--> Missing deploy.json. ' + // eslint-disable-line no-console
        'Please take a look at the README.md file before continuing.\n\n');
    throw err;
  }
};

const getEnvironmentConfig = function getEnvironmentConfig(environment) {
  const config = getConfig();
  return config.environments[environment] || {};
};
exports.getEnvironmentConfig = getEnvironmentConfig;

// --- ( Truffle Deployment ) ---
exports.getProvider = function getProvider(network, environment) {
  const config = getConfig();
  const envConfig = getEnvironmentConfig(environment);
  const infura = `https://${network}.infura.io/v3/${config.infuraToken}`;
  const privKeys = [envConfig.deployPrivateKey];
  const wallet = new HDWalletProvider(privKeys, infura);

  const nonceTracker = new NonceTrackerSubprovider();
  wallet.engine._providers.unshift(nonceTracker); // eslint-disable-line no-underscore-dangle
  nonceTracker.setEngine(wallet.engine);
  return wallet;
};

exports.isLocal = function isLocal(environment) {
  return environment === 'development' || environment === 'test' || environment === 'coverage';
};

exports.getEnvironmentAccounts = function getEnvironmentAccounts(environment) {
  const config = getEnvironmentConfig(environment);
  return config.accounts;
};

exports.getLocalAccounts = function getLocalAccounts(accounts) {
  return {
    owner: accounts[0],
    notary1: accounts[1],
    notary2: accounts[2],
    notary3: accounts[3],
    buyer: accounts[4],
    seller: accounts[5],
    multisig: accounts[6],
  };
};

exports.getWIBTokenAddress = function getWIBTokenAddress(environment) {
  const config = getEnvironmentConfig(environment);
  return config.wibTokenAddress;
};
