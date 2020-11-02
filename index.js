

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
                    id: id,
                    process: newSrtPingPong(id,host,source,destination),
                    host: host,
                    source: source,
                    destination: destination,
                    status: 1,
                    log: ""
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