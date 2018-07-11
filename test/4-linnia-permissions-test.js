import { assert } from 'chai';
import Web3 from 'web3';
import Linnia from '../src';

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
const testDataHash = '0x276bc9ec8730ad53e827c0467c00473a53337e2cb4b61ada24760a217fb1ef14';
const testDataUri = 'QmbcfaK3bdpFTATifqXXLux4qx6CmgBUcd3fVMWxVszazP';
const testMetaData = 'Blood_Pressure';
const testSharedUri = '0xde1f76340a34698d41d362010bbc3c05c26f25d659904ef08ef7bd5eac0dbea4';

describe('Linnia-permissions', async () => {
  const [admin, user1, user2, user3, provider] = await web3.eth.getAccounts();
  let linnia;
  let contracts;
  beforeEach('deploy the contracts and set up roles', async () => {
    linnia = await Linnia.deploy(web3, null, {
      from: admin,
      gas: 4000000,
    });
    contracts = await linnia.getContractInstances();
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
      const perm = await linnia.getPermission(testDataHash, user2);
      assert.isTrue(perm.canAccess);
      assert.equal(perm.dataUri, testSharedUri);
    });
    it(
      'should return the permission info if viewer does not have access',
      async () => {
        const perm = await linnia.getPermission(testDataHash, user3);
        assert.isFalse(perm.canAccess);
        assert.isEmpty(perm.dataUri);
      },
    );
  });
});
