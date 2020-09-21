const asyncRedis = require("async-redis");
import * as config from './config'

const cache = asyncRedis.createClient(config.redis.redis_port, config.redis.redis_IP);

cache.on("error", function (err) {
    console.log("Error " + err);
});

cache.on('connect', function () {
    console.log('Connected to Redis');
});

export class GameCache {
    constructor() {
    }

    static setGame = async (gameId: string, game:string): Promise<boolean> => {
        try {
            return await cache.set(config.redis.redis_root_key + gameId, JSON.stringify(game));
        } catch (e) {
            console.log("Error while trying to save game: " + gameId + " to cache");
            return false;
        }
    };

    static getGame = async (gameId:string) => {
        try {
            let game = JSON.parse(await cache.get(config.redis.redis_root_key + gameId));
            if(game === null)
                console.log("Error while trying to get game: " + gameId + " from cache:");
            return game;

        } catch (e) {
            console.log("Error while trying to get game: " + gameId + " from cache:" + e.message);
        }
    }
}