const TelegramApi = require('node-telegram-bot-api'),
    token = "5979571559:AAGQ5JDqVWBIKz9L4k8LKoZGRJVIUAYreIs",
    bot = new TelegramApi(token, { polling: true }),
    { default: request } = require('axios'),
    httpsProxyAgent = require("https-proxy-agent"),
    agent = new httpsProxyAgent("http://127.0.0.1:8000");

request.defaults.withCredentials = true;
request.defaults.baseURL = `http://127.0.0.1:8000/api/`


bot.on('message', async msg => {
    const text = msg.text,
        chatId = msg.chat.id;
        let dialogStart = false;

    if (text == '/start') {
        bot.sendMessage(
            chatId,
            `Добро пожаловать в анонимный чат. Нажмите на одну из предложенных команд`
        );
    }

    if (text == '/search') {
        request.get('get-chat').then(res => {
            const chatTwo = res.data; // Берем собеседника который стоит в очереди первым
            request.post('create-chat', { chatOne: chatId, chatTwo }).then(createChatRes => {
                if (createChatRes.data == false) {
                    addQueue(chatId);
                    bot.sendMessage(chatId, 'Идет поиск собеседника...');
                } else {
                    let message = 'Собеседник найден! Чтобы остановить диалог напишите /stop';
                    bot.sendMessage(chatId, message);
                    bot.sendMessage(chatTwo, message);
                    dialogStart = true;
                } 
            })
        });
    }

    if (msg.chat.type == 'private') {
        request.get(`get-active-chat/${chatId}`).then(res => {
            bot.sendMessage(res.data.companion, text);
        })
    }

    if (text == '/stop') {
        request.get(`get-active-chat/${chatId}`).then(res => {
            if (res.data != false) {
                deleteChat(res.data.id);
                bot.sendMessage(res.data.companion,'Собеседник покинул чат');
                bot.sendMessage(chatId,'Вы вышли из чата');
            } else {
                bot.sendMessage('Чтобы начать диалог нажмите /search');
            }
        })
    }

    if (text === '/stop') {
        deleteQueue(chatId);
    }

})

async function addQueue(chatId) {
    await request.post('add-queue', {
        chatId: chatId
    });
}

async function deleteQueue(chatId) {
    await request.delete(`chats/${chatId}/delete-queue`);
}

async function deleteChat(chatId) {
    await request.delete(`delete-chat/${chatId}`);
}





