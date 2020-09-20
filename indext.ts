import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as uuid from 'uuid';
import {CheckersCache} from './checkersCache';
import {Player} from './player';

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = socketio(server);
const config = require('./config');

server.listen(7000);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

let game, nextGame, nextPlayer;
let checkersCache = new CheckersCache();

io.sockets.on("connection", (socket) => {
    console.log("socket connected");

    socket.emit('connect');

    socket.on("join", async () => {
        console.log(await CheckersCache.getGame("90"));

        let x = await joinGame(socket);
        let gameId = x.gameId;
        let playerId = x.playerId;
        let opponentPlayerId = x.opponentId;
        console.log("GameId: " + gameId);
        console.log("PlayerId: " + playerId);

        let opponentPlayer = game[opponentPlayerId];
        if (opponentPlayerId) {
            let opponentSocketId = opponentPlayer.socketId;
            io.to(socket.id).emit("game.begin", {
                gameId: gameId,
                player: game[playerId].player,
                myTurn: game[playerId].myTurn
            });
            io.to(opponentSocketId).emit("game.begin", {
                gameId: gameId,
                player: game[opponentPlayerId].player,
                myTurn: game[opponentPlayerId].myTurn
            });
        }
        await CheckersCache.setGame(gameId, game);
    });

    socket.on("re-connect", async (data) => {
        game = await CheckersCache.getGame(data.gameId);
        joinExistGame(socket, data.gameId, data.playerId);
        console.log("reconnect success. player " + data.playerId + " joined to game: " + data.gameId);
        io.to(socket.id).emit("game.continue", {
            player: game[data.playerId].player,
            myTurn: game[data.playerId].myTurn,
            game: game.gameData,
            gameId: data.gameId
        });
        io.to(getOpponentSocketId(socket)).emit("game.continue");
        await CheckersCache.setGame(socket.gameId, game);
    });

    socket.on("make.move", async (data) => {
        game = await CheckersCache.getGame(socket.gameId);
        if (!getOpponentSocketId(socket)) {
            return;
        }
        switchTurns(socket);
        io.to(socket.id).emit("move.made", data, false);
        io.to(getOpponentSocketId(socket)).emit("move.made", data, true);
        await CheckersCache.setGame(socket.gameId, game);

    });

    socket.on("update.game", async (gameData) => {
        game = await CheckersCache.getGame(socket.gameId);
        game.gameData = gameData;
        await CheckersCache.setGame(socket.gameId, game);
        // games[socket.gameId].game = game;
    });

    socket.on("new.game", async () => {
        game = await CheckersCache.getGame(socket.gameId)
        if (getOpponentSocketId(socket)) {
            io.to(socket.id).emit("game.begin", {
                player: game[socket.playerId].player,
                myTurn: true,
                gameId: socket.gameId
            });
            io.to(getOpponentSocketId(socket)).emit("game.begin", {
                player: game[socket.playerId].player,
                myTurn: false,
                gameId: socket.gameId
            });
        }

    });

    socket.on("disconnect", async () => {
        game = await CheckersCache.getGame(socket.gameId);
        if (nextPlayer === socket.playerId) {
            nextPlayer = null;
            nextGame = null;
        }
        if (getOpponentSocketId(socket)) {
            io.to(getOpponentSocketId(socket)).emit("opponent.left");
        }
    });
});


async function joinGame(socket) {
    let playerId = uuid.v4();
    let gameId = nextGame ? nextGame : uuid.v4();
    if (!nextPlayer) {
        game = {};
        // game[playerId] = new Player(nextPlayer, 1, socket.id, true);
        game[playerId] = {
            opponent: nextPlayer,
            player: 1,
            socketId: socket.id,
            myTurn: true
        };
        console.log("created new Game: " + gameId + ". player " + playerId + " joined to this game.");
    } else {
        game = await CheckersCache.getGame(gameId);
        // game[playerId] = new Player(nextPlayer, 2, socket.id, false);
        game[playerId] = {
            opponent: nextPlayer,
            player: 2,
            socketId: socket.id,
            myTurn: false
        };
        game[nextPlayer].opponent = playerId;
        // games[nextGame][playerId] = new Player(nextPlayer, 2, socket.id, false);
        // games[nextGame][nextPlayer].opponent = playerId;
        console.log("player " + playerId + " joined game: " + gameId);

    }
    let opponentId = nextPlayer;
    nextGame = nextGame ? null : gameId;
    nextPlayer = nextPlayer ? null : playerId;
    socket.playerId = playerId;
    socket.gameId = gameId;
    return {gameId: gameId, playerId: playerId, opponentId: opponentId};
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
    let opponentId = game[socket.playerId].opponent;
    return game[opponentId].socketId;
}

function switchTurns(socket): void {
    game[socket.playerId].myTurn = false;
    let oppId = game[socket.playerId].opponent;
    game[oppId].myTurn = true;
}