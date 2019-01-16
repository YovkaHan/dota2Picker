import openSocket from 'socket.io-client';

const socket_count = 0;

export default function Socket() {
    const socket = openSocket(SERVER);

    function todoListGet(next, whenError){
        socket.emit('todo-list get');

        socket.on('todo-list get/result', (result)=>{
            next(result);
        });
        socket.on('todo-list get/error', (error)=>{
            whenError(error)
        })
    }

    function heroesGet(next, whenError){
        socket.emit('heroes get');

        socket.on('heroes get/result', (result)=>{
            next(result);
        });
        socket.on('heroes get/error', (error)=>{
            whenError(error)
        })
    }

    function heroesAdvStatGet(next, whenError){
        socket.emit('heroes-adv-stat get');

        socket.on('heroes-adv-stat get/result', (result)=>{
            next(result);
        });
        socket.on('heroes-adv-stat get/error', (error)=>{
            whenError(error)
        })
    }

    function heroesWinStatGet(next, whenError){
        socket.emit('heroes-win-stat get');

        socket.on('heroes-win-stat get/result', (result)=>{
            next(result);
        });
        socket.on('heroes-win-stat get/error', (error)=>{
            whenError(error)
        })
    }

    function onDisconnect(){
        return new Promise(function (resolve,reject) {
            socket.emit('shut up!');

            socket.on('disconnected', (result)=>{
                socket.emit('disconnect');
                resolve(result);
            });
        });
    }

    return {
        todoListGet,
        heroesGet,
        heroesAdvStatGet,
        heroesWinStatGet,
        onDisconnect
    }
}

