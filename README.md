<img src="./stow-logo.png" width="300" height="300" />

## [![NPM Package](https://img.shields.io/npm/v/@stowprotocol/stow-js.svg?style=flat-square)](https://www.npmjs.com/package/@stowprotocol/stow-js) ![Build Status](https://circleci.com/gh/ConsenSys/stow-js.png?circle-token=:circle-token&style=shield)

# StowJS

## Quickstart

```javascript
const Web3 = require("web3");
const Stow = require("@stowprotocol/stow-js");

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

const stow = new Stow(web3);

// get the deployed contracts
const { _, users, records, permissions } = await stow.getContractInstances();
```

## Installation

You can install using npm:

```bash
npm i @stowprotocol/stow-js
```

or add inject the library onto the `window` using a script tag:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@stowprotocol/stow-js-script-tag@0.3.0/dist/index.min.js"></script>
```

## Building

```
npm run build
```

The compiled library is generated in `lib`, which you can require by typing `require('./lib')`

## Setting up a Dev Environment

New to ethereum and/or Stow? Head over to our [resources page](https://github.com/ConsenSys/stow-resources) to learn more about the protocol and how to set up your ethereum development environment.

## API Documentation

### Constructor

```javascript
new Stow(web3 [, options])
```

### Parameters

1. `Object` - An instantiated web3 API object
1. `Object` - (Optional) Constructor options

- `hubAddress`: `String` - Address of the StowHub. If not specified, library will use the address of the latest version of the contract deployed on the network.
- `tokenAddress`:`String` - Address of the StowToken.  If not specified, library will use the address of the latest version of the contract deployed on the network.
### Example

```javascript
const Web3 = require("web3");
const Stow = require("@stowprotocol/stow-js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
const stow = new Stow(web3);
```

## stow.getContractInstances

```javascript
stow.getContractInstances();
```

Gets Stow contract instances, wrapped in truffle contract.

### Returns

`Promise<Object>` - A promise when resolved returns an object with truffle Contract instances.

- `_hub`: `Object` - DO NOT USE - INTERNAL - StowHub truffle contract instance
- `users`: `Object` - StowUsers truffle contract instance
- `records`: `Object` - StowRecords truffle contract instance
- `permissions`: `Object` - StowPermissions truffle contract instance

### Example

```javascript
stow.getContractInstances().then(instances => {
  let users = instances.users;
  let records = instances.records;
  let permissions = instances.permissions;
});
```

## stow.getRecord

```javascript
stow.getRecord(dataHash);
```

Gets a record from Stow by data hash

### Parameters

1. `String` - The data hash, hex-encoded, 0x prefixed

### Returns

`Promise<Object>` - A promise when resolved returns an instance of Record class.

- `owner`: `String` - Hex-encoded record owner address
- `metadataHash`: `String` - Hex-encoded metadata hash
- `sigCount`: `Object` - A bignumber object, the signature count
- `irisScore`: `Object` - A bignumber object, the IRIS score
- `dataUri`: `String` - URI of the data
- `timestamp`: `Date` - The timestamp when the record is added to Stow

## stow.getAttestation

```javascript
stow.getAttestation(dataHash, attesterAddress);
```

Gets the attestation of the data

### Parameters

1. `String` - The data hash, hex-encoded, 0x prefixed
1. `String` - The address of the attester

### Returns

`Promise<Boolean>` - A promise when resolved returns true if the record is attested by the specified attester.

## stow.getPermission

```javascript
stow.getPermission(dataHash, viewerAddress);
```

Gets the permission information of a record

### Parameters

1. `String` - The data hash, hex-encoded, 0x prefixed
2. `String` - The address of the data viewer

### Returns

`Promise<Object>` - A promise when resolved returns a Stow Permission object.

- `canAccess`: `Boolean` - True if the specified viewer is allowed to access the record
- `dataUri`: `String` - The data URI of the shared record

---

## stow.grantPermission

```javascript
stow.grantPermission(dataHash, viewerAddress, viewerEncyptionPublicKey, ownerEncryptionPrivateKey, ethParams)
```

Grants the permission of a record to the viewer

### Parameters

1. `String` - The data hash, hex-encoded, 0x prefixed
2. `String` - The address of the data viewer
3. `String` - The public encryption key of the viewer to encrypt the data being stored
4. `String` - the private encryption key of the owner to decrypt the data being permissioned
5. `Object` - The ethParams, ethereum account params. (The object needs to contain the key 'from')

### Returns

`Promise<Object>` - A promise when resolved returns an oject with data of the transaction.

- `canAccess`: `Boolean` - True if the function has completed succesfully and viewer can now access revord
- `viewerEthereumAddress`: `String` - Viewer address
- `IPFSDataUri`: `String` - The new data URI of the shared record
- `dataHash`: `String` - The dataHash of the record

---

# Append data to Stow

In order to append data to Stow, your web3 instance need to be able to sign with the private key of the owner of the data.

## stow.addRecordWithReward

```javascript
stow.addRecordWithReward(dataHash, metadata, dataUri, ethParams);
```

Add record to Stow and receive a small reward of stow tokens.  This requires an optional parameter
to be set in the constructor as follows: 

`new Stow(web3, (tokenAddress: 0x4cdfbdec0aa003116bf030f249a8a7285cd6a184))`


### Parameters

1. `String` - The data hash. Hash of the plain text data + metadata
2. `Object` - The metadata of the record. [Click here to read more about the metadata](https://github.com/ConsenSys/stow-resources/blob/master/METADATA.md)
3. `String` - The dataUri, link to the data (eg. the IPFS hash)
4. `Object` - The ethParams, ethereum account params. (The object needs to contain the key 'from')

### Returns

`Promise<Record>` - A promise when resolved returns the record object that was stored.

## stow.addRecord

```javascript
stow.addRecord(dataHash, metadata, dataUri, ethParams);
```

Add record to Stow

### Parameters

1. `String` - The data hash. Hash of the plain text data + metadata
2. `Object` - The metadata of the record. [Click here to read more about the metadata](https://github.com/ConsenSys/stow-resources/blob/master/METADATA.md)
3. `String` - The dataUri, link to the data (eg. the IPFS hash)
4. `Object` - The ethParams, ethereum account params. (The object need to contain the key 'from')

### Returns

`Promise<Record>` - A promise when resolved returns the record object that was stored.

### Append data using Stow Js in the browser

 If you are using a Stow Js in the browser you can create the Stow instance with the web3 object from Metamask and append a record the following way:

### Example

```javascript
const Stow = require("@stowprotocol/stow-js");
const stow = new Stow(web3);

const dataHash = "0xcc85fc3d763b9a1d83e4386b37b4b0f3daf9881638ba8b7db0c501c417acb689";
const metadata = {
    dataFormat: "json",
    domain: "social media",
    storage: "IPFS",
    encryptionScheme: "x25519-xsalsa20-poly1305",
    encryptionPublicKey: "hQYhHJpzZH/tGhz1wtqSjkL17tJSnEEC4yVGyNTHNQY=",
    stowjsVersion: "0.1.4",
    providerName: "SocialMedia",
    providerEthereumAddress: "0x349e31e92027f86b0ffeb5cd5e07003c7f229872",
    keywords: [ "socialmedia", "friends list", "people" ],
    creationDate: new Date(Date.UTC(96, 1, 2, 3, 4, 5))
};
const dataUri = "QmSg3jCiroFERczWdpFJUau5CofHfMKCSm5vZXSzn7sZGW";
const ethParams = {
    from: "0xb717d7adf0d19f5f48bb7ff0030e30fcd19eed72", gas: 500000, gasPrice: 20000000000
};

const record = await stow.addRecord(dataHash, metadata, dataUri, ethParams);
```

In the example above the dataUri is the IPFS Hash where the file was stored.

### Append data using Stow Js outside of the browser

In order to add a file you need to generate a web3 instance that can handle the private keys of the owner of the file.

### Example

```javascript
const Stow = require("@stowprotocol/stow-js");
const HDWalletProvider = require('truffle-hdwallet-provider');

// HERE YOU NEED TO ADD THE PRIVATE KEYS OF THE OWNERS
const privKeys = [privkey1, privkey2, ...]
                  
// HERE YOU NEED TO ADD THE PROVIDER, YOU COULD GET AND INFURA KEY AND PUT IT BELOW 
// OR USE ANY ETH PROVIDER
const provider = 'https://ropsten.infura.io/INFURA_KEY'
const hdWalletProvider = new HDWalletProvider(privKeys, provider);
const web3 = new Web3(hdWalletProvider);

const stow = new Stow(web3);

const dataHash = "0xcc85fc3d763b9a1d83e4386b37b4b0f3daf9881638ba8b7db0c501c417acb689";
const metadata = {
    dataFormat: "json",
    domain: "social media",
    storage: "IPFS",
    encryptionScheme: "x25519-xsalsa20-poly1305",
    encryptionPublicKey: "hQYhHJpzZH/tGhz1wtqSjkL17tJSnEEC4yVGyNTHNQY=",
    stowjsVersion: "0.1.4",
    providerName: "SocialMedia",
    providerEthereumAddress: "0x349e31e92027f86b0ffeb5cd5e07003c7f229872",
    keywords: [ "socialmedia", "friends list", "people" ],
    creationDate: new Date(Date.UTC(96, 1, 2, 3, 4, 5))
};
const dataUri = "QmSg3jCiroFERczWdpFJUau5CofHfMKCSm5vZXSzn7sZGW";
const ethParams = {
    from: "0xb717d7adf0d19f5f48bb7ff0030e30fcd19eed72", gas: 500000, gasPrice: 20000000000
};

const record = await stow.addRecord(dataHash, metadata, dataUri, ethParams);
```

# Attest data on Stow

Attest data on Stow means sign a record and verify that contain legitimate and correct information.

## stow.signRecord

```javascript
stow.signRecord(dataHash, ethParams);
```

Attest a record to Stow

### Parameters

1. `String` - The data hash, hex-encoded, 0x prefixed
2. `Object` - The ethParams, ethereum account params. (The object need to contain the key 'from')

### Returns

`Promise<Attestation>` - A promise when resolved returns the Attestation that was added.

### Example

```javascript
const Stow = require("@stowprotocol/stow-js");
const stow = new Stow(web3);

const dataHash = "0xcc85fc3d763b9a1d83e4386b37b4b0f3daf9881638ba8b7db0c501c417acb689";
const ethParams = {
    from: "0xb717d7adf0d19f5f48bb7ff0030e30fcd19eed72", gas: 500000, gasPrice: 20000000000
};

const attestation = await stow.signRecord(dataHash, ethParams);
```

------



# Record class

An instance of Record class is returned when `stow.getRecord` is called and promise resolved.

## Members

- `owner`: `String` - Hex-encoded record owner address
- `metadataHash`: `String` - Hex-encoded metadata hash
- `sigCount`: `Object` - A bignumber object, the signature count
- `irisScore`: `Object` - A bignumber object, the IRIS score
- `dataUri`: `String` - URI of the data
- `timestamp`: `Date` - The timestamp when the record is added to Stow

## record.getAttestation

```javascript
record.getAttestation(attesterAddress);
```

Gets the attestation of the data

### Parameters

1. `String` - The address of the attester

### Returns

`Promise<Boolean>` - A promise when resolved returns true if the record is attested by the specified attester.

### Example

```javascript
let dataHash =
  "0x174e6ab7cf9a53497cff763d0743258f5d5014cb20ae08c7ec22bf50f5d5e326";
let attester = "0xac07bea81fe26b379de0e4327f1a6ecd0875edfc";
stow
  .getRecord(dataHash)
  .then(record => record.getAttestation(attester))
  .then(attested => {
    if (attested) {
      // ...
    } else {
      // ...
    }
  });
```

## record.getPermission

```javascript
record.getPermission(viewerAddress);
```

Gets the permission information of a record

### Parameters

1. `String` - The address of the data viewer

### Returns

`Promise<Object>` - A promise when resolved returns a Stow Permission object.

- `canAccess`: `Boolean` - True if the specified viewer is allowed to access the record
- `dataUri`: `String` - The data URI of the shared record

## record.decryptData

```javascript
record.decryptData(privKey, uriResolver);
```

Gets the plaintext data of the record

### Parameters

1. `String` - The private key to decrypt the data
1. `(String) => (String)` - A function to resolve the data URI. The parameter is the string data URI. The function should return the plaintext data.

### Returns

`String` - The plaintext data

### Example

```javascript
let privKey =
  "0x5230a384e9d271d59a05a9d9f94b79cd98fcdcee488d1047c59057046e128d2b";
stow
  .decryptData(privKey, dataUri => {
    // assume data URI is HTTP URL here
    return fetch(dataUri).then(res => {
      return res.arrayBuffer();
    });
  })
  .then(plainText => {
    console.log(plainText.toString());
  });
```

## record.decryptPermissioned

```javascript
record.decryptPermissioned(viewerAddress, privKey, uriResolver)
```

Gets the plaintext data of a permissioned copy of the record

### Parameters

1. `String` - The address of viewer
1. `String` - The private key to decrypt the data of the permissioned copy. Note that this is the key controlled by the viewer, not the record owner.
1. `(String) => (Promise<String>)` - A function to resolve the data URI. The parameter is the string data URI. The function should return the encrypted data..

### Returns

`String` - The plaintext data

## record.verifyData

```javascript
record.verifyData(plaintext);
```

Verifies the hash of the data against the one in Stow.

### Parameters

1. `String` - The plaintext data to be verified

### Returns

`Boolean` - True if hash matches

## record.reencryptData

```javascript
record.reencryptData(pubKey, privKey, uriResolver);
```

Re-encrypts the data to another public key

### Parameters

1. `String` - Public key to re-encrypt the data to
1. `String` - Private key to decrypt the record data. This should be a key controlled by the record owner
1. `(String) => (String)` - A function to resolve the data URI. The parameter is the string data URI. The function should return the encrypted data.

### Returns

`String` - The re-encrypted data

---

# Attestation class

## Members

- `attester`: `String` - Hex-encoded attester address
- `dataHash`: `String` - Hex-encoded data hash

------



# Utility functions

## Stow.util.encrypt

```javascript
Stow.util.encrypt(pubKeyTo, plaintext)
```

Encrypts a message.

### Parameters

1. `String` - The public key to encrypt the data
1. `String` - The plaintext data

### Returns

`String` - The encrypted data, which includes the IV, ephemeral public key, MAC, and ciphertext.

### Example

```javascript
let pubKey =
  "0xb1f26f98d374540eac3d31208f13a3935318e228207084c9ee32d741ff1ad2341af4ac9658aba4a254bf1dc6451b3c08524febba5273bec227c73e25cd376387";
let encrypted = Stow.util.encrypt(pubKey, "foo");
console.log(encrypted.toString("hex"));
```

## Stow.util.decrypt

```javascript
Stow.util.decrypt(privKey, ciphertext);
```

Decrypts a message encrypted by `Stow.util.encrypt`.

### Parameters

1. `String` - The private key to decrypt the data.
1. `String` - The encrypted data, which includes the IV, ephemeral public key, MAC, and ciphertext.

### Returns

`String` - The decrypted plaintext

### Example

```javascript
let encrypted =
  "0xbf18f1b6eb4b748b18cc3bd4a8d47f5f045766a445431dd918a43d6ca7871bdf7acd2214dce02a508a97f173f0697e781cf3cbf1b2d6fc0dcce940cdcef0aab443469773eb672b04117d4cb36336891aa98cd21f07d994b756f456f52db2b26a316fdbaaf87f52a638e0ad4d4280b63ec6447befdc97ecf07117bfc9eb8f8a073f";
let privKey =
  "0x5230a384e9d271d59a05a9d9f94b79cd98fcdcee488d1047c59057046e128d2b";
let plaintext = Stow.util.decrypt(privKey, encrypted).toString();
// plaintext is 'foo'
```
