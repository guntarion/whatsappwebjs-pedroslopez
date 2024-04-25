// SIMULATING TYPING AND DELAYED REPLIES

async function replyWithDelay(client, msg, replyText) {
    const chat = await msg.getChat();
    // Simulate typing in the chat
    chat.sendStateTyping();

    // Wait for a random time between 2 and 4 seconds
    const delay = Math.random() * 2000 + 2000;
    setTimeout(() => {
        msg.reply(replyText);
    }, delay);
}

async function sendMessageWithDelay(client, msg, messageText) {
    const chat = await msg.getChat();
    // Simulate typing in the chat
    chat.sendStateTyping();

    // Wait for a random time between 2 and 4 seconds
    const delay = Math.random() * 2000 + 2000;
    setTimeout(() => {
        client.sendMessage(msg.from, messageText);
    }, delay);
}

module.exports = {
    replyWithDelay,
    sendMessageWithDelay,
};