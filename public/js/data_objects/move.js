export class Move {
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