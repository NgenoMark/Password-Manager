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
  
    const masterKey = await deriveKey(password, decodeBuffer(salt));
  
    // Optional: Try decrypting a test value to ensure the password is correct
    try {
      // Attempt to decrypt an existing value to verify the password
      const testKey = Object.keys(kvs)[0];
      if (testKey) {
        const { value, iv } = kvs[testKey];
        await decryptAES(masterKey, decodeBuffer(value), decodeBuffer(iv));
      }
    } catch {
      throw new Error("Incorrect password."); // Throw an error for incorrect password
    }
  
    // Compute checksum and verify integrity if trustedDataCheck is provided
    const calculatedChecksum = await sha256(JSON.stringify(parsed));
    if (trustedDataCheck && calculatedChecksum !== trustedDataCheck) {
      throw new Error("Integrity check failed.");
    }
  
    return new Keychain(masterKey, kvs, decodeBuffer(salt));
  }
  
  
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
    });
    const checksum = await sha256(jsonData);
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
    const hashedName = await sha256(name); // Generate hashed key
    if (!this.data.kvs[hashedName]) return null;
  
    const { iv, value } = this.data.kvs[hashedName];
    const decryptedValue = await decryptAES(this.secrets.masterKey, decodeBuffer(value), decodeBuffer(iv));
    const [decryptedName, decryptedPassword] = bufferToString(decryptedValue).split(':');
  
    if (decryptedName !== name) {
      throw new Error("Decrypted domain name does not match."); // Extra security check
    }
  
    return decryptedPassword;
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
    const combinedValue = `${name}:${value}`; // Combine domain and password
    const encryptedValue = await encryptAES(this.secrets.masterKey, stringToBuffer(combinedValue), iv);
  
    // Generate a hashed version of the domain name as a key
    const hashedName = await sha256(name);
  
    // Store encrypted value and IV under the hashed key
    this.data.kvs[hashedName] = {
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
    const hashedName = await sha256(name); // Generate hashed key
    if (this.data.kvs[hashedName]) {
      delete this.data.kvs[hashedName]; // Remove the entry
      return true;
    }
    return false;
  }
  
};

/********* Helper Functions ********/

// Derives an AES-GCM key from the provided password
async function deriveKey(password, salt) {
  const keyMaterial = await subtle.importKey("raw", stringToBuffer(password), "PBKDF2", false, ["deriveKey"]);
  return await subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypts data using AES-GCM with the given key and IV
async function encryptAES(key, data, iv) {
  return await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
}

// Decrypts data using AES-GCM with the given key and IV
async function decryptAES(key, encryptedData, iv) {
  return await subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);
}

// Computes SHA-256 hash of the input data
async function sha256(data) {
  const hashBuffer = await subtle.digest("SHA-256", stringToBuffer(data));
  return bufferToString(hashBuffer);
}

module.exports = { Keychain }