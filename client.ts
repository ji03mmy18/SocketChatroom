import { io } from "socket.io-client";
import { createInterface } from "readline/promises";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});
const client = io("http://127.0.0.1:3333/");

// 連線建立時
client.on("connect", async () => {
    // 客戶端ID
    console.log(`Connected to Server, your socketId: ${client.id}`);

    // 輸入名稱
    await enterName();
});

async function enterName() {
    const name = await rl.question("請輸入您的暱稱: ");
    client.emit("newClient", name);
}

// 接收普通訊息
client.on("recvMsg", (message: string) => {
    console.log(`\x1b[32m${message}\x1b[0m`);
});

// 接收加入/離開通知
client.on("recvNotify", (message: string) => {
    console.log(`\x1b[34m${message}\x1b[0m`);
});

// 處理輸入訊息
rl.on('line', (input) => {
    client.emit("sendMsg", input);
});