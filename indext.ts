const express = require('express');
const app = express();
const config = require('./config');
app.use(express.static('public'));
const port = 7000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const uuid = require('uuid');
const redis = require('redis');
const client = redis.createClient();
import {Player} from './player';

client.on('error', function (err) {
    console.log('Error ' + err);
});

client.on('connect', function () {
    console.log('Connected to Redis');
});


http.listen(port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


let games = {},
    nextGame, nextPlayer;


io.sockets.on("connection", (socket) => {
    console.log("socket connected");

    socket.emit('connect');

    socket.on("join", () => {
        let x = joinGame(socket);
        let gameId = x.gameId;
        let playerId = x.playerId;
        let s = JSON.stringify(games[gameId]);
        client.set(gameId, s);
        console.log("GameId: " + gameId);
        console.log("PlayerId: " + playerId);
        let opponentPlayerId = games[gameId][playerId].opponent;
        if (opponentPlayerId) {
            io.to(socket.id).emit("game.begin", {
                gameId: gameId,
                player: games[gameId][playerId].player,
                myTurn: games[gameId][playerId].myTurn
            });
            io.to(games[gameId][opponentPlayerId].socketId).emit("game.begin", {
                gameId: gameId,
                player: games[gameId][opponentPlayerId].player,
                myTurn: games[gameId][opponentPlayerId].myTurn
            });
        }
    });

    socket.on("re-connect", (data) => {
        joinExistGame(socket, data.gameId, data.playerId);
        console.log("reconnect success. player " + data.playerId + " joined to game: " + data.gameId);
        io.to(socket.id).emit("game.continue", {
            player: games[data.gameId][data.playerId].player,
            myTurn: games[data.gameId][data.playerId].myTurn,
            game: games[data.gameId].game,
            gameId: data.gameId
        });
        io.to(getOpponentSocketId(socket)).emit("game.continue");
    });

    socket.on("make.move", (data) => {
        if (!getOpponentSocketId(socket)) {
            return;
        }
        switchTurns(socket);
        io.to(socket.id).emit("move.made", data, false);
        io.to(getOpponentSocketId(socket)).emit("move.made", data, true);
    });

    socket.on("update.game", (game) => {
        games[socket.gameId].game = game;

    });

    socket.on("new.game", () => {
        if (getOpponentSocketId(socket)) {
            io.to(socket.id).emit("game.begin", {
                player: games[socket.gameId][socket.playerId].player,
                myTurn: true,
                gameId: socket.gameId
            });
            io.to(getOpponentSocketId(socket)).emit("game.begin", {
                player: games[socket.gameId][socket.playerId].player,
                myTurn: false,
                gameId: socket.gameId
            });
        }
    });

    socket.on("disconnect", () => {
        if (getOpponentSocketId(socket)) {
            io.to(getOpponentSocketId(socket)).emit("opponent.left");
        }
    });
});


function joinGame(socket): any {
    let playerId = uuid.v4();
    let gameId = nextGame ? nextGame : uuid.v4();
    if (!nextPlayer) {
        games[gameId] = {};
        games[gameId][playerId] = new Player(nextPlayer, 1, socket.id, true);
        console.log("created new Game: " + gameId + ". player " + playerId + " joined to this game.");
    } else {
        games[nextGame][playerId] = new Player(nextPlayer, 2, socket.id, false);
        games[nextGame][nextPlayer].opponent = playerId;
        console.log("player " + playerId + " joined game: " + gameId);

    }
    nextGame = nextGame ? null : gameId;
    nextPlayer = nextPlayer ? null : playerId;
    socket.playerId = playerId;
    socket.gameId = gameId;
    return {gameId: gameId, playerId: playerId};
}

function joinExistGame(socket, gameId: string, playerId: string): void {
    games[gameId][playerId].socket = socket;
    socket.gameId = gameId;
    socket.playerId = playerId;
}

function getOpponentSocketId(socket): string {
    if (!games[socket.gameId][socket.playerId].opponent) {
        return;
    }
    let opponentId = games[socket.gameId][socket.playerId].opponent;
    return games[socket.gameId][opponentId].socketId;
}

function switchTurns(socket): void {
    games[socket.gameId][socket.playerId].myTurn = false;
    let oppId = games[socket.gameId][socket.playerId].opponent;
    games[socket.gameId][oppId].myTurn = true;
}