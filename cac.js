// const redis = require('redis');
import * as asyncRedis from 'async-redis';
const cache = asyncRedis.createClient();

cache.on("error", function (err) {
    console.log("Error " + err);
});


const asyncBlock = async () => {
    // await setGameByGameId("555", {first: "shay", second: "tekel"});
    const value = getGameByGameId("c85d7fef-7787-4d19-8211-56c1a3c9b075").then(console.log);
    console.log(4)
}
asyncBlock();

async function getValue(key) {
    return cache.get(key, (err, replay) => {
        if (err) console.log("ERROR" + err);
        console.log(replay);
        return replay;
    })
}

// created new Game: c85d7fef-7787-4d19-8211-56c1a3c9b075. player aeb1aa57-268a-4f7c-9522-908152f56e0a joined to this game.
//     GameId: c85d7fef-7787-4d19-8211-56c1a3c9b075
// PlayerId: aeb1aa57-268a-4f7c-9522-908152f56e0a
// socket connected
// player e9787ce2-a89b-4812-9634-8fc95de5d6f7 joined game: c85d7fef-7787-4d19-8211-56c1a3c9b075
// GameId: c85d7fef-7787-4d19-8211-56c1a3c9b075
// PlayerId: e9787ce2-a89b-4812-9634-8fc95de5d6f7

export async function getGameByGameId(gameId) {
    return JSON.parse(await cache.get(gameId));
}

export async function setGameByGameId(gameId, game) {
    return await cache.set(gameId, JSON.stringify(game));
}

