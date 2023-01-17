const content = require("fs").readFileSync(__dirname + "/index.html", "utf8");

const httpServer = require("http").createServer((req, res) => {
  // serve the index.html file
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Length", Buffer.byteLength(content));
  res.end(content);
});

const io = require("socket.io")(httpServer);

const rooms = [];

io.on("connection", (socket) => {
  console.log("Someone connected");
  socket.emit("connection_success", socket.id);

  socket.on("disconnect", () => {
    if (rooms.length === 0) return;

    // REMOVE USER FROM ROOM
    rooms[0].players = rooms[0].players.filter((item) => item.id !== socket.id);

    socket.broadcast.emit("user_left", { usernames: rooms[0].players }); // for server + other players
  });

  socket.on("host_game", (data) => {
    console.log("host_game", data);

    // ROOM SETUP
    rooms.push({ roomCode: data, players: [] });

    socket.emit("room_created", data);
  });

  socket.on("join_room", (data) => {
    console.log("join_room", data);

    // ADD USER TO ROOM

    if (rooms.length === 0) {
      socket.emit("connecting_to_room_failed");
    }

    rooms[0].players.push({ username: data.username, id: data.id });

    socket.emit("connected_to_room"); // TODO: for user who just connected

    socket.broadcast.emit("user_joined", { usernames: rooms[0].players }); // for server + other players
  });

  socket.on("game_event", (data) => {
    socket.broadcast.emit("game_event", data);
  });
});

httpServer.listen(4000, () => {
  console.log("go to " + httpServer.address().address);
});
