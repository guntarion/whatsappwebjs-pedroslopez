// Import necessary libraries and modules
const fetch = require('node-fetch');
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// const {
//     replyWithDelay,
//     sendMessageWithDelay,
// } = require('../utils/messagingUtilities');


// Function to attach message event handlers
function attachMessageHandlers(client) {

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

    client.on('message', async (msg) => {
        console.log('MESSAGE RECEIVED', msg);

        if (msg.body === '!status') {
            const currentDate = new Date();
            const masehiDateTime = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
            const hijriDateTime = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Jakarta', calendar: 'islamic-umalqura' });

            const replyMessage = `Server is up and running 🚀\nMasehi: ${masehiDateTime}\nHijriah: ${hijriDateTime}`;
            await replyWithDelay(msg, replyMessage);
        } else if (msg.body === '!ping reply') {
            // Send a new message as a reply to the current one
            // msg.reply('pong');
            await replyWithDelay(msg, 'pong');
        } else if (msg.body === '!ping') {
            // Send a new message to the same chat
            // client.sendMessage(msg.from, 'pong');
            await sendMessageWithDelay(msg, 'pong');
        }

        else if (msg.body.startsWith('!askpdf')) {
            console.log('Received a question to ask the PDF.');
            const input = msg.body.slice(8);    // Get the input from the message, removing "!askpdf " from the start
            console.log('Input:', input);

            const url = 'http://localhost:3001/ask';

            // Send the question to the local endpoint
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: input,
                }),
            })
                .then(response => response.json())
                .then(data => {
                    // Reply with the answer
                    msg.reply(data.result.text);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }


        else if (msg.body.startsWith('!qayat ')) {
            const ayah = msg.body.slice(7); // Get the ayah number or surah:ayah from the message
            const surahNumber = ayah.split(':')[0]; // Get the surah number

            // eslint-disable-next-line quotes
            const surahNames = ["Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddathir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"];

            const surahName = surahNames[surahNumber - 1]; // Get the surah name using the surah number as an index

            const url = `http://api.alquran.cloud/v1/ayah/${ayah}/id.indonesian`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const content = data.data.text; // Get the content from the API response
                    // Use the content here
                    msg.reply(`Surah ${surahNumber}: ${surahName} ayat ke-${ayah.split(':')[1]}\n${content}`);
                })
                .catch(error => console.error('Error:', error));
        }

        else if (msg.body.startsWith('!qcari ')) {
            const input = msg.body.slice(7); // Get the user's input, removing "!qcari " from the start
            let keyword, surah;

            if (input.includes(':')) {
                [keyword, surah] = input.split(':'); // Split the input at the colon to get the keyword and surah number
            } else {
                keyword = input; // If there's no colon, the whole input is the keyword
                surah = 'all'; // Search all surahs
            }

            const url = `http://api.alquran.cloud/v1/search/${encodeURIComponent(keyword)}/${encodeURIComponent(surah)}/id.indonesian`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.data && data.data.matches && data.data.matches.length > 0) {
                        // Start building the reply message
                        let replyMessage = `Terdapat ${data.data.matches.length} Hasil Pencarian untuk kata kunci '${keyword}':\n\n`;

                        // Append each match to the reply message with a sequence number
                        data.data.matches.forEach((match, index) => {
                            replyMessage += `${index + 1}. Surah ${match.surah.number} ayat ${match.numberInSurah}\n`;
                        });

                        // Send the formatted reply
                        msg.reply(replyMessage);
                    } else {
                        // No matches found
                        msg.reply(`Tidak ada hasil pencarian ditemukan untuk kata kunci '${keyword}'.`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    msg.reply('Maaf, terjadi kesalahan saat memproses permintaan Anda.');
                });
        }


        else if (msg.body.startsWith('!ai ')) {
            // Extract the prompt from the message, removing "!ai " from the start
            const prompt = msg.body.slice(4);

            // Define an async function to call the OpenAI API
            const callOpenAI = async () => {
                try {
                    const response = await openai.chat.completions.create({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: prompt }
                        ],
                    });

                    // Send the response text back to the user
                    msg.reply(response.choices[0].message.content.trim());
                } catch (error) {
                    console.error('OpenAI Error:', error);
                    msg.reply('Sorry, I encountered an error while processing your request.');
                }
            };

            // Call the OpenAI function
            callOpenAI();
        }

        else if (msg.body === '!chats') {
            const chats = await client.getChats();
            client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
        } else if (msg.body === '!info') {
            let info = client.info;
            const sender = await msg.getContact();
            // const contactId = sender.id;

            const contactPublishedName = sender.pushname;
            const contactSavedName = sender.name;
            const contactNumber = sender.number;
            console.log(`Sender's number: ${sender.pushname}`);

            client.sendMessage(
                msg.from,
                `
                *Connection info*
                User name: ${info.pushname}
                My number: ${info.wid.user}
                Platform: ${info.platform}
                Contact Published Name: ${contactPublishedName}
                Contact Saved Name: ${contactSavedName}
                Contact Number: ${contactNumber}

            `
            );
        } 
    });


    client.on('message_create', async (msg) => {
        // Fired on all message creations, including your own
        if (msg.fromMe) {
            // do stuff here
        }

        // Unpins a message
        if (msg.fromMe && msg.body.startsWith('!unpin')) {
            const pinnedMsg = await msg.getQuotedMessage();
            if (pinnedMsg) {
                // Will unpin a message
                const result = await pinnedMsg.unpin();
                console.log(result); // True if the operation completed successfully, false otherwise
            }
        }
    });
}

// Export the function
module.exports = {
    attachMessageHandlers,
};
