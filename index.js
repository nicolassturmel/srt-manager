

const { spawn } = require('child_process');
var http = require('http')
const WebSocket = require('ws');
const { Worker } = require('worker_threads')

var newSrtPingPong = (id,srcHost,srcPort,localPort,passphrase) => {
    let srt
    if(passphrase) {
        if(passphrase.length < 10)
            passphrase = passphrase.padStart(10,'0')
        console.log("passphrase: " + passphrase)
        srt = spawn("srt-live-transmit",["srt://"+srcHost+":"+srcPort+"?passphrase="+passphrase+"&enforcedencryption=true","srt://:" + localPort+"?passphrase="+passphrase+"&enforcedencryption=true"])}
    else {
        console.log("no passprase")
        srt = spawn("srt-live-transmit",["srt://"+srcHost+":"+srcPort+"?rcvlatency=200","srt://:" + localPort])
    }
    srt.stdout.on('data', (data) => {
        console.log(id + ` stdout: ${data}`);
      });
    
      srt.stderr.on('data', (data) => {
        console.log(id + ` `+ localPort + " " + srcPort + " " + "stderr: ${data}");
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1 && data) {
            let str = "" + `${data}`
            sss[0].log += str.replace(/\n/g,"<br>")

            let lasts = sss[0].log.split("<br>")
            for(let lineIndex = 0; lineIndex < 4; lineIndex++)
            {
                let last = lasts[lasts.length-4+lineIndex]
                console.log("----> " + last)
                switch(last) {
                    case "Accepted SRT target connection":
                        sss[0].target_state = true;
                        break;
                    case "Accepted SRT source connection":
                        sss[0].source_state = true;
                        break;
                    case "SRT target disconnected":
                        sss[0].target_state = false;
                        break;
                    case "SRT source disconnected":
                        sss[0].source_state = false;
                        break;
                    default:
                        break
                }
            }
            if(lasts.length > 100) {
                lasts[10] = "---! log has been cut here !---"
                sss[0].log = lasts.splice(11,lasts.length-90).join("<br>")
            }
        }
      });

      srt.on('exit',() => {
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1) {
            sss[0].status = 0
        }
      })
    return srt
}

let RtpReceivers = []
var newSrtPingPongDerivate = (id,srcHost,srcPort,localPort,passphrase,madd) => {
    let srt

    let mport = madd.split(".")[2]*256+parseInt(madd.split(".")[3])
    if(passphrase) {
        if(passphrase.length < 10)
            passphrase = passphrase.padStart(10,'0')
        console.log("passphrase: " + passphrase)
        srt = spawn("srt-live-transmit-derivate",["srt://"+srcHost+":"+srcPort+"?passphrase="+passphrase+"&enforcedencryption=true","srt://:" + localPort+"?passphrase="+passphrase+"&enforcedencryption=true","udp://" + madd + ":"+mport+"?adapter=127.0.0.1"])}
    else {
        console.log("no passprase")
        srt = spawn("srt-live-transmit-derivate",["srt://"+srcHost+":"+srcPort+"?rcvlatency=150","srt://:" + localPort,"udp://" + madd + ":"+mport+"adapter=127.0.0.1"])
    }

    launchRtpReceiver(id)
    params = {
        maddress: madd,
        host: "127.0.0.1",
        port: mport,
        codec: "L24",
        channels: 2,
        buuferLength: 0.5,
        offset: 0,     
        id: id   
      }
      RtpReceivers[id].postMessage({
        type: "restart",
        data: params
      })


    srt.stdout.on('data', (data) => {
        console.log(id + ` stdout: ${data}`);
      });
    
      srt.stderr.on('data', (data) => {
        console.log(id + ` `+ localPort + " " + srcPort + " " + "stderr: ${data}");
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1 && data) {
            let str = "" + `${data}`
            sss[0].log += str.replace(/\n/g,"<br>")

            let lasts = sss[0].log.split("<br>")
            for(let lineIndex = 0; lineIndex < 4; lineIndex++)
            {
                let last = lasts[lasts.length-4+lineIndex]
                console.log("----> " + last)
                switch(last) {
                    case "Accepted SRT target connection":
                        sss[0].target_state = true;
                        break;
                    case "Accepted SRT source connection":
                        sss[0].source_state = true;
                        break;
                    case "SRT target disconnected":
                        sss[0].target_state = false;
                        break;
                    case "SRT source disconnected":
                        sss[0].source_state = false;
                        break;
                    default:
                        break
                }
            }
            if(lasts.length > 100) {
                lasts[10] = "---! log has been cut here !---"
                sss[0].log = lasts.splice(11,lasts.length-90).join("<br>")
            }
        }
      });

      srt.on('exit',() => {
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1) {
            sss[0].status = 0
        }
      })
    return srt
}

var g_id = 0
var srtConfigs = []
// srtConfigs.push({
//     id: 70,
//     process: newSrtPingPong(70,"smh.sturmel.com",35111,35112),
//     host: "smh.sturmel.com",
//     source: 35111,
//     destination: 35112,
//     status: 1
// })  

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const { kill } = require('process');


app.use(bodyParser.text());
const server = http.createServer(app);

let wss,
    wss2;

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
  
    if (pathname === '/pcm') {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/stats') {
      wss2.handleUpgrade(request, socket, head, function done(ws) {
        wss2.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  function openSocket() {
    wss2 = new WebSocket.Server({ noServer: true });
    console.log('Server ready...');
    wss2.on('connection', function connection(ws) {
          console.log('Socket connected...');
          ws.on('message',(m) => {
            let msg = JSON.parse(m)
            console.log(m,msg)
            switch(msg.type) {
              case "clear":
                Object.keys(RtpReceivers).forEach(k => RtpReceivers[k].postMessage({type: "clear"}))
                break
              default:
                console.log("Unprocessed " + msg.type)
                break
            }
          })
          ws.on("error",() => console.log("You got halted due to an error"))
          ws.send(JSON.stringify(
            {
            }
          ))
    });
  }

  openSocket()

app.get('/', function (req, res) {
    res.send('<div id=root>ROOT</div>')
  })

app.post('/sdp', (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    if(req.query && req.query.port) {
        let port = req.query.port
        srtConfigs.forEach(i => {
            console.log(i.status,i.source)
            if(i.status != 1) return
            if(port == i.source) {
                // Putting a new SDP in
                console.log(req.body)
                i.sdp = req.body
                res.send(i.sdp)
            }
        })
    }
})

app.get('/sdp', (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    if(req.query && req.query.port) {
        let port = req.query.port
        srtConfigs.forEach(i => {
            if(i.status != 1) return
            if(port == i.destination) {
                // Sending the SDP
                res.send(i.sdp)
            }
        })
    }
})

app.get('/status', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    let Errors = []
    if(req.query) {
        console.log(JSON.stringify(req.query))
        if(req.query.add && req.query.add == 1) {
            if(req.query.host,req.query.source,req.query.destination) {
                let id = g_id++;
                let host = req.query.host
                let source = req.query.source
                let destination = req.query.destination
                let passphrase = req.query.passphrase 

                srtConfigs.push({
                    mode: "pingpong",
                    id: id,
                    process: newSrtPingPong(id,host,source,destination,passphrase),
                    name: req.name,
                    host: host,
                    source: source,
                    destination: destination,
                    status: 1,
                    log: "",
                    source_state: false,
                    target_state: false,
                    passphrase: passphrase? true : false
                })  
            }
        }
        if(req.query.add && req.query.add == 2) {   // udp in, srt out
            if(req.query.streamIP,req.query.streamPORT,req.query.adapter,req.query.host,req.query.destination) {
                let id = g_id++;
                let input = req.query.streamIP + ":" + req.query.streamPORT + "?adapter=" + req.query.adapter
                let output = req.query.host + ":" + req.query.destination

                srtConfigs.push({
                    mode: "udptosrt",
                    id: id,
                    process: newUdpToSrt(id,input,output),
                    input: inout,
                    outout: output,
                    status: 1,
                    log: "",
                    target_state: false
                })  
            }
        }
        if(req.query.add && req.query.add == 3) {   // srt in, udp out
            if(req.query.streamIP,req.query.streamPORT,req.query.adapter,req.query.host,req.query.destination) {
                let id = g_id++;
                let output = req.query.streamIP + ":" + req.query.streamPORT + "?adapter=" + req.query.adapter
                let input = req.query.host + ":" + req.query.destination

                srtConfigs.push({
                    mode: "srttoudp",
                    id: id,
                    process: newUdpToSrt(id,input,output),
                    input: inout,
                    outout: output,
                    status: 1,
                    log: "",
                    source_state: false
                })  
            }
        }
        if(req.query.del) {
            let item = srtConfigs.filter(e => e.id == req.query.del)[0]
            if(item) {
                item.process.kill()
                let id = srtConfigs.findIndex(e => e.id == item.id)
                srtConfigs.splice(id,1)
            }
            else Errors.push("Did not find Id to delete")
        }
        else Errors.push("Id does not match")
    }

    let toSend = JSON.parse(JSON.stringify(srtConfigs))
    toSend.forEach(d => {
        d.process=null
    })
    res.send(JSON.stringify(toSend))
})
    

app.listen(80, function () {
      console.log('Example app listening on port 80!')
      console.log('Example app listening on port 30080!')
})
    
app.use('/', express.static(__dirname + '/html'));

let manualPush = (host,source,destination,name,madd) => {
    let id = g_id++
    srtConfigs.push({
        mode: "pingpong",
        id: id,
        process: newSrtPingPongDerivate(id,host,source,destination,undefined,madd),
        derivate: madd,
        host: host,
        source: source,
        name: name,
        destination: destination,
        status: 1,
        log: "",
        source_state: false,
        target_state: false
    })  
}

// Sending rtp data
function sendData(struct) {
    struct.buffer = null
    console.log(struct)
    wss2.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "stats",
            data: struct
          }));
      }
    });
}

var launchRtpReceiver = (id) =>
{
  var worker = new Worker("./rtp-worker.js")
  worker.on('online', () => { 
    // worker.postMessage({
    //   type: "start",
    //   data: {
    //     maddress: sdp.connection.ip.split("/")[0],
    //     host: host,
    //     port: sdp.media[0].port,
    //     codec: "L24",
    //     channels: 2,
    //     buuferLength: 0.05,
    //     offset: (sdp.media && sdp.media.length>0 && sdp.media[0].mediaClk && sdp.media[0].mediaClk.mediaClockName == "direct")? sdp.media[0].mediaClk.mediaClockValue : 0
    //   }
    // })
    console.log('One more worker') 
  })
  worker.on('message',(k) => {
    switch(k.type) {
      case "data":
        sendData(k.data)
        break
      default:
        break
    }
  })
  RtpReceivers[id] = worker
}

manualPush("",35001,35002,"no  name","239.100.100.1")
manualPush("",35101,35102,"no  name","239.100.100.2")
manualPush("",35111,35112,"ROSS test","239.100.100.3")
manualPush("",35121,35122,"DO test","239.100.100.4")
manualPush("",35131,35132,"GDS1","239.100.100.5")
manualPush("",35141,35142,"GDS2","239.100.100.6")
manualPush("",35123,35124,"GDS3","239.100.100.7")
manualPush("",35133,35134,"GDS4","239.100.100.8")
manualPush("",35151,35152,"Pyramix NSL","239.100.100.9")
