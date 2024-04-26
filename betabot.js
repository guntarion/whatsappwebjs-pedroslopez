const dotenv = require('dotenv');
dotenv.config();
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const fetch = require('node-fetch');

const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    keyFile: 'hardy-position-391701-f77f2a757d7d.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});


const { Client, LocalAuth } = require('./index');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        headless: false,
    },
});

const nasehatList = require('./models/nasehatData');
const haditsData = require('./models/haditsMuslimData');
const kiatSehatList = require('./models/kiatSehatData');


client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', (msg) => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('🧤 READY');
});

// SIMULATING TYPING AND DELAYED REPLIES

async function replyWithDelay(chat, msg, replyText) {
    // Simulate typing in the chat
    chat.sendStateTyping();

    // Wait for a random time between 2 and 4 seconds
    const delay = Math.random() * 2000 + 2000;
    setTimeout(() => {
        msg.reply(replyText);
    }, delay);
}

async function sendMessageWithDelay(chat, msg, messageText) {
    // Simulate typing in the chat
    chat.sendStateTyping();

    // Wait for a random time between 2 and 4 seconds
    const delay = Math.random() * 2000 + 2000;
    setTimeout(() => {
        client.sendMessage(msg.from, messageText);
    }, delay);
}

async function appendToSheet(auth, range, data) {
    const spreadsheetId = '1cyJRLS-Op7chCV1sY-jZuu4TIhfrvDjS_RM1jhrZIJo';
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [
                        data.dateTime,
                        'FALSE',
                        data.contactNumber,
                        data.contactPlatform,
                        data.contactPublishedName,
                        data.contactSavedName,
                        data.message,
                    ],
                ],
            },
        });
        console.log(response.data);
    } catch (err) {
        console.error('The API returned an error: ' + err);
    }
}


function convertTo24Hour(time) {
    const [hours, minutes] = time.split(':');
    const hoursIn24 = hours % 12 + (time.includes('pm') ? 12 : 0);
    return `${hoursIn24}:${minutes.replace('am', 'wib').replace('pm', 'wib')}`;
}

function adjustTime(time, minutesToAdd) {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(parseInt(minutes.replace('wib', '')) + minutesToAdd);
    const formattedMinutes =
        date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    return `${date.getHours()}:${formattedMinutes} wib`;
}

// BEGIN PUPPETEER EVENTS

client.on('message', async (msg) => {
    console.log('MESSAGE RECEIVED', msg);
    const chat = await msg.getChat();

    if (msg.body === '.status') {
        const currentDate = new Date();
        const masehiDateTime = currentDate.toLocaleString('en-US', {
            timeZone: 'Asia/Jakarta',
        });
        const hijriDateTime = currentDate.toLocaleString('en-US', {
            timeZone: 'Asia/Jakarta',
            calendar: 'islamic-umalqura',
        });

        const replyMessage = `Server Al Muhajirin is up and running 🚀\nMasehi: ${masehiDateTime}\nHijriah: ${hijriDateTime}`;
        await replyWithDelay(chat, msg, replyMessage);
    } else if (msg.body === '!ping reply') {
        
        // Send a new message as a reply to the current one
        // msg.reply('pong');
        await replyWithDelay(chat, msg, 'pong');
    } else if (msg.body === '!ping') {
        // Send a new message to the same chat
        // client.sendMessage(msg.from, 'pong');
        await sendMessageWithDelay(chat, msg, 'pong');
    } 

    else if (msg.body === '.info') {
        const replyMessage = `
    📳 WhatsApp Center
    🌟 Al Muhajirin Rewwin
    🔖 0823-1213-2187

    \`.info\`
    Menampilkan informasi ini.

    \`.kegiatan\`
    Menampilkan informasi kegiatan terkini di YAMR.

    \`.layanan\`
    Menampilkan informasi layanan di YAMR.

    \`.nasehat\`
    Menampilkan inspirasi nasehat dari ayat Al Qur'an.

    \`.sehat\`
    Menampilkan kiat sehat islami.

    \`.sholat\`
    Menampilkan jadwal waktu sholat khusus untuk wilayah Sidoarjo di hari ini.

    \`.hadits (angka)\`
    Menampilkan hadits shahih Muslim sesuai nomor yang diminta (1 - 4.930). Contoh: \`.hadits 123\` untuk hadits nomer 123. Bila angka tidak diisi macam \`.hadits\`, maka  akan ditampilkan hadits nomer sembarang.

    \`.ayat (no-surat):(no-ayat)\`
    Menampilkan terjemah dari ayat Al Qur'an. Contoh: \`.ayat 2:30\` untuk ayat dari surah ke-2 ayat ke-30. 

    \`.cari (istilah-yang-dicari):(nomer-surat)\`
    Menampilkan daftar ayat yang berisikan istilah yang dicari: Contoh: \`.cari ibrahim:2\` untuk mencari ayat di surah ke-2 yang mengandung kata "ibrahim". Bisa juga \`.cari ibrahim\` untuk menampilkan semua ayat dari surat manapun yang mengandung kata bersangkutan

    \`.ai (pertanyaan bebas)\`
    Mengajukan pertanyaan bebas pada Artificial Intelligence. Contoh: \`.ai apa syarat sah wudhu?\`

    \`.inputan (informasi atau saran/masukan)\`
    Sampaikan informasi (mis: kerusakan AC) atau berikan saran untuk seluruh program/unit di YAMR.
    
    \`.status\`
    Cek apakah server online
        `;
        await replyWithDelay(chat, msg, replyMessage);
    }
    
    else if (msg.body === '.nasehat') {
        const randomNasehat = nasehatList[Math.floor(Math.random() * nasehatList.length)];
        const replyMessage = `🎖 _${randomNasehat.advice}_ \n\n📍Inspirasi dari Surat ☪️ ${randomNasehat.reference}\n\n~ Al Muhajirin WA Center`;
        
        await replyWithDelay(chat, msg, replyMessage);
    } 

    else if (msg.body === '.sehat') {
        const randomKiatSehat = kiatSehatList[Math.floor(Math.random() * kiatSehatList.length)];
        const replyMessage = `💝 Kiat Sehat: *${randomKiatSehat.kiat}*\n\n${randomKiatSehat.deskripsi}\n\n~ Al Muhajirin WA Center`;

        await replyWithDelay(chat, msg, replyMessage);
    }
    
    else if (msg.body.startsWith('.hadits')) {
        // Extract the number part from the message
        const parts = msg.body.split(' '); // This splits the message into parts based on spaces
        let hadith;
        if (parts.length === 2 && !isNaN(parts[1])) {
            let hadithNumber = parseInt(parts[1], 10);
            // Ensure the hadith number is within the valid range
            if (hadithNumber < 1) {
                hadithNumber = 1;
            } else if (hadithNumber > 4930) {
                hadithNumber = 4930;
            }
            // Find the hadith by number
            hadith = haditsData.find(h => h.number === hadithNumber);
        } else if (parts.length === 1) {
            // Select a random hadith
            hadith = haditsData[Math.floor(Math.random() * haditsData.length)];
        }

        if (hadith) {
            const replyMessage = `🖌️ Hadits Muslim no: ${hadith.number}:\n ${hadith.id} \n\n~ Al Muhajirin WA Center`; 
            await replyWithDelay(chat, msg, replyMessage);
        } else {
            await replyWithDelay(chat, msg, 'Hadits tidak ditemukan.');
        }
    }

    else if (msg.body === '.sholat') {
        fetch('https://muslimsalat.com/sidoarjo.json')
            .then((response) => response.json())
            .then(async (data) => {
                const prayerTimes = data.items[0];
                const date = data.items[0].date_for;
                const city = data.city;

                // Convert prayer times to 24 hour format and adjust the time
                const fajr = adjustTime(convertTo24Hour(prayerTimes.fajr), 3);
                const shurooq = adjustTime(
                    convertTo24Hour(prayerTimes.shurooq),
                    3
                );
                const dhuhr = adjustTime(convertTo24Hour(prayerTimes.dhuhr), 4);
                const asr = adjustTime(convertTo24Hour(prayerTimes.asr), 2);
                const maghrib = adjustTime(
                    convertTo24Hour(prayerTimes.maghrib),
                    1
                );
                const isha = adjustTime(convertTo24Hour(prayerTimes.isha), 3);

                const currentDate = new Date();
                const hijriDate = currentDate.toLocaleString('en-US', {
                    timeZone: 'Asia/Jakarta',
                    calendar: 'islamic-umalqura',
                });

                const replyMessage = `*⏰ Waktu Sholat ${city}, ${date}*\n*Hijri: ${hijriDate}*\n\n- Shubuh: ${fajr}\n- Shuruq: ${shurooq}\n- Dhuhur: ${dhuhr}\n- Ashar: ${asr}\n- Maghrib: ${maghrib}\n- Isya': ${isha}\n\n~ Al Muhajirin WA Center`;

                await replyWithDelay(chat, msg, replyMessage);
            })
            .catch((error) => console.error('Error:', error));

    } 
    else if (msg.body.startsWith('.kegiatan')) {
        // get value from the message
        const spreadsheetId = '1cyJRLS-Op7chCV1sY-jZuu4TIhfrvDjS_RM1jhrZIJo';
        const range = 'infoLayanan!B2';
        const sheets = google.sheets({ version: 'v4', auth });

        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            });
            const value = response.data.values[0][0];
            // console.log(value);
            await replyWithDelay(chat, msg, value);
        } catch (err) {
            console.error('The API returned an error: ' + err);
        }
    }

    else if (msg.body.startsWith('.layanan')) {
        // get value from the message
        const spreadsheetId = '1cyJRLS-Op7chCV1sY-jZuu4TIhfrvDjS_RM1jhrZIJo';
        const range = 'infoLayanan!B4';
        const sheets = google.sheets({ version: 'v4', auth });

        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            });
            const value = response.data.values[0][0];
            // console.log(value);
            await replyWithDelay(chat, msg, value);
        } catch (err) {
            console.error('The API returned an error: ' + err);
        }
    }

    else if (msg.body.startsWith('.inputan')) {
        let info = client.info;
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const sender = await msg.getContact();
        const data = {
            dateTime: formattedDateTime,
            contactPlatform: info.platform,
            contactPublishedName: sender.pushname,
            contactSavedName: sender.name,
            contactNumber: sender.number,
            message: msg.body.replace('.inputan ', ''),
        };
        msg.react('🙏🏼');
        await appendToSheet(auth, 'receivedMessages', data);
        await replyWithDelay(chat, msg, 'Terima kasih atas informasi/saran/masukan yang telah diberikan.');
    } 
    
    else if (msg.body.startsWith('!askpdf')) {
        console.log('Received a question to ask the PDF.');
        const input = msg.body.slice(8); // Get the input from the message, removing "!askpdf " from the start
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
            .then((response) => response.json())
            .then((data) => {
                // Reply with the answer
                msg.reply(data.result.text);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    } else if (msg.body.startsWith('.ayat ')) {
        let inputanAsli = msg.body.slice(6); // Get the ayah number or surah:ayah from the message
        let surahAndAyah = inputanAsli.split(':'); // Split the input by ':'
        let surahNumber = parseInt(surahAndAyah[0], 10); // Get the surah number and convert it to an integer
        let ayahNumber = parseInt(surahAndAyah[1], 10); // Get the ayah number and convert it to an integer

        if (surahNumber > 114) {
            surahNumber = 114;
            return;
        }

        let inputanAPI = `${surahNumber}:${ayahNumber}`;
        console.log(inputanAPI);

        // eslint-disable-next-line quotes
        const surahNames = ['Al-Fatihah', 'Al-Baqarah', "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", 'Al-Anfal', 'At-Taubah', 'Yunus', 'Hud', 'Yusuf', "Ar-Ra'd", 'Ibrahim', 'Al-Hijr', 'An-Nahl', "Al-Isra'", 'Al-Kahf', 'Maryam', 'Ta-Ha', "Al-Anbiya'", 'Al-Hajj', "Al-Mu'minun", 'An-Nur', 'Al-Furqan', "Ash-Shu'ara", 'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab', "Saba'", 'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah', 'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', "Al-Waqi'ah", 'Al-Hadid', 'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', "Al-Jumu'ah", 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', "Al-Ma'arij", 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', "An-Naba'", "An-Nazi'at", "'Abasa", 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', "Al-A'la", 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Lail', 'Ad-Duha', 'Ash-Sharh', 'At-Tin', "Al-'Alaq", 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', "Al-'Adiyat", "Al-Qari'ah", 'At-Takathur', "Al-'Asr", 'Al-Humazah', 'Al-Fil', 'Quraysh', "Al-Ma'un", 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas', ];

        const surahName = surahNames[surahNumber - 1]; // Get the surah name using the surah number as an index

        const url = `http://api.alquran.cloud/v1/ayah/${inputanAPI}/id.indonesian`;

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                const content = data.data.text; // Get the content from the API response
                // Use the content here
                msg.reply(
                    `Surah ${surahNumber}: ${surahName} ayat ke-${ayahNumber}\n${content}`
                );
            })
            .catch((error) => console.error('Error:', error));
    } else if (msg.body.startsWith('.cari ')) {
        const input = msg.body.slice(6); // Get the user's input, removing "!qcari " from the start
        let keyword, surah;

        if (input.includes(':')) {
            [keyword, surah] = input.split(':'); // Split the input at the colon to get the keyword and surah number
        } else {
            keyword = input; // If there's no colon, the whole input is the keyword
            surah = 'all'; // Search all surahs
        }

        const url = `http://api.alquran.cloud/v1/search/${encodeURIComponent(
            keyword
        )}/${encodeURIComponent(surah)}/id.indonesian`;

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (
                    data.data &&
                    data.data.matches &&
                    data.data.matches.length > 0
                ) {
                    // Start building the reply message
                    let replyMessage = `Terdapat ${data.data.matches.length} Hasil Pencarian untuk kata kunci '${keyword}':\n\n`;

                    // Append each match to the reply message with a sequence number
                    data.data.matches.forEach((match, index) => {
                        replyMessage += `${index + 1}. Surah ${
                            match.surah.number
                        } ayat ${match.numberInSurah}\n`;
                    });

                    // Send the formatted reply
                    msg.reply(replyMessage);
                } else {
                    // No matches found
                    msg.reply(
                        `Tidak ada hasil pencarian ditemukan untuk kata kunci '${keyword}'.`
                    );
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                msg.reply(
                    'Maaf, terjadi kesalahan saat memproses permintaan Anda.'
                );
            });
    } else if (msg.body.startsWith('.ai ')) {
        // Extract the prompt from the message, removing "!ai " from the start
        const prompt = msg.body.slice(4);

        // Define an async function to call the OpenAI API
        const callOpenAI = async () => {
            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content:
                                'Anda memberi edukasi dan menerima pertanyaan yang terkait dengan agama, pendidikan, sosial, dan kesehatan.',
                        },
                        { role: 'user', content: prompt },
                    ],
                });

                // Send the response text back to the user
                msg.reply(response.choices[0].message.content.trim());
            } catch (error) {
                console.error('OpenAI Error:', error);
                msg.reply(
                    'Sorry, I encountered an error while processing your request.'
                );
            }
        };

        // Call the OpenAI function
        callOpenAI();
    } else if (msg.body === '!reaction') {
        msg.react('👍');
    } else if (msg.body === '!chats') {
        const chats = await client.getChats();
        client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
    } else if (msg.body === '.sender') {
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

    const prefixes = ['.info', '.nasehat', '.sehat', '.sholat', '.hadits', '.ayat', '.cari', '.ai', '.inputan', '.status'];

    if (prefixes.some(prefix => msg.body.startsWith(prefix))) {
        let info = client.info;
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const sender = await msg.getContact();
        const data = {
            dateTime: formattedDateTime,
            contactPlatform: info.platform,
            contactPublishedName: sender.pushname,
            contactSavedName: sender.name,
            contactNumber: sender.number,
            message: msg.body,
        };

        await appendToSheet(auth, 'aktivitas', data);
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
