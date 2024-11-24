import { Keychain, sha256 } from "./password-manager.js";

let keychain = null;
const userId = "user123"; // Replace with actual user ID

// Helper function to log messages
function log(message) {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML += `<p>${message}</p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

async function saveToServer(keychainData) {
    try {
        const response = await fetch('http://localhost:3000/saveKeychain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, keychainData })
        });
        if (!response.ok) {
            throw new Error('Failed to save keychain data to server');
        }
        log("Keychain data saved to server successfully.");
    } catch (error) {
        log(`Error: ${error.message}`);
    }
}

async function loadFromServer() {
    try {
        const response = await fetch('http://localhost:3000/loadKeychain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) {
            throw new Error('Failed to load keychain data from server');
        }
        const keychainData = await response.json();
        localStorage.setItem("keychainData", keychainData.savedRepr);
        localStorage.setItem("keychainChecksum", keychainData.checksum);
        log("Keychain data loaded from server successfully.");
    } catch (error) {
        log(`Error: ${error.message}`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Create a new keychain
    document.getElementById("initKeychain").addEventListener("click", async () => {
        const password = document.getElementById("password").value;
        if (!password) {
            log("Please enter a password.");
            return;
        }
        keychain = await Keychain.init(password);
        log("Keychain created successfully.");
    });

    // Save the keychain to localStorage and server
    document.getElementById("saveKeychain").addEventListener("click", async () => {
        if (!keychain) {
            log("No keychain to save. Please create or load a keychain first.");
            return;
        }
        try {
            const [savedRepr, checksum] = await keychain.dump();
            localStorage.setItem("keychainData", savedRepr);
            localStorage.setItem("keychainChecksum", checksum);
            await saveToServer({ savedRepr, checksum });
        } catch (error) {
            log(`Error saving keychain: ${error.message}`);
        }
    });

    // Load a saved keychain from localStorage or server
    document.getElementById("loadKeychain").addEventListener("click", async () => {
        const password = document.getElementById("password").value;
        if (!password) {
            log("Please enter a password.");
            return;
        }
        const savedRepr = localStorage.getItem("keychainData");
        const checksum = localStorage.getItem("keychainChecksum");
        if (!savedRepr || !checksum) {
            await loadFromServer();
        }
        try {
            keychain = await Keychain.load(password, savedRepr, checksum);
            log("Keychain loaded successfully.");
        } catch (error) {
            log(`Error loading keychain: ${error.message}`);
        }
    });

    // Set a password for a domain
    document.getElementById("setPassword").addEventListener("click", async () => {
        if (!keychain) {
            log("Please initialize or load a keychain first.");
            return;
        }
        const domain = document.getElementById("domain").value;
        const password = document.getElementById("domainPassword").value;

        if (!domain || !password) {
            log("Please provide both domain and password.");
            return;
        }
        try {
            await keychain.set(domain, password);
            log(`Password for ${domain} saved successfully.`);
        } catch (error) {
            log(`Error saving password: ${error.message}`);
        }
    });

    // Get an encrypted password
    document.getElementById("getEncryptedPassword").addEventListener("click", async () => {
        if (!keychain) {
            log("Please initialize or load a keychain first.");
            return;
        }
        const domain = document.getElementById("domain").value;
        if (!domain) {
            log("Please provide a domain.");
            return;
        }
        const hashedName = await sha256(domain);
        const entry = keychain.data.kvs[hashedName];
        if (entry) {
            log(`Encrypted value for ${domain}: ${entry.value}`);
        } else {
            log(`No encrypted value found for ${domain}.`);
        }
    });

    // Get a decrypted password
    document.getElementById("getDecryptedPassword").addEventListener("click", async () => {
        if (!keychain) {
            log("Please initialize or load a keychain first.");
            return;
        }
        const domain = document.getElementById("domain").value;
        if (!domain) {
            log("Please provide a domain.");
            return;
        }
        const password = await keychain.get(domain);
        if (password) {
            log(`Decrypted password for ${domain}: ${password}`);
        } else {
            log(`No decrypted password found for ${domain}.`);
        }
    });

    // Remove a password
    document.getElementById("removePassword").addEventListener("click", async () => {
        if (!keychain) {
            log("Please initialize or load a keychain first.");
            return;
        }
        const domain = document.getElementById("domain").value;
        if (!domain) {
            log("Please provide a domain.");
            return;
        }
        const removed = await keychain.remove(domain);
        if (removed) {
            log(`Password for ${domain} removed.`);
        } else {
            log(`No password found for ${domain}.`);
        }
    });
});
