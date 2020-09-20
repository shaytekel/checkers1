import * as express from 'express'
import * as http from 'http'
import * as sokcetio from 'socket.io'
import * as uuid from 'uuid'
import * as redis from 'redis'

// const express = require('express');
const app = express();
const config = require('./config');
app.use(express.static('public'));
const port = 7000;
const server = http.createServer(app);
const io = sokcetio(server);
// const uuid = require('uuid');
// const redis = require('redis');
let client = redis.createClient();

client.on('error', function (err) {
    console.log('Error ' + err);
});

client.on('connect', function () {
    console.log('Connected to Redis');
});


server.listen(port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


let games = {},
    nextGame, nextPlayer;


io.sockets.on("connection", function (socket) {
    console.log("socket connected");

    socket.emit('connect');

    socket.on("join", function () {
        let x = joinGame(socket);
        gameId = x.gameId;
        playerId = x.playerId;
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

    socket.on("re-connect", function (data) {
        joinExistGame(socket, data.gameId, data.playerId);
        console.log("reconnect success. player " + data.playerId + " joined to game: " + data.gameId);
        io.to(socketId).emit("game.continue", {
            player: games[data.gameId][data.playerId].player,
            myTurn: games[data.gameId][data.playerId].myTurn,
            gameData: games[data.gameId].game,
            gameId: data.gameId
        });
        io.to(getOpponentSocketId(socketId)).emit("game.continue");
    });

    socket.on("make.move", function (data) {
        if (!getOpponentSocketId(socket)) {
            return;
        }
        switchTurns(socket);
        io.to(socket.id).emit("move.made", data, false);
        io.to(getOpponentSocketId(socket)).emit("move.made", data, true);
    });

    socket.on("update.game", function (game) {
        games[socket.gameId].game = game;

    });

    socket.on("new.game", function () {
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

    socket.on("disconnect", function () {
        if (getOpponentSocketId(socket)) {
            io.to(getOpponentSocketId(socket).id).emit("opponent.left");
        }
    });
});


function joinGame(socket) {
    let playerId = uuid.v4();
    let gameId = nextGame ? nextGame : uuid.v4();
    if (!nextPlayer) {
        games[gameId] = {};
        games[gameId][playerId] = {
            opponent: nextPlayer,
            player: 1,
            socketId: socket.id,
            myTurn: true
        };
        nextGame = gameId;
        nextPlayer = playerId;
        console.log("created new Game: " + gameId + ". player " + playerId + " joined to this game.");
    } else {
        games[nextGame][playerId] = {
            opponent: nextPlayer,
            player: 2,
            socketId: socket.id,
            myTurn: false
        };
        games[nextGame][nextPlayer].opponent = playerId;
        nextGame = null;
        nextPlayer = null;
        console.log("player " + playerId + " joined game: " + gameId);

    }
    socket.playerId = playerId;
    socket.gameId = gameId;
    return {gameId: gameId, playerId: playerId};
}

function joinExistGame(socket, gameId, playerId) {
    games[gameId][playerId].socket = socket;
    socket.gameId = gameId;
    socket.playerId = playerId;
}

function getOpponentSocketId(socket) {
    if (!games[socket.gameId][socket.playerId].opponent) {
        return;
    }
    let opponentId = games[socket.gameId][socket.playerId].opponent;
    return games[socket.gameId][opponentId].socketId;
}

function switchTurns(socket) {
    games[socket.gameId][socket.playerId].myTurn = false;
    let oppId = games[socket.gameId][socket.playerId].opponent;
    games[socket.gameId][oppId].myTurn = true;
}