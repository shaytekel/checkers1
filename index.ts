import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as uuid from 'uuid';
import {GameCache} from './gameCache';
import * as config from './config'

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = socketio(server);

server.listen(config.server_port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

let game, nextGame: string, nextPlayer: string;

io.sockets.on("connection", (socket) => {
    console.log("socket connected");

    socket.emit('connect');

    socket.on("join", async () => {
        let {gameId, playerId, match} = await joinGame(socket);
        console.log("GameId: " + gameId);
        console.log("PlayerId: " + playerId);

        if (match) {
            io.to(socket.id).emit("game begin", buildData(socket.gameId, socket.playerId));
            io.to(getOpponentSocketId(socket)).emit("game begin", buildData(socket.gameId, game[socket.playerId].opponent));
        }
        await GameCache.setGame(gameId, game);
    });

    socket.on("re-connect", async (data) => {
        game = await GameCache.getGame(data.gameId);
        joinExistGame(socket, data.gameId, data.playerId);
        console.log("reconnect success. player " + data.playerId + " joined to game: " + data.gameId);
        io.to(socket.id).emit("game continue", buildData(socket.gameId, socket.playerId, game));
        io.to(getOpponentSocketId).emit("game continue", buildData(socket.gameId, game[socket.playerId].opponent));
        await GameCache.setGame(socket.gameId, game);
    });

    socket.on("make move", async (data) => {
        game = await GameCache.getGame(socket.gameId);
        switchTurns(socket);
        io.to(socket.id).emit("update board", data, false);
        io.to(getOpponentSocketId(socket)).emit("update board", data, true);
        await GameCache.setGame(socket.gameId, game);
    });

    socket.on("update game", async (gameData) => {
        game = await GameCache.getGame(socket.gameId);
        game.gameData = gameData;
        await GameCache.setGame(socket.gameId, game);
    });

    socket.on("new game", async () => {
        game = await GameCache.getGame(socket.gameId);
        io.to(socket.id).emit("game begin", buildData(socket.gameId, socket.playerId));
        io.to(getOpponentSocketId(socket)).emit("game begin", buildData(socket.gameId, game[socket.playerId].opponent));
    });

    socket.on("disconnect", async () => {
        game = await GameCache.getGame(socket.gameId);
        if (nextPlayer === socket.playerId) {
            nextPlayer = null;
            nextGame = null;
        }
        if (getOpponentSocketId(socket)) {
            io.to(getOpponentSocketId(socket)).emit("opponent left");
        }
    });
});


async function joinGame(socket): Promise<any> {
    let playerId: string = uuid.v4();
    let gameId: string = nextGame ? nextGame : uuid.v4();
    let match = false;
    if (!nextPlayer) {
        game = {};
        game[playerId] = {
            opponent: nextPlayer,
            player: 1,
            socketId: socket.id,
            myTurn: true
        };
        console.log("created new Game: " + gameId + ". player " + playerId + " joined to this game.");
    } else {
        game = await GameCache.getGame(gameId);
        game[playerId] = {
            opponent: nextPlayer,
            player: 2,
            socketId: socket.id,
            myTurn: false
        };
        game[nextPlayer].opponent = playerId;
        match = true;
        console.log("player " + playerId + " joined game: " + gameId);

    }
    nextGame = nextGame ? null : gameId;
    nextPlayer = nextPlayer ? null : playerId;
    socket.playerId = playerId;
    socket.gameId = gameId;
    return {gameId: gameId, playerId: playerId, match: match};
}

function buildData(gameId: string, playerId: string, gameData?): object {
    let obj = {
        gameId: gameId,
        player: game[playerId].player,
        myTurn: game[playerId].myTurn,
    };
    if (gameData)
        obj[gameData] = gameData;
    return obj;

}

function joinExistGame(socket, gameId: string, playerId: string): void {
    game[playerId].socketId = socket.id;
    socket.gameId = gameId;
    socket.playerId = playerId;
}

function getOpponentSocketId(socket): string {
    if (!game[socket.playerId].opponent) {
        return;
    }
    let opponentId: string = game[socket.playerId].opponent;
    return game[opponentId].socketId;
}

function switchTurns(socket): void {
    game[socket.playerId].myTurn = false;
    let oppId: string = game[socket.playerId].opponent;
    game[oppId].myTurn = true;
}