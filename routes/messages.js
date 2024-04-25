const express = require('express');
const router = express.Router();
const client = require('../betabot'); // Make sure this path is correct based on your project structure

// Route for sending a single message
router.post('/sendMessage', async (req, res) => {
    const { message, recipient } = req.body;
    // Wait for a random time between 2 and 6 seconds
    const delay = Math.random() * 4000 + 2000;
    setTimeout(async () => {
        try {
            const response = await client.sendMessage(recipient, message);
            res.json({ success: true, response });
        } catch (error) {
            res.status(500).json({ success: false, error });
        }
    }, delay);
});

// Route for sending multiple messages
router.post('/sendMessages', async (req, res) => {
    const { messages } = req.body;

    // Create a promise for each message
    const promises = messages.map(
        (item, index) =>
            new Promise((resolve, reject) => {
                // Wait for a random time between 2 and 6 seconds
                const delay = Math.random() * 4000 + 2000;
                setTimeout(async () => {
                    try {
                        const response = await client.sendMessage(
                            item.recipient,
                            item.message
                        );
                        resolve({ success: true, response });
                    } catch (error) {
                        reject({ success: false, error });
                    }
                }, delay * index); // Multiply the delay by the index to stagger the messages
            })
    );

    Promise.all(promises) // Wait for all messages to be sent
        .then((results) => res.json(results))
        .catch((errors) => res.status(500).json(errors));
});

module.exports = router;
