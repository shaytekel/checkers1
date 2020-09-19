class Position {
    _row;
    _col;

    constructor(row, col) {
        this._row = row;
        this._col = col;
    }

    get row() {
        return this._row;
    }

    set row(value) {
        this._row = value;
    }

    get col() {
        return this._col;
    }

    set col(value) {
        this._col = value;
    }
}

class Move {
    _currentPosition;
    _toPosition;

    constructor(currentPosition, toPosition) {
        this._currentPosition = currentPosition;
        this._toPosition = toPosition;
    }


    get currentPosition() {
        return this._currentPosition;
    }

    set currentPosition(value) {
        this._currentPosition = value;
    }

    get toPosition() {
        return this._toPosition;
    }

    set toPosition(value) {
        this._toPosition = value;
    }
}

class Board {
    board;
    size;

    constructor(size) {
        this.board = [];
        this.size = size
    }

    setMove(move) {
        let player = this.board[move.currentPosition.row][move.currentPosition.col];
        this.board[move.currentPosition.row][move.currentPosition.col] = 0;
        this.board[move.toPosition.row][move.toPosition.col] = player;
    }

    initCell(pieceToRemove) {
        this.board[pieceToRemove.row][pieceToRemove.col] = 0;
    }

    initBoard() {
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = 0;
            }
        }

        //init for player1
        for (let i = 0; i < Math.floor((this.size - 2) / 2); i++) {
            for (let j = i % 2; j < this.size; j += 2) {
                this.board[i][j] = 1;
            }
        }

        //init for player2
        for (let i = Math.floor((this.size - 2) / 2) + 2; i < this.size; i++) {
            for (let j = i % 2; j < this.size; j += 2) {
                this.board[i][j] = 2;
            }
        }
    }

    isInBorders(row, col) {
        if ((row < 0) || (col < 0) || (row > this.board.length) || (col > this.board.length))
            return false;
        return true
    }

    isPlayerExist(player, currentPosition) {
        return this.board[currentPosition.row][currentPosition.col] === player;
    }

    isEmptyCell(row, col) {
        return this.board[row][col] === 0;
    }

    print() {
        console.log("---------")
        for (let i = 0; i < this.board.length; i++) {
            let line = "|";
            for (let j = 0; j < this.board.length; j++) {
                line += this.board[i][j] + " ";
            }
            line += "|";
            console.log(line);
        }
        console.log("---------")
    }
}

class gameController {
    _board;
    _currentPlayer;
    _size;
    _curPlayer1Pieces;
    _curPlayer2Pieces;

    constructor() {
        this._board = new Board(this._size);
        this._size = 4;
    }

    get currentPlayer() {
        return this._currentPlayer;
    }

    set currentPlayer(value) {
        this._currentPlayer = value;
    }

    get size() {
        return this._size;
    }

    set size(value) {
        this._size = value;
    }

    get curPlayer1Pieces() {
        return this._curPlayer1Pieces;
    }

    set curPlayer1Pieces(value) {
        this._curPlayer1Pieces = value;
    }

    get curPlayer2Pieces() {
        return this._curPlayer2Pieces;
    }

    set curPlayer2Pieces(value) {
        this._curPlayer2Pieces = value;
    }

    get board() {
        return this._board;
    }

    set board(value) {
        this._board = value;
    }

    newGame() {
        this._board.initBoard();
        this._currentPlayer = 1;
        this._curPlayer1Pieces = ((this._size - 2) / 2) * (this._size / 2);
        this._curPlayer2Pieces = ((this._size - 2) / 2) * (this._size / 2);
    }


    getcurrentPlayer() {
        return this._currentPlayer;
    }

    isValidMove(player, move) {
        let dir = player === 1 ? 1 : -1;

        if ((!this._board.isInBorders(move.currentPosition.row, move.currentPosition.col)) ||
            (!this._board.isPlayerExist(player, move.currentPosition)))
            return false;

        if (this.isValidRegularMove(player, move.currentPosition, move.toPosition))
            return true;
        if (this.isValidEatingMove(player, move.currentPosition, move.toPosition))
            return true;
        return false;
    }

    doMove(player, move) {
        if (this.isValidRegularMove(player, move.currentPosition, move.toPosition))
            this._board.setMove(move);

        if (this.isValidEatingMove(player, move.currentPosition, move.toPosition)) {
            let pieceToRemove = new Position(move.currentPosition.row + (move.toPosition.row - move.currentPosition.row) / 2,
                move.currentPosition.col + (move.toPosition.col - move.currentPosition.col) / 2);
            // TODO אולי להעביר את המתודות שלהלן לכאן
            this._board.setMove(move);
            this._board.initCell(pieceToRemove);
            if (player === 1)
                this._curPlayer2Pieces--;
            else
                this._curPlayer1Pieces--;
        }
        return this.isWinner();
        //TODO: אולי להכניס את אם יש מנצח כאן
    }

    isWinner() {
        if (this._curPlayer2Pieces === 0)
            return 1;
        if (this._curPlayer1Pieces === 0)
            return 2;
        return 0;
    }

    static blabla() {
        console.log("wr");
    }

    //deprecated
    getOptionalMoves(player, pos) {
        let optionalMoves = [];

        let row = pos.row;
        let col = pos.col;
        let opp = player == 1 ? 2 : 1;
        let dir = player === 1 ? 1 : -1;

        if ((this._board.isInBorders(row + dir, col + 1)) && (this._board.isEmptyCell(row + dir, col + 1)))
            optionalMoves.push(new Position(row + 1, col + 1));
        if ((this._board.isInBorders(row + dir, col - 1)) && (this._board.isEmptyCell(row + dir, col - 1)))
            optionalMoves.push(new Position(row + 1, col - 1));

        if ((this._board.isInBorders(row + dir, col - 1)) && (this._board.board[row + dir][col - 1] === opp))
            if ((this._board.isInBorders(row + dir * 2, col - 2)) && (this._board.isEmptyCell(row + dir * 2, col - 2)))
                optionalMoves.push(new Position(row + dir * 2, col - 2));

        if ((this._board.isInBorders(row + dir, col + 1)) && (this._board.board[row + dir][col + 1] === opp))
            if ((this._board.isInBorders(row + dir * 2, col + 2)) && (this._board.isEmptyCell(row + dir * 2, col + 2)))
                optionalMoves.push(new Position(row + dir * 2, col + 2));

        return optionalMoves;
    }

    isValidRegularMove(player, curPos, targetPos) {
        let row = curPos.row;
        let col = curPos.col;
        let dir = player === 1 ? 1 : -1;

        if ((this._board.isInBorders(row + dir, col + 1)) && (this._board.isEmptyCell(row + dir, col + 1)) &&
            ((targetPos.row === row + dir) && (targetPos.col === col + 1)))
            return true;
        if ((this._board.isInBorders(row + dir, col - 1)) && (this._board.isEmptyCell(row + dir, col - 1)) &&
            ((targetPos.row === row + dir) && (targetPos.col === col - 1)))
            return true;
        return false;
    }

    isValidEatingMove(player, curPos, targetPos) {
        let row = curPos.row;
        let col = curPos.col;
        let opp = player == 1 ? 2 : 1;
        let dir = player === 1 ? 1 : -1;

        if ((this._board.isInBorders(row + dir, col - 1)) && (this._board.board[row + dir][col - 1] === opp))
            if ((this._board.isInBorders(row + dir * 2, col - 2)) && (this._board.isEmptyCell(row + dir * 2, col - 2)))
                if ((targetPos.row === row + dir * 2) && (targetPos.col === col - 2))
                    return true;

        if ((this._board.isInBorders(row + dir, col + 1)) && (this._board.board[row + dir][col + 1] === opp))
            if ((this._board.isInBorders(row + dir * 2, col + 2)) && (this._board.isEmptyCell(row + dir * 2, col + 2)))
                if ((targetPos.row === row + dir * 2) && (targetPos.col === col + 2))
                    return true;

        return false;
    }

    //TODO: לשנות ללהחזיר
    printBoard() {
        this._board.print();
    }
}

let socket = io();
let player, myTurn, gameOver, gameId, playerId;
let g = new gameController();
let movesPlayer = buildMoves();

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

    socket.on("game.begin", data => {
        gameOver = false;
        player = data.player;
        myTurn = data.myTurn;
        gameId = data.gameId;
        g.newGame();
        g.printBoard();

        if (myTurn)
            socket.emit("update.game", g);
        renderTurnMessage();
    });

    socket.on("move.made", function (data, myUpdatedTurn) {
        let move = constructMove(data.move._currentPosition, data.move._toPosition);

        g.doMove(data.player, move);
        console.log("board:");
        g.printBoard();

        //update server only once
        if (!myTurn)
            socket.emit("update.game", g);
        myTurn = myUpdatedTurn;

        if (!g.isWinner()) {
            renderTurnMessage();
        } else {
            gameOver = true;
            renderWinLoseMessage();
        }
    });

    socket.on("opponent.left", function () {
        $("#messages").text("Your opponent left the game.");
        $(".board button").attr("disabled", true);
    });

    socket.on("game.continue", function (data) {
        if (data)
            restoreData(data);
        g.printBoard();
        renderTurnMessage();
    });
});

function makeMove(e) {
    if (gameOver) {
        socket.emit("new.game");
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
    socket.emit("make.move", {
        gameId: gameId,
        player: player,
        move: move,
        game: g
    });

}

function constructMove(curPos, toPos) {
    let curPosition = Object.assign(new Position(), curPos);
    let toPosition = Object.assign(new Position(), toPos);
    return new Move(curPosition, toPosition);
}

function renderTurnMessage() {
    // Disable the board if it is the opponents turn
    if (!myTurn) {
        $("#messages").text("Your opponent's turn");
        $(".board button").attr("disabled", true);
        // Enable the board if it is your turn
    } else {
        $("#messages").text("Your turn.");
        $(".board button").removeAttr("disabled");
    }
}

function renderWinLoseMessage() {
    // Disable the board if it is the opponents turn
    if (myTurn) {
        $("#messages").text("Game over. You lost.");
        $(".board button").removeAttr("disabled", true);
        // Enable the board if it is your turn
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
    g = Object.assign(new gameController(), data.game);
    g.board = Object.assign(new Board(), data.game._board);
    console.log("board is restored!");
}
