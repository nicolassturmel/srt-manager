

const { spawn } = require('child_process');
const os = require('os');
var dgram = require('dgram'); 
const sdpTransform = require('sdp-transform');
const http = require('http')
const ipInt = require('ip-to-int');
let sdpCollections = []
var clientSAP = null

let selectedDevice = null;
let SendSockets = []
var getInterfaces = () => {
    var netInt = os.networkInterfaces()
    let addresses = []
    Object.keys(netInt).forEach(i => {
        let ip4 = netInt[i].filter(k => k.family == "IPv4")
        if(ip4.length > 0)
        ip4.forEach(p => {
            addresses.push({
            name: i,
            ip: p.address,
            mask: p.netmask,
            selected: selectedDevice==p.address
            })
        })
    })
    return addresses
}

let madd = '239.255.255.255'
let port = 9875

getInterfaces().forEach(i => {
    console.log("One interface",i.ip)
    let host = i.ip
    SendSockets[host] = dgram.createSocket({ type: "udp4", reuseAddr: true });

    SendSockets[host].on('listening', function () {
        console.log('UDP Client listening on ' + madd + ":" + port + " from " + host);
        SendSockets[host].setBroadcast(true)
        SendSockets[host].setMulticastTTL(12); 
        SendSockets[host].addMembership(madd,host);
    });

    SendSockets[host].bind(port,host);
})


setInterval(() => {
    // Sends SAP announces
    return
    srtConfigs.forEach(i => {
        //console.log("testing",i)
        if(i.mode == "srttoudp") {
            let server = i.input.split(":")[0]
            let port = i.input.split(":")[1]
            try {
                http.get("http://" + server + "/sdp?port=" + port, res => {
                    console.log(`statusCode: ${res.statusCode}`)
                    let data=""
                    res.on('data', d => {
                        data+=d
                    })
                    res.on('end', () => {
                        let Header = Buffer.alloc(8)
                        Header.writeInt8(32,0)
                        Header.writeInt8(0x00,1)
                        Header.writeUInt16BE(port,2)

                        console.log(i)
                        let elems = i.outout.split("?adapter=")
                        let host = elems[1]
                        let mdst = elems[0].split(":")[0]
                        let mport = elems[0].split(":")[1] || 5004


                        Header.writeUInt32BE(ipInt(host).toInt(),4)

                        if(data) {
                            let lines = data.split("\r\n")

                            lines.forEach((v, i) => {
                                // Changing dst address
                                if(v.startsWith("c=IN IP4")) 
                                    lines[i] = "c=IN IP4 " + mdst + "/1"
                                // Changing dst port
                                if(v.startsWith("m=audio"))
                                    lines[i] = "m=audio " + mport + " RTP/AVP" + v.split("RTP/AVP")[1]

                                // Changing source address
                                if(v.startsWith("o="))
                                    lines[i] = v.split("IP4")[0] + "IP4 " + host
                                if(v.startsWith("a=source-filter: incl IN IP4"))
                                    lines[i] = "a=source-filter: incl IN IP4 " + mdst + " " + host

                                // Insert stream name suffix
                                if(v.startsWith("s="))
                                    lines[i] += "-SRT:" + port
                            })

                            data = lines.join("\r\n")
                        }
                        let Msg = Buffer.concat([Header, Buffer.from("application/sdp"), Buffer.from(data || "missing")])

                        if(SendSockets[host]) SendSockets[host].send(Msg, 0 , Msg.length, 9875, "239.255.255.255", () => console.log("Sent message"))
                        else console.log("No socket for ",host)
                    })
                })
            }
            catch(e) {
                console.log("Could not get SDP")
            }
            


            
        }
    })
},15000)

function getSAP(host) {
  if(clientSAP) clientSAP.close()

  let madd = '239.255.255.255'
  let port = 9875
  clientSAP = dgram.createSocket({ type: "udp4", reuseAddr: true });

  clientSAP.on('listening', function () {
      console.log('UDP Client listening on ' + madd + ":" + port);
      clientSAP.setBroadcast(true)
      clientSAP.setMulticastTTL(128); 
      clientSAP.addMembership(madd,host);
  });

  var removeSdp = (name) => {
     let id = sdpCollections.findIndex((k) => {k.name == name;})
     if(id >= 0) {
        sendSDP(sdpCollections[id].sdp,"remove")
       sdpCollections.splice(id,1)
     }
  }

  clientSAP.on('message', function (message, remote) {
    console.log(message.toString())
    let sdp = sdpTransform.parse(message.toString().split("application/sdp")[1])
    sdp.raw = message.toString().split("application/sdp")[1]
    let timer = setTimeout( () => {
      removeSdp(sdp.name)
    } , 45000)
    if(!sdpCollections.some(k => k.name == sdp.name)) {
      sdpCollections.push({
        sdp: sdp,
        timer: timer,
        name: sdp.name
      })
    }
    else {
      let item = sdpCollections.filter(k => k.name == sdp.name)[0]
      item.timer.refresh()
      item.sdp = sdp
    }
    //console.log(sdp.name,sdp.media[0].rtp)
    
  })


  clientSAP.bind(port);
}



var chooseInterface = (add) => {
    sdpCollections.forEach((id) => {
        
    })
    sdpCollections = []
    getSAP(add)
    selectedDevice = add
}

var getInterfaces = () => {
    var netInt = os.networkInterfaces()
    let addresses = []
    Object.keys(netInt).forEach(i => {
        let ip4 = netInt[i].filter(k => k.family == "IPv4")
        if(ip4.length > 0)
        ip4.forEach(p => {
            addresses.push({
            name: i,
            ip: p.address,
            mask: p.netmask,
            selected: selectedDevice==p.address
            })
        })
    })
    return addresses
}

var newSrtPingPong = (id,srcHost,srcPort,localPort) => {
    let srt = spawn("srt-live-transmit",["srt://"+srcHost+":"+srcPort,"srt://:" + localPort])
    srt.stdout.on('data', (data) => {
        console.log(id + `stdout: ${data}`);
      });
    
      srt.stderr.on('data', (data) => {
        console.log(id + `stderr: ${data}`);
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1 && data) {
            let str = "" + `${data}`
            sss[0].log += str.replace(/\n/g,"<br>")

            let lasts = sss[0].log.split("<br>")
            let last = lasts[lasts.length-2]
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
      });

      srt.on('exit',() => {
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1) {
            sss[0].status = 0
        }
      })
    return srt
}

var newSrtToUdp = (id,input,output) => {
    let srt = spawn("srt-live-transmit",["srt://"+input,"udp://" + output])
    srt.stdout.on('data', (data) => {
        console.log(id + `stdout: ${data}`);
      });
    
      srt.stderr.on('data', (data) => {
        console.log(id + `stderr: ${data}`);
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1 && data) {
            let str = "" + `${data}`
            sss[0].log += str.replace(/\n/g,"<br>")

            let lasts = sss[0].log.split("<br>")
            let span = Math.min(4, lasts.length)
            for(let lineIndex = 0; lineIndex < span; lineIndex++)
            {
                let last = lasts[lasts.length-span+lineIndex]
                console.log("----> |" + last + "|") 
                switch(last) {
                    case "SRT target connected":
                        console.log("Bim")
                        sss[0].target_state = true;
                        break;
                    case "SRT source connected":
                        console.log("Bam")
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


var newUdpToSrt = (id,input,output) => {
    let srt = spawn("srt-live-transmit",["udp://"+input,"srt://" + output])
    srt.stdout.on('data', (data) => {
        console.log(id + `stdout: ${data}`);
      });
    
      srt.stderr.on('data', (data) => {
        console.log(id + `stderr: ${data}`);
        let sss = srtConfigs.filter((s) => s.id == id)
        if(sss.length == 1 && data) {
            let str = "" + `${data}`
            sss[0].log += str.replace(/\n/g,"<br>")

            let lasts = sss[0].log.split("<br>")
            let span = Math.min(4, lasts.length)
            for(let lineIndex = 0; lineIndex < span; lineIndex++)
            {
                let last = lasts[lasts.length-span+lineIndex]
                console.log("----> |" + last + "|") 
                switch(last) {
                    case "SRT target connected":
                        console.log("Bim")
                        sss[0].target_state = true;
                        break;
                    case "SRT source connected":
                        console.log("Bam")
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


app.use(bodyParser.text());

app.get('/', function (req, res) {
    res.send('<div id=root>ROOT</div>')
  })

app.get('/status', function (req, res) {
    let Errors = []
    if(req.query) {
        console.log(JSON.stringify(req.query))
        if(req.query.add && req.query.add == 1) {
            if(req.query.host,req.query.source,req.query.destination) {
                let id = g_id++;
                let host = req.query.host
                let source = req.query.source
                let destination = req.query.destination

                srtConfigs.push({
                    mode: "pingpong",
                    id: id,
                    process: newSrtPingPong(id,host,source,destination),
                    host: host,
                    source: source,
                    destination: destination,
                    status: 1,
                    log: "",
                    source_state: false,
                    target_state: false
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
                    input: input,
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
                    process: newSrtToUdp(id,input,output),
                    input: input,
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
    
app.get('/interfaces', (req, res) => {
    res.send(JSON.stringify(getInterfaces()))
})

app.get('/sessions', (req, res) => {
    let time = 10
    if(req.query.interface) {
        chooseInterface(req.query.interface)
        time = 30000
    }
    setTimeout(() => {
        let out = []
        sdpCollections.forEach(c => out.push(c.sdp))
        res.send(JSON.stringify(out))
    },time)
})

app.post('/sdp', (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    if(req.query && req.query.id) {
        let id = req.query.id
        srtConfigs.forEach(i => {
            console.log(i.status,i.id)
            if(i.status != 1) return
            if(id == i.input) {
                // Putting a new SDP in
                console.log(req.body)
                i.sdp = req.body
                res.send(i.sdp)
            }
        })
    }
})

app.listen(8045, function () {
      console.log('listening on port 8045!')
})
    
app.use('/', express.static(__dirname + '/html'));

let manualPush = (ggg,input,output) => {
    let id = g_id++;
                srtConfigs.push({
                    mode: "udptosrt",
                    id: id,
                    process: newUdpToSrt(id,input,output),
                    input: input,
                    outout: output,
                    status: 1,
                    log: "",
                    target_state: false
                }) 
}
let manualPush2 = (ggg,input,output) => {
    let id = g_id++;
                srtConfigs.push({
                    mode: "srttoudp",
                    id: id,
                    process: newSrtToUdp(id,input,output),
                    input: input,
                    outout: output,
                    status: 1,
                    log: "",
                    source_state: false
                }) 
}

manualPush(1,"239.1.1.135:5004?adapter=192.168.1.162","18.193.110.254:35111")
manualPush(2,"239.1.1.135:5004?adapter=192.168.1.162","18.193.110.254:35121")
manualPush(3,"239.1.1.135:5004?adapter=192.168.1.162","18.193.138.129:35111?latency=500ms")
manualPush(4,"239.1.1.135:5004?adapter=192.168.1.162","18.193.138.129:35121")
manualPush(5,"239.1.1.135:5004?adapter=192.168.1.162","18.193.138.129:35001")
manualPush(6,"239.1.1.135:5004?adapter=192.168.1.162","18.193.110.254:35001")
manualPush2(7,"18.193.110.254:35002","239.9.9.1:5004?adapter=192.168.1.162")
  