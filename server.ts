import { Server, Socket } from "socket.io";

const server = new Server();

let users: Socket[] = [];
let names: Record<string, string> = {};

// 發生新的連線
server.on("connection", (socket) => {
    // 新客戶端加入
    console.log(`New client connected, socketId: ${socket.id}`);

    // 客戶端斷線
    socket.on("disconnect", (reason, desc) => {
        // 伺服器端訊息
        console.log(`Client disconnected, socketId: ${socket.id}`);
        console.log(`Reason: ${reason}, OtherDesc: ${desc}\n`);

        // 移除斷線使用者
        users = users.filter((us) => {
            return socket.id !== us.id;
        });

        // 送出斷線通知
        for (const user of users) {
            user.emit("recvNotify", `server: ${names[socket.id]} 離開聊天室!`);
        }
        delete names[socket.id];
    });

    // 註冊客戶端名稱
    socket.on("newClient", (message: string) => {
        console.log(`Client Name from connection: ${message}`);
        users.push(socket);
        names[socket.id] = message;
        for (const user of users) {
            user.emit("recvNotify", `server: ${names[socket.id]} 加入聊天室!`);
        }
    });

    // 轉送訊息
    socket.on("sendMsg", (message: string) => {
        const name: string | undefined = names[socket.id];
        if (name !== undefined) {
            for (const user of users) {
                user.emit("recvMsg", `${name} => ${message}`);
            }
        }
    })
});

function processCmd(data: Buffer) {
    const cmd = data.toString().trim();
    switch (cmd) {
        case "name":
            console.log(names, '\n');
            break;
        case "user":
            console.log(users.map(u => ({
                id: u.id,
                time: u.handshake.time,
                address: u.handshake.address,
            })), '\n');
            break;
        default:
            console.log(`Command not found!\n`);
            break;
    }
}

const cleanScreen = Buffer.from('0c', 'hex');
const exitServer = Buffer.from('04', 'hex');
const newLine = Buffer.from('0d', 'hex');
let inputBuffer = Buffer.from('');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", (data) => {
    // 清除畫面
    if (data.equals(cleanScreen)) {
        console.clear();
        return;
    }
    // 退出程式
    if (data.equals(exitServer)) {
        process.exit(0);
    }
    // 顯示按下的字母
    process.stdout.write(data);
    // 儲存輸入內容
    inputBuffer = Buffer.concat([inputBuffer, data]);
    // 讀取換行
    if (data.equals(newLine)) {
        console.log();
        processCmd(inputBuffer);
        inputBuffer = Buffer.from('');
    }
});

// 監聽 3333 埠
server.listen(3333, {
    path: "/"
});
console.log("Server running at http://127.0.0.1:3333/");