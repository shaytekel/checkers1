export class Player{
    private _opponent: string;
    private _player: number;
    private _socketId: string;
    private _myTurn: boolean;


    constructor(opponent: string, player: number, socketId: string, myTurn: boolean) {
        this._opponent = opponent;
        this._player = player;
        this._socketId = socketId;
        this._myTurn = myTurn;
    }


    get opponent(): string {
        return this._opponent;
    }

    set opponent(value: string) {
        this._opponent = value;
    }

    get player(): number {
        return this._player;
    }

    set player(value: number) {
        this._player = value;
    }

    get socketId(): string {
        return this._socketId;
    }

    set socketId(value: string) {
        this._socketId = value;
    }

    get myTurn(): boolean {
        return this._myTurn;
    }

    set myTurn(value: boolean) {
        this._myTurn = value;
    }
}