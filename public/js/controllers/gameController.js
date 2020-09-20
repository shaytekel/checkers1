import {Board} from "../models/board.js";
import {Position} from "../models/position.js";

export class GameController  {
    _board;
    _currentPlayer;
    _size;
    _curPlayer1Pieces;
    _curPlayer2Pieces;

    constructor() {
        this._size = 4;
        this._board = new Board(this._size);
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

    isValidMove(player, move) {
        if ((!this._board.isInBorders(move.currentPosition.row, move.currentPosition.col)) ||
            (!this._board.isPlayerExist(player, move.currentPosition)))
            return false;

        if (this.isValidRegularMove(player, move.currentPosition, move.toPosition))
            return true;
        return this.isValidEatingMove(player, move.currentPosition, move.toPosition);

    }

    doMove(player, move) {
        if (this.isValidRegularMove(player, move.currentPosition, move.toPosition))
            this._board.setMove(move);

        if (this.isValidEatingMove(player, move.currentPosition, move.toPosition)) {
            let pieceToRemove = new Position(move.currentPosition.row + (move.toPosition.row - move.currentPosition.row) / 2,
                move.currentPosition.col + (move.toPosition.col - move.currentPosition.col) / 2);
            this._board.setMove(move);
            this._board.initCell(pieceToRemove);
            if (player === 1)
                this._curPlayer2Pieces--;
            else
                this._curPlayer1Pieces--;
        }
        return this.isWinner();
    }

    isWinner() {
        if (this._curPlayer2Pieces === 0)
            return 1;
        if (this._curPlayer1Pieces === 0)
            return 2;
        return 0;
    }

    isValidRegularMove(player, curPos, targetPos) {
        let row = curPos.row;
        let col = curPos.col;
        let dir = player === 1 ? 1 : -1;

        if ((this._board.isInBorders(row + dir, col + 1)) && (this._board.isEmptyCell(row + dir, col + 1)) &&
            ((targetPos.row === row + dir) && (targetPos.col === col + 1)))
            return true;
        return !!((this._board.isInBorders(row + dir, col - 1)) && (this._board.isEmptyCell(row + dir, col - 1)) &&
            ((targetPos.row === row + dir) && (targetPos.col === col - 1)));

    }

    isValidEatingMove(player, curPos, targetPos) {
        let row = curPos.row;
        let col = curPos.col;
        let opp = player === 1 ? 2 : 1;
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

    printBoard() {
        this._board.print();
    }
}