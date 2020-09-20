import {GameController} from "./controllers/gameController.js";
import {Move} from "./models/move.js";
import {Position} from "./models/position.js";
import {Board} from "./models/board.js";

let socket = io();
let player, myTurn, gameOver, gameId, playerId;
let g = new GameController();
let movesPlayer = buildMoves();

//scripted moves
function buildMoves() {
    let player1Moves = [];
    let player2Moves = [];
    player1Moves.push(new Move(new Position(0, 1), new Position(1, 3))); //not valid
    player1Moves.push(new Move(new Position(0, 2), new Position(1, 3)));
    player1Moves.push(new Move(new Position(0, 0), new Position(1, 1)));
    player1Moves.push(new Move(new Position(1, 3), new Position(2, 2)));
    player1Moves.push(new Move(new Position(0, 1), new Position(1, 3))); //not valid
    player1Moves.push(new Move(new Position(0, 2), new Position(1, 3)));
    player1Moves.push(new Move(new Position(0, 0), new Position(1, 1)));
    player1Moves.push(new Move(new Position(1, 3), new Position(2, 2)));

    player2Moves.push(new Move(new Position(3, 1), new Position(2, 2)));
    player2Moves.push(new Move(new Position(2, 2), new Position(0, 0)));
    player2Moves.push(new Move(new Position(2, 2), new Position(3, 1))); //not valid
    player2Moves.push(new Move(new Position(3, 3), new Position(1, 1)));
    player2Moves.push(new Move(new Position(3, 1), new Position(2, 2)));
    player2Moves.push(new Move(new Position(2, 2), new Position(0, 0)));
    player2Moves.push(new Move(new Position(2, 2), new Position(3, 1))); //not valid
    player2Moves.push(new Move(new Position(3, 3), new Position(1, 1)));

    return {1: player1Moves, 2: player2Moves};
}

$(function () {
    $(".board button").attr("disabled", true);
    $(".board> button").on("click", makeMove);

    socket.on('connect', () => {
        gameId = prompt("If you have an gameId, what is it?");
        playerId = prompt("what is your Id?");
        if ((gameId) && (playerId)) {
            socket.emit('re-connect', {gameId, playerId});
        } else
            socket.emit('join');
    });

    socket.on("game begin", data => {
        gameOver = false;
        player = data.player;
        myTurn = data.myTurn;
        gameId = data.gameId;
        g.newGame();
        g.printBoard();

        if (myTurn)
            socket.emit("update game", g);
        renderTurnMessage();
    });

    socket.on("update board", function (data, myUpdatedTurn) {
        let move = constructMove(data.move._currentPosition, data.move._toPosition);

        g.doMove(data.player, move);
        console.log("board:");
        g.printBoard();

        //update server only once
        if (!myTurn)
            socket.emit("update game", g);
        myTurn = myUpdatedTurn;

        if (!g.isWinner()) {
            renderTurnMessage();
        } else {
            gameOver = true;
            renderWinLoseMessage();
        }
    });

    socket.on("opponent left", function () {
        $("#messages").text("Your opponent left the game.");
        $(".board button").attr("disabled", true);
    });

    socket.on("game continue", function (data) {
        if (data)
            restoreData(data);
        g.printBoard();
        renderTurnMessage();
    });
});

function makeMove(e) {
    if (gameOver) {
        socket.emit("new game");
        return;
    }

    let move = movesPlayer[player].shift();
    e.preventDefault();

    //Turn validation
    if (!myTurn) {
        return;
    }

    //Move validation
    let flag = g.isValidMove(player, move);
    console.log(flag);
    if (!flag) {
        $("#messages").text("Your move is not valid. Try again");
        return;
    }

    //Emit the move to the server
    socket.emit("make move", {
        gameId: gameId,
        player: player,
        move: move,
        gameData: g
    });

}

function constructMove(curPos, toPos) {
    let curPosition = Object.assign(new Position(), curPos);
    let toPosition = Object.assign(new Position(), toPos);
    return new Move(curPosition, toPosition);
}

function renderTurnMessage() {
    if (!myTurn) {
        $("#messages").text("Your opponent's turn");
        $(".board button").attr("disabled", true);
    } else {
        $("#messages").text("Your turn.");
        $(".board button").removeAttr("disabled");
    }
}

function renderWinLoseMessage() {
    if (myTurn) {
        $("#messages").text("Game over. You lost.");
        $(".board button").removeAttr("disabled", true);
    } else {
        $("#messages").text("Game over. You won!");
        $(".board button").removeAttr("disabled");
    }
}

function restoreData(data) {
    gameOver = false;
    player = data.player;
    myTurn = data.myTurn;
    gameId = data.gameId;
    g = Object.assign(new GameController(), data.game);
    g.board = Object.assign(new Board(), data.game._board);
    console.log("board is restored!");
}
