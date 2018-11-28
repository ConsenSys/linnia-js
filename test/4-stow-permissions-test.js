import { assert } from 'chai';
import Web3 from 'web3';
import IPFS from 'ipfs-mini';
import StowDeploy from './deployForTests';
import util from '../src/util';

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
const privKey = '1a4heNawwunPDq5hawwhpKiw31vlqiOW3I/cIi6Klhk=';
const pubKey = 'HQmiMPrZAcfg3gQYNaFoEJVZbKCNA3NCazHAiXE+Yjg=';
const pubKey2 = 'otzC7S1EXxhHdFb/qlPjdK7TPfjsZPB7BxU3WTi0tQc=';
const testDataHash = '0x276bc9ec8730ad53e827c0467c00473a53337e2cb4b61ada24760a217fb1ef14';
const testDataUri = 'QmbcfaK3bdpFTATifqXXLux4qx6CmgBUcd3fVMWxVszazP';
const testMetaData = 'Blood_Pressure';
const testSharedUri = '0xde1f76340a34698d41d362010bbc3c05c26f25d659904ef08ef7bd5eac0dbea4';
let IPFSDataUri;
let newTestDataHash;

describe('Stow-permissions', async () => {
  const [admin, user1, user2, user3, provider] = await web3.eth.getAccounts();
  let stow;
  let contracts;
  beforeEach('deploy the contracts and set up roles', async () => {
    stow = await StowDeploy.deploy(web3, {
      from: admin,
      gas: 4000000,
    });
    contracts = await stow.getContractInstances();
    await contracts.users.register({ from: user1 });
    await contracts.users.register({ from: user2 });
    await contracts.users.register({ from: provider });
    await contracts.users.setProvenance(provider, 1, { from: admin });
    // provider appends a file for user1
    await contracts.records.addRecordByProvider(
      testDataHash,
      user1,
      testMetaData,
      testDataUri,
      {
        from: provider,
        gas: 500000,
      },
    );
    // user1 shares the file with user2
    await contracts.permissions.grantAccess(
      testDataHash,
      user2,
      testSharedUri,
      {
        from: user1,
        gas: 500000,
      },
    );
  });
  describe('view permission', () => {
    it('should return the permission info if viewer has access', async () => {
      const perm = await stow.getPermission(testDataHash, user2);
      assert.isTrue(perm.canAccess);
      assert.equal(perm.dataUri, testSharedUri);
    });
    it(
      'should not return the permission info if viewer does not have access',
      async () => {
        const perm = await stow.getPermission(testDataHash, user3);
        assert.isFalse(perm.canAccess);
        assert.isEmpty(perm.dataUri);
      },
    );
  });
  describe('grant permission', () => {
    beforeEach('setup ipfs record', async function () {
      // add timeout ecause ipfs takes time
      this.timeout(15000);
      // provider appends a file for user1
      newTestDataHash = '0xebf0a304f0e5a6445a7fd5850d00fd851837e8694184072e0f1b79037e447485';
      const encrypted = await util.encrypt(pubKey, { hello: 'world' });
      IPFSDataUri = await new Promise((resolve, reject) => {
        ipfs.add(JSON.stringify(encrypted), (err, ipfsRed) => {
          err ? reject(err) : resolve(ipfsRed);
        });
      });
      await contracts.records.addRecordByProvider(
        newTestDataHash,
        user1,
        testMetaData,
        IPFSDataUri,
        {
          from: provider,
          gas: 500000,
        },
      );
    });
    it('should grant permission', async function () {
      // add timeout ecause ipfs takes time
      this.timeout(15000);
      const ethParams = { from: user1, gas: 500000, gasPrice: 20000000000 };
      const access = await stow.grantPermission(newTestDataHash, user2, pubKey2, privKey, ethParams);
      assert.isTrue(access.canAccess);
      const perm = await stow.getPermission(newTestDataHash, user2);
      assert.isTrue(perm.canAccess);
      assert.equal(perm.dataUri, access.IPFSDataUri);
    });
  });
});
