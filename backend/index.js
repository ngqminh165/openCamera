const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Matrix Set up
const { MemoryCryptoStore } = require("matrix-js-sdk");
var sdk = require("matrix-js-sdk");
global.Olm = require("olm");
var LocalStorage = require("node-localstorage").LocalStorage;
global.localStorage = new LocalStorage("./session");
BASE_URL = "https://matrix.pdxinfosec.org";
PASSWORD = "G3Vsnzvr";
USERNAME = "@test003:pdxinfosec.org";
ROOM_ID = "!bdQMmkTBTMqUPAOvms:pdxinfosec.org";
const client = sdk.createClient(BASE_URL);
let sequenceNumberByClient = new Map();

// Add messages when sockets open and close connections
io.on('connection', socket => {
  console.log(`[${socket.id}] socket connected`);
  socket.on('disconnect', reason => {
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
  });
});

run = async () => {

  const info = await client.login("m.login.password", {
      user: USERNAME,
      password: PASSWORD,
  });
  console.log(info);

  client.sessionStore = new sdk.WebStorageSessionStore(global.localStorage);
  client.cryptoStore = new MemoryCryptoStore();
  client.deviceId = info.device_id;

  await client.initCrypto();
  client.setGlobalErrorOnUnknownDevices(false);

  client.on("Event.decrypted", (e) => {
      const { room_id, content } = e.clearEvent;

      if (content !== undefined) {
          console.log(
              "[room =" + room_id + "]" + e.event.sender + ":" + content.body
          );
          console.log(content);
          io.sockets.emit("motion-detect", content.body);

      }
      /*
      for (const [client, sequenceNumber] of sequenceNumberByClient.entries()) {
          if (content !== undefined) {

              if (content.msgtype == 'm.image') {
                  var myMessage = content.body
                  myMessage += JSON.stringify(content.file, null, ' ')

                  io.sockets.emit("motion-detect", myMessage);

              }
              
              else
                io.sockets.emit("motion-detect", content.body);
              sequenceNumberByClient.set(client, sequenceNumber + 1);
          }
      }*/

  });

  await client.startClient();
};

run();

// Broadcast the current server time as global message, every 1s
setInterval(() => {
  io.sockets.emit('time-msg', { time: new Date().toISOString() });
}, 1000);

// Show the index.html by default
app.get('/', (req, res) => res.sendFile('index.html'));

// Start the express server
http.listen(3000, function(){
  console.log('listening on *:3000');
});
