const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory database for simplicity
let keychainDatabase = {};

// Route to save keychain data
app.post('/saveKeychain', (req, res) => {
    const { userId, keychainData } = req.body;
    keychainDatabase[userId] = keychainData;
    res.status(200).send('Keychain data saved successfully');
});

// Route to load keychain data
app.post('/loadKeychain', (req, res) => {
    const { userId } = req.body;
    const keychainData = keychainDatabase[userId];
    if (keychainData) {
        res.status(200).json(keychainData);
    } else {
        res.status(404).send('No keychain data found for this user');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
