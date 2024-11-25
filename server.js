const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let keychainData = {};

// Endpoint to save keychain data
app.post('/saveKeychain', (req, res) => {
    const { userId, keychainData: data } = req.body;
    keychainData[userId] = data;
    res.sendStatus(200);
});

// Endpoint to load keychain data
app.post('/loadKeychain', (req, res) => {
    const { userId } = req.body;
    if (keychainData[userId]) {
        res.json(keychainData[userId]);
    } else {
        res.sendStatus(404);
    }
});

// Endpoint to log messages from the client
app.post('/logMessage', (req, res) => {
    const { message } = req.body;
    console.log(message);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
