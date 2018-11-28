import TruffleContract from 'truffle-contract';
import IPFS from 'ipfs-mini';

import StowAddresses from '@stowprotocol/stow-addresses';
import StowContractUpgradeHub from '@stowprotocol/stow-smart-contracts/build/contracts/StowHub.json';
import StowUsers from '@stowprotocol/stow-smart-contracts/build/contracts/StowUsers.json';
import StowRecords from '@stowprotocol/stow-smart-contracts/build/contracts/StowRecords.json';
import StowPermissions from '@stowprotocol/stow-smart-contracts/build/contracts/StowPermissions.json';

import Record from './record';
import _recordsFunctions from './records';
import _permissionsFunctions from './permissions';
import _util from './util';

/**
 * Stow API object
 */
class Stow {
  /**
   * Create a new Stow API object
   * @param {Object} web3 An instantiated web3 API object
   * @param {?{?hubAddress: String},?{?tokenAddress: String}} opt Optional constructor options
   * @returns {Stow} Created Stow API object
   */
  constructor(web3, opt = {}) {
    this.web3 = web3;
    // truffle contracts
    const _hub = TruffleContract(StowContractUpgradeHub);
    const _users = TruffleContract(StowUsers);
    const _records = TruffleContract(StowRecords);
    const _permissions = TruffleContract(StowPermissions);
    _hub.setProvider(web3.currentProvider);
    _users.setProvider(web3.currentProvider);
    _records.setProvider(web3.currentProvider);
    _permissions.setProvider(web3.currentProvider);
    this._hub = _util.truffleHack(_hub);
    this._users = _util.truffleHack(_users);
    this._records = _util.truffleHack(_records);
    this._permissions = _util.truffleHack(_permissions);

    if (opt) {
      this._hubAddress = opt.hubAddress || undefined;
      this._tokenAddress = opt.tokenAddress || undefined;
    }

    this.network = new Promise((resolve) => {
      this.web3.eth.net.getId().then((netId) => {
        let network;
        switch (netId) {
          case 3:
            network = 'ropsten';
            break;
          case 4:
            network = 'rinkeby';
            break;
          default:
            network = 'unknown';
        }

        if (StowAddresses[network]) {
          if (!this._hubAddress) this._hubAddress = StowAddresses[network].StowSmartContracts.latest;
          if (!this._tokenAddress) this._tokenAddress = StowAddresses[network].StowToken.latest;
        }

        if (!this._hubAddress) {
          throw new Error('Must specify Stow Hub address when using an unsupported network.');
        }

        resolve(network);
      });
    });
  }

  /**
   * Get Stow contract instances, wrapped in truffle contract
   * @returns {Promise<{hub: Object, users: Object, records: Object, permissions: Object}>}
   */
  async getContractInstances() {
    await this.network;
    const hubInstance = await this._getHubInstance();
    const usersAddress = await hubInstance.usersContract();
    const recordsAddress = await hubInstance.recordsContract();
    const permissionsAddress = await hubInstance.permissionsContract();
    return {
      _hub: hubInstance,
      users: await this._users.at(usersAddress),
      records: await this._records.at(recordsAddress),
      permissions: await this._permissions.at(permissionsAddress),
    };
  }

  /**
   * Get a record from Stow by data hash
   * @param {String} dataHash hex-encoded data hash, 0x prefixed
   * @returns {Promise<Record>}
   */
  async getRecord(dataHash) {
    const { records, permissions } = await this.getContractInstances();
    return Record.fromContract(records, permissions, dataHash);
  }

  /**
   * Add a record from Stow by data hash
   * @param {String} dataHash hash of the plain text data + metadata
   * @param {Object} metadata public information about the data
   * @param {String} dataUri link to the data (eg. the IPFS hash)
   * @param {Object} ethParams ethereum account params
   * @returns {Promise<Record>}
   */
  async addRecord(dataHash, metadata, dataUri, ethParams) {
    const { records, users } = await this.getContractInstances();
    return _recordsFunctions.addRecord(
      records,
      users,
      dataHash,
      metadata,
      dataUri,
      ethParams,
    );
  }

  /**
   * Add a record from Stow by data hash
   * @param {String} dataHash hash of the plain text data + metadata
   * @param {Object} metadata public information about the data
   * @param {String} dataUri link to the data (eg. the IPFS hash)
   * @param {Object} ethParams ethereum account params
   * @returns {Promise<Record>}
   */
  async addRecordWithReward(dataHash, metadata, dataUri, ethParams) {
    const { records, users } = await this.getContractInstances();
    return _recordsFunctions.addRecordWithReward(
      records,
      users,
      dataHash,
      metadata,
      dataUri,
      this._tokenAddress,
      ethParams,
    );
  }

  /**
    * Get record attestation from Stow
    * @param {String} dataHash hex-encoded data hash, 0x prefixed
    * @returns {Promise<Boolean>} True if attested by specified user
   */
  async getAttestation(dataHash, attesterAddress) {
    const { records } = await this.getContractInstances();
    return _recordsFunctions.getAttestation(records, dataHash, attesterAddress);
  }

  /**
   * Sign a record (add attestation)
   * @param {String} dataHash hex-encoded data hash, 0x prefixed
   * @param {Object} ethParams ethereum account params
   * @returns {Promise<Attestation>}
   */
  async signRecord(dataHash, ethParams) {
    const { records, users } = await this.getContractInstances();
    return _recordsFunctions.signRecord(records, users, dataHash, ethParams);
  }

  /**
   * Get permission information of a record
   * @param {String} dataHash hex-encoded data hash, 0x prefixed
   * @param {String} viewerAddress hex-encoded ethereum address
   * @returns {Promise<{canAccess: Boolean, dataUri: String}>}
   */
  async getPermission(dataHash, viewerAddress) {
    const { permissions } = await this.getContractInstances();
    return _permissionsFunctions.getPermission(permissions, dataHash, viewerAddress);
  }

  /**
   * grant permission to a record
   * @param {String} dataHash hex-encoded data hash, 0x prefixed
   * @param {String} viewerAddress hex-encoded ethereum address
   * @param {String} viewerEncyptionPublicKey public key to encrypt file
   * @param {String} ownerEncryptionPrivateKey private key to decrypt file
   * @returns {Promise<{canAccess: Boolean, dataUri: String}>}
   */
  async grantPermission(dataHash, viewerAddress, viewerEncyptionPublicKey, ownerEncryptionPrivateKey, ethParams) {
    const { records, permissions } = await this.getContractInstances();
    const ipfs = new IPFS({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
    });
    return _permissionsFunctions.grantPermission(records, permissions, ipfs, dataHash, viewerAddress, viewerEncyptionPublicKey, ownerEncryptionPrivateKey, ethParams);
  }


  /**
   * Internal DO NOT USE
   * @returns {Promise<*>}
   * @private
   */
  async _getHubInstance() {
    // get hub contract instance
    // look up address either from user defined address or artifact
    if (this._hubAddress) {
      return this._hub.at(this._hubAddress);
    }
    return this._hub.deployed();
  }
}

Stow.util = _util;

export default Stow;
