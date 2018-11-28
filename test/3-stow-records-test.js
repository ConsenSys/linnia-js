import { assert } from 'chai';
import Web3 from 'web3';
import StowDeploy from './deployForTests';

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
const testDataHash = '0x276bc9ec8730ad53e827c0467c00473a53337e2cb4b61ada24760a217fb1ef14';
const testDataUri = 'QmbcfaK3bdpFTATifqXXLux4qx6CmgBUcd3fVMWxVszazP';
const testMetaData = 'Blood_Pressure';

// Add record should work
const dataHash = '0xcc85fc3d763b9a1d83e4386b37b4b0f3daf9881638ba8b7db0c501c417acb689';
const metadata = { encryption: 'ecies', type: 'medical data' };
const dataUri = 'QmSg3jCiroFERczWdpFJUau5CofHfMKCSm5vZXSzn7sZGW';

// Add record should fail
const dataHash2 = '0xcc85fc3d763b9a1d83e4386b37b4b0f3daf9881638ba8b7db0c501c417acb688';
const dataUri2 = 'QmSg3jCiroFERczWdpFJUau5CofHfMKCSm5vZXSzn5sZGW';

describe('Stow-records', async () => {
  const [admin, user, provider, provider2] = await web3.eth.getAccounts();
  let stow;
  let contracts;
  let recordAddTime;
  beforeEach('deploy the contracts and set up roles', async () => {
    stow = await StowDeploy.deploy(web3, {
      from: admin,
      gas: 4000000,
    });
    contracts = await stow.getContractInstances();
    // add a user and 2 providers
    await contracts.users.register({ from: user });
    await contracts.users.register({ from: provider });
    await contracts.users.register({ from: provider2 });
    await contracts.users.setProvenance(provider, 1, { from: admin });
    await contracts.users.setProvenance(provider2, 1, { from: admin });
    // append a file
    const tx = await contracts.records.addRecordByProvider(
      testDataHash,
      user,
      testMetaData,
      testDataUri,
      {
        from: provider,
        gas: 500000,
      },
    );
    const { blockNumber } = tx.receipt;
    const block = await web3.eth.getBlock(blockNumber);
    recordAddTime = block.timestamp;
  });
  describe('get record', () => {
    it('should return the formatted data record', async () => {
      const record = await stow.getRecord(testDataHash);
      assert.equal(record.owner.toLowerCase(), user.toLowerCase());
      assert.equal(record.metadataHash, web3.utils.sha3(testMetaData));
      assert.equal(record.sigCount, 1);
      assert.equal(record.irisScore, 1);
      assert.equal(record.dataUri, testDataUri);
      assert.typeOf(record.timestamp, 'Date');
      assert.equal(record.timestamp.getTime() / 1000, recordAddTime);
    });
  });
  describe('add record with reward', () => {
    it('should add the record', async () => {
      const ethParams = { from: user, gas: 500000, gasPrice: 20000000000 };
      const record = await stow.addRecordWithReward(dataHash, metadata, dataUri, ethParams);
      assert.equal(record.owner.toLowerCase(), user.toLowerCase());
      assert.equal(record.metadataHash, web3.utils.sha3(JSON.stringify(metadata)));
      assert.equal(record.dataUri, dataUri);
    });
    it('should fail adding record, without a from user', async () => {
      const ethParams = { gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.addRecordWithReward(dataHash, metadata, dataUri, ethParams);
      } catch (e) {
        assert.equal(e.message, 'ethParams object does not contain a "from" key');
      }
    });
    it('should fail adding record, with a user that is not registered in Stow', async () => {
      const ethParams = { from: '0xb717d7adf0d17f5f48bb7ff0035e30fcd19eed72', gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.addRecordWithReward(dataHash, metadata, dataUri, ethParams);
      } catch (e) {
        assert.equal(e.message, 'the address is not registered in Stow');
      }
    });
    it('should fail adding record with metadata not JSON', async () => {
      const ethParams = { from: user, gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.addRecordWithReward(dataHash2, 'Sting Metadata', dataUri2, ethParams);
      } catch (e) {
        assert.equal(e.message, 'Metadata has to be a JSON object');
      }
    });
  });
  describe('add record', () => {
    it('should add the record, with web3 instance with keys', async () => {
      const ethParams = { from: user, gas: 500000, gasPrice: 20000000000 };
      const record = await stow.addRecord(dataHash, metadata, dataUri, ethParams);
      assert.equal(record.owner.toLowerCase(), user.toLowerCase());
      assert.equal(record.metadataHash, web3.utils.sha3(JSON.stringify(metadata)));
      assert.equal(record.dataUri, dataUri);
    });
    it('should fail adding record, without a from user', async () => {
      const ethParams = { gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.addRecord(dataHash, metadata, dataUri, ethParams);
      } catch (e) {
        assert.equal(e.message, 'ethParams object does not contain a "from" key');
      }
    });
    it('should fail adding record, with a user that is not registered in Stow', async () => {
      const ethParams = { from: '0xb717d7adf0d17f5f48bb7ff0035e30fcd19eed72', gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.addRecord(dataHash, metadata, dataUri, ethParams);
      } catch (e) {
        assert.equal(e.message, 'the address is not registered in Stow');
      }
    });
    it('should fail adding record with metadata not JSON', async () => {
      const ethParams = { from: user, gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.addRecord(dataHash2, 'Sting Metadata', dataUri2, ethParams);
      } catch (e) {
        assert.equal(e.message, 'Metadata has to be a JSON object');
      }
    });
  });
  describe('get attestation', () => {
    it('should return true if attested by specified user', async () => {
      const att = await stow.getAttestation(testDataHash, provider);
      assert.isTrue(att);
    });
    it('should return false if not attested by specified user', async () => {
      const att = await stow.getAttestation(testDataHash, user);
      assert.isFalse(att);
    });
  });
  describe('sign record', () => {
    it('should sign the record', async () => {
      const ethParams = { from: provider2, gas: 500000, gasPrice: 20000000000 };
      const att = await stow.signRecord(testDataHash, ethParams);
      assert.equal(att.attester, provider2);
      assert.equal(att.dataHash, testDataHash);
    });
    it('should fail when sign without a from user', async () => {
      const ethParams = { gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.signRecord(testDataHash, ethParams);
      } catch (e) {
        assert.equal(e.message, 'ethParams object does not contain a "from" key');
      }
    });
    it('should fail when sign with a user that is not registered in Stow', async () => {
      const ethParams = { from: '0xb717d7adf0d17f5f48bb7ff0035e30fcd19eed72', gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.signRecord(testDataHash, ethParams);
      } catch (e) {
        assert.equal(e.message, 'the address is not registered in Stow');
      }
    });
    it('should fail when sign with a user with no provenance', async () => {
      const ethParams = { from: user, gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.signRecord(testDataHash, ethParams);
      } catch (e) {
        assert.equal(e.message, 'The attestor does not have provenance (Invalid Attester)');
      }
    });
    it('should fail when sign a record that does not exists', async () => {
      const ethParams = { from: provider, gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.signRecord('Invalid Datahash', ethParams);
      } catch (e) {
        assert.equal(e.message, 'The record does not exists');
      }
    });
    it('should fail when sign with an attester that already sign that record', async () => {
      const ethParams = { from: provider2, gas: 500000, gasPrice: 20000000000 };
      try {
        await stow.signRecord(testDataHash, ethParams);
      } catch (e) {
        assert.equal(e.message, 'The attestor have already signed this record');
      }
    });
  });
});
