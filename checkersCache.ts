const asyncRedis = require("async-redis");
const cache = asyncRedis.createClient();
cache.on("error", function (err) {
    console.log("Error " + err);
});

cache.on('connect', function () {
    console.log('Connected to Redis');
});

export class CheckersCache {
    constructor() {
    }

    async setGame(gameId, game) {
        try {
            await cache.set(gameId, JSON.stringify(game));
        } catch (e) {
            console.log("Error while trying to save game: " + gameId + " to cache");
        }
    }

    async getGame(gameId) {
        try {
            let parse = JSON.parse(await cache.get(gameId));
            return parse;

        } catch (e) {
            console.log("Error while trying to get game: " + gameId + " from cache");
        }
    }
}

let c = new CheckersCache();

async function f() {
    console.log(await c.setGame("90", {bla: "Bw"}));
    console.log(await c.getGame("90"));
}


f().then(r => console)


