

const { spawn } = require('child_process');

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

app.get('/', function (req, res) {
    res.send('<div id=root>ROOT</div>')
  })

app.get('/sdp', (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    if(req.query && req.query.port) {
        let port = req.query.port
        srtConfigs.forEach(i => {
            if(i.status != 1) return
            if(port == i.source) {
                // Putting a new SDP in
                i.sdp = req.body
            }
            else if(port == i.destination) {
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
            if(CST.BackupConfig.some(b => b.Id == parseInt(req.query.del))) {
                let idx = CST.BackupConfig.findIndex( (b) => b.Id == parseInt(req.query.del) )
                CST.BackupConfig.splice(idx,1)
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
})
    
app.use('/', express.static(__dirname + '/html'));

let manualPush = (host,source,destination) => {
    let id = g_id++
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

manualPush("",35001,35002)
manualPush("",35101,35102)
manualPush("",35111,35112)
manualPush("",35121,35122)
manualPush("",35131,35132)
manualPush("",35141,35142)
manualPush("",35151,35152)