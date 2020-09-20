import * as bla from './cac.js';

async function f() {
    console.log(await bla.getGameByGameId("90"));
}
f();