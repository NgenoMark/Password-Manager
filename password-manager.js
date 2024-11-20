"use strict";

export function stringToBuffer(str) {
    return new TextEncoder().encode(str);
}

export function bufferToString(buf) {
    return new TextDecoder().decode(buf);
}

export function encodeBuffer(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function decodeBuffer(base64) {
    return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

export function getRandomBytes(len) {
    return crypto.getRandomValues(new Uint8Array(len));
}

// Keychain class
export class Keychain {
    constructor(masterKey, kvs = {}, salt) {
        this.data = { kvs };
        this.secrets = { masterKey, salt };
    }

    static async init(password) {
        const salt = getRandomBytes(16);
        const masterKey = await deriveKey(password, salt);
        return new Keychain(masterKey, {}, salt);
    }

    static async load(password, repr, trustedDataCheck) {
        const parsed = JSON.parse(repr);
        const { kvs, salt } = parsed;
        const masterKey = await deriveKey(password, decodeBuffer(salt));

        if (trustedDataCheck) {
            const calculatedChecksum = await sha256(JSON.stringify(parsed));
            if (calculatedChecksum !== trustedDataCheck) {
                throw new Error("Integrity check failed.");
            }
        }

        return new Keychain(masterKey, kvs, decodeBuffer(salt));
    }

    async dump() {
        const jsonData = JSON.stringify({
            kvs: this.data.kvs,
            salt: encodeBuffer(this.secrets.salt)
        });
        const checksum = await sha256(jsonData);
        return [jsonData, checksum];
    }

    async get(name) {
        const hashedName = await sha256(name);
        if (!this.data.kvs[hashedName]) return null;

        const { iv, value } = this.data.kvs[hashedName];
        const decryptedValue = await decryptAES(this.secrets.masterKey, decodeBuffer(value), decodeBuffer(iv));
        return bufferToString(decryptedValue).split(':')[1];
    }

    async set(name, value) {
        const iv = getRandomBytes(12);
        const encryptedValue = await encryptAES(this.secrets.masterKey, stringToBuffer(`${name}:${value}`), iv);
        const hashedName = await sha256(name);

        this.data.kvs[hashedName] = {
            value: encodeBuffer(encryptedValue),
            iv: encodeBuffer(iv),
        };
    }

    async remove(name) {
        const hashedName = await sha256(name);
        if (this.data.kvs[hashedName]) {
            delete this.data.kvs[hashedName];
            return true;
        }
        return false;
    }
}

// Helper functions
async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey("raw", stringToBuffer(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptAES(key, data, iv) {
    return crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
}

async function decryptAES(key, data, iv) {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
}

async function sha256(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", stringToBuffer(data));
    return encodeBuffer(hashBuffer);
}
