export class Board {
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
