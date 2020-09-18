const express = require('express');
const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 7000
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const uuid = require('uuid');
http.listen(port);

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
        console.log("GameId: " + gameId);
        console.log("PlayerId: " + playerId);
        let opponentPlayerId = games[gameId][playerId].opponent;
        if (opponentPlayerId) {
            socket.emit("game.begin", {
                gameId: gameId,
                player: games[gameId][playerId].player,
                myTurn: games[gameId][playerId].myTurn
            });
            games[gameId][opponentPlayerId].socket.emit("game.begin", {
                gameId: gameId,
                player: games[gameId][opponentPlayerId].player,
                myTurn: games[gameId][opponentPlayerId].myTurn
            });
        }
    });

    socket.on("re-connect", function (data) {
        joinExistGame(socket, data.gameId, data.playerId);
        console.log("reconnect success. player " + data.playerId + " joined to game: " + data.gameId);
        socket.emit("game.continue", {
            player: games[data.gameId][data.playerId].player,
            myTurn: games[data.gameId][data.playerId].myTurn,
            game: games[data.gameId].game,
            gameId: data.gameId
        });
        getOpponent(socket).emit("game.continue");

    });

    socket.on("make.move", function (data) {
        if (!getOpponent(socket)) {
            return;
        }
        switchTurns(socket);
        socket.emit("move.made", data, false);
        getOpponent(socket).emit("move.made", data, true);
    });

    socket.on("update.game", function (game) {
        games[socket.gameId].game = game;
    });

    socket.on("new.game", function () {
        if (getOpponent(socket)) {
            socket.emit("game.begin", {
                player: games[socket.gameId][socket.playerId].player,
                myTurn: true,
                gameId: socket.gameId
            });
            getOpponent(socket).emit("game.begin", {
                player: games[socket.gameId][socket.playerId].player,
                myTurn: false,
                gameId: socket.gameId
            });
        }
    });

    socket.on("disconnect", function () {
        if (getOpponent(socket)) {
            getOpponent(socket).emit("opponent.left");
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
            socket: socket,
            myTurn: true
        };
        nextGame = gameId;
        nextPlayer = playerId;
        console.log("created new Game: " + gameId + ". player " + playerId + " joined to this game.");
    } else {
        games[nextGame][playerId] = {
            opponent: nextPlayer,
            player: 2,
            socket: socket,
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

function getOpponent(socket) {
    if (!games[socket.gameId][socket.playerId].opponent) {
        return;
    }
    let opponentId = games[socket.gameId][socket.playerId].opponent;
    return games[socket.gameId][opponentId].socket;
}

function switchTurns(socket) {
    games[socket.gameId][socket.playerId].myTurn = false;
    let oppId = games[socket.gameId][socket.playerId].opponent;
    games[socket.gameId][oppId].myTurn = true;
}