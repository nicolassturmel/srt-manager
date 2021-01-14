var WebSocket = require('ws');

var sessionList = []
var ws = null

var run = (server,hostId) => {
    try {
        ws = new WebSocket(server, {
            perMessageDeflate: false
        });
    
        ws.on('message',(m) => {
            try {
                let jm = JSON.parse(m)
                if(jm.register) {
                    if(!sessionList.some(e => e == jm.register))
                        sessionList.push(register)
                }
            }
            catch(e) {
    
            }
        })
        ws.on('error',() => {
            console.log("Error when connecting WS: " + server)
        })
        ws.on('close', () => {
            setTimeout(() => run(server,hostId),1000)
            ws = null
        })
    }
    catch(e) {
        console.log(e)
        setTimeout(() => run(server,hostId),1000)
    }
    
}

var send = (sessionId,data) => {
    if(1) //sessionList.some(e => e == sessionId)) 
    {
        console.log("Sending status")
        if(ws && ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({
                type: "session",
                session: sessionId,
                data: data
            }))
        else
            console.log("no ws")
    }
}

module.exports = {
    run: run,
    send: send
}


