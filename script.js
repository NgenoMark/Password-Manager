let keychain = null;

// Helper function to log messages
function log(message) {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML += `<p>${message}</p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Initialize a new keychain
document.getElementById("initKeychain").addEventListener("click", async () => {
    const password = document.getElementById("password").value;
    if (!password) {
        log("Please enter a password.");
        return;
    }
    const { Keychain } = await import("./password-manager.js");
    keychain = await Keychain.init(password);
    log("Keychain created successfully.");
});

// Load an existing keychain
document.getElementById("loadKeychain").addEventListener("click", async () => {
    const password = document.getElementById("password").value;
    if (!password) {
        log("Please enter a password.");
        return;
    }
    const { Keychain } = await import("./password-manager.js");
    const savedRepr = localStorage.getItem("keychainData"); // Retrieve from local storage
    const checksum = localStorage.getItem("keychainChecksum");
    if (!savedRepr || !checksum) {
        log("No saved keychain data found.");
        return;
    }
    try {
        keychain = await Keychain.load(password, savedRepr, checksum);
        log("Keychain loaded successfully.");
    } catch (error) {
        log(`Error loading keychain: ${error.message}`);
    }
});

// Set a password
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
    await keychain.set(domain, password);
    log(`Password set for domain: ${domain}`);
});

document.getElementById("saveKeychain").addEventListener("click", async () => {
    if (!keychain) {
        log("No keychain to save. Please create or load a keychain first.");
        return;
    }
    try {
        const [savedRepr, checksum] = await keychain.dump();
        localStorage.setItem("keychainData", savedRepr);
        localStorage.setItem("keychainChecksum", checksum);
        log("Keychain saved successfully.");
    } catch (error) {
        log(`Error saving keychain: ${error.message}`);
    }
});


// Get a password
document.getElementById("getPassword").addEventListener("click", async () => {
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
        log(`Password for ${domain}: ${password}`);
    } else {
        log(`No password found for ${domain}.`);
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
