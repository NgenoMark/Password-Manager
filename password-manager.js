"use strict";

/********* External Imports ********/

const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;

/********* Constants ********/

const PBKDF2_ITERATIONS = 100000; // number of iterations for PBKDF2 algorithm
const MAX_PASSWORD_LENGTH = 64;   // we can assume no password is longer than this many characters

/********* Implementation ********/
class Keychain {
  /**
   * Initializes the keychain using the provided information. Note that external
   * users should likely never invoke the constructor directly and instead use
   * either Keychain.init or Keychain.load. 
   * Arguments:
   *  You may design the constructor with any parameters you would like. 
   * Return Type: void
   */
  constructor(masterKey, kvs = {}, salt) {
    this.data = { kvs }; // key-value store that’s public
    this.secrets = { masterKey, salt }; // master key and salt kept secret
  }

  /** 
    * Creates an empty keychain with the given password.
    *
    * Arguments:
    *   password: string
    * Return Type: void
    */
  static async init(password) {
    const salt = getRandomBytes(16); // generate a new salt
    const masterKey = await deriveKey(password, salt); // derive master key from password
    return new Keychain(masterKey, {}, salt); // initialize with empty KVS
  }

  /**
    * Loads the keychain state from the provided representation (repr). The
    * repr variable will contain a JSON encoded serialization of the contents
    * of the KVS (as returned by the dump function). The trustedDataCheck
    * is an *optional* SHA-256 checksum that can be used to validate the 
    * integrity of the contents of the KVS. If the checksum is provided and the
    * integrity check fails, an exception should be thrown. You can assume that
    * the representation passed to load is well-formed (i.e., it will be
    * a valid JSON object).Returns a Keychain object that contains the data
    * from repr. 
    *
    * Arguments:
    *   password:           string
    *   repr:               string
    *   trustedDataCheck: string
    * Return Type: Keychain
    */
  static async load(password, repr, trustedDataCheck) {
    const parsed = JSON.parse(repr);
    const { kvs, salt } = parsed;
    const masterKey = await deriveKey(password, decodeBuffer(salt)); // derive master key from password and stored salt

    // Compute checksum and verify integrity if trustedDataCheck is provided
    const calculatedChecksum = await sha256(JSON.stringify(parsed));
    if (trustedDataCheck && calculatedChecksum !== trustedDataCheck) {
      throw new Error("Integrity check failed.");
    }

    return new Keychain(masterKey, kvs, decodeBuffer(salt));
  };
  /**
    * Returns a JSON serialization of the contents of the keychain that can be 
    * loaded back using the load function. The return value should consist of
    * an array of two strings:
    *   arr[0] = JSON encoding of password manager
    *   arr[1] = SHA-256 checksum (as a string)
    * As discussed in the handout, the first element of the array should contain
    * all of the data in the password manager. The second element is a SHA-256
    * checksum computed over the password manager to preserve integrity.
    *
    * Return Type: array
    */ 
  async dump() {
    const jsonData = JSON.stringify({
      kvs: this.data.kvs,
      salt: encodeBuffer(this.secrets.salt)
    }); // serialize KVS and salt
    const checksum = await sha256(jsonData); // calculate SHA-256 checksum
    return [jsonData, checksum];
  }
  


  /**
    * Fetches the data (as a string) corresponding to the given domain from the KVS.
    * If there is no entry in the KVS that matches the given domain, then return
    * null.
    *
    * Arguments:
    *   name: string
    * Return Type: Promise<string>
    */
  async get(name) {
    if (!this.data.kvs[name]) return null;

    const { iv, value } = this.data.kvs[name];
    const decryptedValue = await decryptAES(this.secrets.masterKey, decodeBuffer(value), decodeBuffer(iv));
    return bufferToString(decryptedValue);
  }
  

  /** 
  * Inserts the domain and associated data into the KVS. If the domain is
  * already in the password manager, this method should update its value. If
  * not, create a new entry in the password manager.
  *
  * Arguments:
  *   name: string
  *   value: string
  * Return Type: void
  */
  
  /* Set name */
  async set(name, value) {
    const iv = getRandomBytes(12); // AES-GCM IV
    const encryptedValue = await encryptAES(this.secrets.masterKey, stringToBuffer(value), iv);

    // Store encrypted value and IV as buffers
    this.data.kvs[name] = {
      value: encodeBuffer(encryptedValue),
      iv: encodeBuffer(iv),
    };
  }
  

  /**
    * Removes the record with name from the password manager. Returns true
    * if the record with the specified name is removed, false otherwise.
    *
    * Arguments:
    *   name: string
    * Return Type: Promise<boolean>
  */

  /* Remove name */
  async remove(name) {
    if (this.data.kvs[name]) {
      delete this.data.kvs[name];
      return true;
    }
    return false;
  }

};

module.exports = { Keychain }


