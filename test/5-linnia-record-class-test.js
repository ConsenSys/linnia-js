import { assert } from 'chai';
import crypto from 'crypto';
import eutil from 'ethereumjs-util';
import Web3 from 'web3';
import Linnia from '../src';

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
const testData = 'foobar';
const testDataHash = '0x38d18acb67d25c8bb9942764b62f18e17054f66a817bd4295423adf9ed98873e';
const testDataUri = 'QmYvPnLBAwfsWoj8NqGCt8ZoNDrz4mgVZT5zxNKNRHA9XK';
const testMetaData = 'Blood_Pressure';
const testSharedUri = 'QmbcfaK3bdpFTATifqXXLux4qx6CmgBUcd3fVMWxVszazP';
const privKey = '0x5230a384e9d271d59a05a9d9f94b79cd98fcdcee488d1047c59057046e128d2b';
const pubKey = eutil.bufferToHex(eutil.privateToPublic(privKey));

describe('Record class', async () => {
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
    // append a signed file
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
    // share the file with user2
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
  describe('get attestation', () => {
    it('should return true if attested by specified user', async () => {
      const record = await linnia.getRecord(testDataHash);
      const at = await record.getAttestation(provider);
      assert.isTrue(at);
    });
    it('should return false if not attested by specified user', async () => {
      const record = await linnia.getRecord(testDataHash);
      const at = await record.getAttestation(user2);
      assert.isFalse(at);
    });
  });
  describe('get permission', () => {
    it('should return true if viewer has permission', async () => {
      const record = await linnia.getRecord(testDataHash);
      const perm = await record.getPermission(user2);
      assert.isTrue(perm.canAccess);
      assert.equal(perm.dataUri, testSharedUri);
    });
    it('should return false if viewer does not have permission', async () => {
      const record = await linnia.getRecord(testDataHash);
      const perm = await record.getPermission(user3);
      assert.isFalse(perm.canAccess);
      assert.isEmpty(perm.dataUri);
    });
  });
  describe('decrypt', () => {
    it('should decrypt the data if hash is correct', async () => {
      // make the URI resolver always return the encrypted data
      const uriResolver = dataUri => {
        // check that the URI being passed in is correct
        assert.equal(dataUri, testDataUri);
        return Linnia.util.encrypt(pubKey, testData);
      };
      const record = await linnia.getRecord(testDataHash);
      const plain = await record.decryptData(privKey, uriResolver);
      assert.equal(plain.toString(), testData);
    });
    it('should throw if hash does not match', async () => {
      // make the URI resolver return a decryptable but wrong data
      const uriResolver = () => Linnia.util.encrypt(pubKey, 'fox');
      const record = await linnia.getRecord(testDataHash);
      try {
        await record.decryptData(privKey, uriResolver);
        assert.fail('expected hash mismatch error not received');
      } catch (error) {
        assert.equal(error.message, 'plaintext data hash mismatch');
      }
    });
  });
  describe('decrypt permissioned', () => {
    it(
      'should decrypt the data if has permission and hash is correct',
      async () => {
        const uriResolver = dataUri => {
          // the URI being passed in should be the shared copy
          assert.equal(dataUri, testSharedUri);
          return Linnia.util.encrypt(pubKey, testData);
        };
        const record = await linnia.getRecord(testDataHash);
        const plain = await record.decryptPermissioned(
          user2,
          privKey,
          uriResolver,
        );
        assert.equal(plain.toString(), testData);
      },
    );
    it('should throw if viewer has no permission', async () => {
      const uriResolver = () => Linnia.util.encrypt(pubKey, testData);
      const record = await linnia.getRecord(testDataHash);
      try {
        await record.decryptPermissioned(user3, privKey, uriResolver);
        assert.fail('expected permission error not received');
      } catch (error) {
        assert.equal(
          error.message,
          'viewer has no permission to view the data',
        );
      }
    });
    it('should throw if hash does not match', async () => {
      // make the URI resolver return a decryptable but wrong data
      const uriResolver = () => Linnia.util.encrypt(pubKey, 'fox');
      const record = await linnia.getRecord(testDataHash);
      try {
        await record.decryptPermissioned(user2, privKey, uriResolver);
        assert.fail('expected hash mismatch error not received');
      } catch (error) {
        assert.equal(error.message, 'plaintext data hash mismatch');
      }
    });
  });
  describe('verify data', () => {
    it('should return true if data hash matches', async () => {
      const record = await linnia.getRecord(testDataHash);
      const verify = record.verifyData('foobar');
      assert.isTrue(verify);
    });
    it('should return true if data hash does not match', async () => {
      const record = await linnia.getRecord(testDataHash);
      const verify = record.verifyData('fox');
      assert.isFalse(verify);
    });
  });
  describe('reencrypt data', () => {
    it('should re-encrypt to the public key', async () => {
      const uriResolver = dataUri => {
        assert.equal(dataUri, testDataUri);
        return Linnia.util.encrypt(pubKey, testData);
      };
      // make a new keypair
      const priv = crypto.randomBytes(32);
      const pub = eutil.privateToPublic(priv);
      const record = await linnia.getRecord(testDataHash);
      const reencrypted = await record.reencryptData(pub, privKey, uriResolver);
      // the re-encrypted data should be decryptable by the new priv key
      assert.equal(Linnia.util.decrypt(priv, reencrypted).toString(), testData);
    });
  });
});
