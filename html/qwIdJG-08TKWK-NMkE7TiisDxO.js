
let ctttt = 0

var post = (uri,payload) => {
    return new Promise((resolve, reject) => {
        fetch(uri, {
            method: 'post',
            body: payload
          }).then(function(response) {
            return response.blob()
          }).then(function(response) {
            return response.text();
          }).then(resolve)
          .catch(reject)
    })
  }


var getRequest = (uri) => {
    return new Promise((resolve, reject) => {
        console.log("GET ",uri)
        fetch(uri)
        .then(function(response) {
            return response.blob()
        })
        .then(function(response) {
            return response.text()
        })
        .then(data => {
            console.log(data)
            resolve(data)
        })
        .catch(reject)

        setTimeout(() => resolve(""),1000)
    })
}

var getme = (uri,reask) => {
    //console.log(uri)
    let contIn = document.getElementById("container")
    fetch(uri)
    .then(function(response) {
        return response.blob()
    })
    .then(function(response) {
        return response.text()
    })
    .then(function (blob) {
        //console.log(blob)
        document.getElementById("debug").innerHTML = blob
        let X = JSON.parse(blob)
        //console.log(X)

        let plus = document.getElementById("pluselem") 
        if(!plus) {
            plus = document.createElement("div")
            plus.innerHTML = "+ receive a new stream (srt -> rtp)"
            plus.className = "backup-config-container"
            plus.id = "pluselem"
            plus.onclick = overRstRtp
            contIn.append(plus)
        }
        let plus2 = document.getElementById("pluselem2") 
        if(!plus2) {
            plus2 = document.createElement("div")
            plus2.innerHTML = "+ send a new stream (rtp -> srt)"
            plus2.className = "backup-config-container"
            plus2.id = "pluselem2"
            plus2.onclick = overRtpRst
            contIn.append(plus2)
        }
        let plus3 = document.getElementById("pluselem3") 
        if(!plus3) {
            plus3 = document.createElement("div")
            plus3.innerHTML = "+ relay"
            plus3.className = "backup-config-container"
            plus3.id = "pluselem3"
            plus3.onclick = rstRelay
            contIn.append(plus3)
        }
        let plus4 = document.getElementById("pluselem4") 
        if(!plus4) {
            plus4 = document.createElement("div")
            plus4.innerHTML = "+ derivate"
            plus4.className = "backup-config-container"
            plus4.id = "pluselem4"
            plus4.onclick = rstDerivate
            contIn.append(plus4)
        }

        X.forEach(element => {
            let E = document.getElementById("container-" + element.id)
            if(!E) {
                E = document.createElement("div")
                E.className = "backup-config-container"
                E.id = "container-" + element.id

            }
            E.innerHTML = ""
            createSrt(element,E,element)
            contIn.insertBefore(E,plus)
        });
        let existingElements = contIn.children;
        for(let c = 0; c < existingElements.length ; c++) {
            if(existingElements[c].id.startsWith("container")) {
                if(X.some(u => u.id == existingElements[c].id.split("-")[1]))
                    {}
                else
                    existingElements[c].outerHTML = ""
            }
        }
    });
    if(reask)
        setTimeout(() => getme(uri,reask),2000)
}

window.addEventListener('load', function() {
    getme('status',true)
    console.log('All assets are loaded')
})

let states = {}

var createSrt = (B,container,data) => {
    // Create list of options for devices
    let x = document.createElement("div")
    container.classList.remove("stopped")
    container.classList.remove("gray")
    container.classList.remove("orange")
    let Name = document.createElement("div")
    let prefix = 0
    switch(data.mode) {
        case "pingpong":
            prefix = "Relay: "
            break;
        default:
            break;
    }
    if(data.derivate) prefix = "Derivate (" + data.derivate + ") " + prefix
    Name.innerHTML = prefix + data.name
    Name.className = "name"
    container.appendChild(Name)
    if(data.mode == "srttoudp") {
        x.innerHTML = "SRT -> UDP " + data.input + " to " + data.outout
        if(data.status == 0) {
            container.classList.add("stoped")
            x.innerHTML = "process has ended"
        }
        else if(!data.source_state ) container.classList.add("orange")
    }
    else if(data.mode == "udptosrt") {
        x.innerHTML = "UDP -> SRT" + data.input + " to " + data.outout
        if(data.status == 0) {
            container.classList.add("stoped")
            x.innerHTML = "process has ended"
        }
        else if(!data.target_state ) container.classList.add("orange")
    }
    else {
        if(data.source_state)
            x.innerHTML = " Send data to :" + data.source + " (connected)"
        else
            x.innerHTML = " Send data to :" + data.source      + " (waiting connection)"
        if(data.target_state)
            x.innerHTML  += " ->  Receive data from :" + data.destination + " (connected)"
        else
            x.innerHTML  += " ->  Receive data from :" + data.destination + " (waiting connection)"

        if(data.status == 0) {
            container.classList.add("stoped")
            x.innerHTML = "process has ended"
        }
        else if(!data.source_state &&  !data.target_state) container.classList.add("gray")
        else if(!data.source_state ||  !data.target_state) container.classList.add("orange")
    }
    if(data.passphrase)
        x.innerHTML += "<br>!! This stream is encrypted"
    container.appendChild(x)
    let b = document.createElement("div")
    container.appendChild(b)
    let l = document.createElement("div")
    l.innerHTML = data.log
    container.appendChild(l)
    if(!states[data.id])
        states[data.id] = "hidden"
    l.className = states[data.id]
    b.onclick = () => {
        if(states[data.id] == "hidden") {
            b.innerHTML = "hide log..."
            states[data.id] = "showed"
            l.className = states[data.id]
        }
        else {
            b.innerHTML = "show log..."
            states[data.id] = "hidden"
            l.className = states[data.id]
        }
    }

    if(states[data.id] != "hidden") {
        b.innerHTML = "hide log..."
        states[data.id] = "showed"
        l.className = states[data.id]
    }
    else {
        b.innerHTML = "show log..."
        states[data.id] = "hidden"
        l.className = states[data.id]
    }

    let cross = document.createElement("cross")
    cross.className = "cross"
    cross.innerHTML = "X"
    cross.onclick = () => getme("/status?del=" + data.id)
    container.appendChild(cross)
}

var createInput = (cont,id,text,value) => {
    let contIn = document.createElement("div")
    contIn.id = id
    cont.appendChild(contIn)
    let span = document.createElement("span")
    span.id = id + "-span"
    span.innerHTML = text
    contIn.appendChild(span)
    let input = document.createElement("input")
    input.id = id + "-input"
    input.value = value
    contIn.appendChild(input)

    input.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          // Trigger the button element with a click
          getme(encodeURI("status?" + text + "=" + input.value))
        }
      });
}

var rstDerivate = () => {
    let ov = document.createElement("div")
    ov.id = "overlay"
    document.body.append(ov)
    let ovIn = document.createElement("div")
    ovIn.id = "overlayBox"
    ov.append(ovIn)

    let txt = document.createElement("div")
    txt.innerHTML = "<h1>New SRT relay with derivation</h1>"
    ovIn.append(txt)

    let Name = document.createElement("input")
    Name.placeholder = "relay name"
    let portA = document.createElement("input")
    portA.placeholder = "input port number"
    let portB = document.createElement("input")
    portB.placeholder = "output port number"
    let passphrase = document.createElement("input")
    passphrase.placeholder = "enter passprase"

    ovIn.append(Name)
    ovIn.append(portA)
    ovIn.append(portB)
    ovIn.append(passphrase)


    let cancel = document.createElement("div")
    cancel.innerHTML = "cancel"
    cancel.id = "cancelBtn"
    cancel.onclick = () => ov.outerHTML = ""
    ovIn.append(cancel)
    let ok = document.createElement("div")
    ok.innerHTML = "ok"
    ok.id = "okBtn"
    ovIn.append(ok)

    console.log(portA.value)
    ok.onclick = () => {
        let byteA = parseInt(portA.value)
        let byteB = Math.floor(parseInt(portA.value)/256)
        getme("/status?add=4&host=&source="+portA.value+"&destination="+portB.value+"&name="+Name.value+"&passphrase="+passphrase.value+"&derivate=239.222." + byteB + "." + byteA)
        ov.outerHTML = ""
    }
}
var rstRelay = () => {
    let ov = document.createElement("div")
    ov.id = "overlay"
    document.body.append(ov)
    let ovIn = document.createElement("div")
    ovIn.id = "overlayBox"
    ov.append(ovIn)

    let txt = document.createElement("div")
    txt.innerHTML = "<h1>New SRT relay</h1>"
    ovIn.append(txt)

    let Name = document.createElement("input")
    Name.placeholder = "relay name"
    let portA = document.createElement("input")
    portA.placeholder = "input port number"
    let portB = document.createElement("input")
    portB.placeholder = "output port number"
    let passphrase = document.createElement("input")
    passphrase.placeholder = "enter passprase"

    ovIn.append(Name)
    ovIn.append(portA)
    ovIn.append(portB)
    ovIn.append(passphrase)


    let cancel = document.createElement("div")
    cancel.innerHTML = "cancel"
    cancel.id = "cancelBtn"
    cancel.onclick = () => ov.outerHTML = ""
    ovIn.append(cancel)
    let ok = document.createElement("div")
    ok.innerHTML = "ok"
    ok.id = "okBtn"
    ovIn.append(ok)

    ok.onclick = () => {
        getme("/status?add=1&host=&source="+portA.value+"&destination="+portB.value+"&name="+Name+"&passphrase="+passphrase.value)
        ov.outerHTML = ""
    }

}

var overRstRtp = () => {
    let ov = document.createElement("div")
    ov.id = "overlay"
    document.body.append(ov)
    let ovIn = document.createElement("div")
    ovIn.id = "overlayBox"
    ov.append(ovIn)

    let txt = document.createElement("div")
    txt.innerHTML = "<h1>WAN to Ravenna</h1>"
    ovIn.append(txt)
    let SDPdata = ""
    let host = document.createElement("input")
    host.placeholder = "enter srt source"
    host.onkeydown = (event) => {
        if(event.code === 'Enter') {
            let server = host.value.split(":")[0]
            let port = host.value.split(":")[1]
            console.log(server + " ---->  " + port)
            getRequest("http://" + server + "/status")
            .then(d => {
                try {
                    let J = JSON.parse(d)
                    r = 0
                    J.forEach(i => {
                        if(i.destination == port) {
                            if(i.target_state) {
                                console.log("Source is busy")
                                host.className = "orange"
                                r = 1
                            }
                            else {
                                console.log("Source is free")
                                host.className = "green"
                                console.log("Getting sdp")
                                getRequest("http://" + server + "/sdp?port=" + port).then((data) => {
                                    console.log(data)
                                    SDP.innerHTML =  "<h3>The SDP will be updated and available through SAP</h3><br>" + data.replace(/\n/g,"<br>")
                                    SDPdata = data
                                })
                                r = 1
                            }
                        }
                    })
                    if(!r) { 
                        console.log("Source does not exist")
                        host.className = "stoped"
                    }
                }
                catch(e) {
                    console.log("JSON prse error")
                }
            })
            .catch(() => console.log("Error fectiching server status",server))
        }
    }
    ovIn.append(host)

    let SDP = document.createElement("div")
    SDP.className = "small"
    ovIn.append(SDP)

    let multicast = document.createElement("input")
    multicast.placeholder = "multicast address and port"
    ovIn.append(multicast)


    let sel = document.createElement("select")
    fetch("/interfaces")
    .then(function(response) {
        return response.blob()
    })
    .then(function(response) {
        return response.text()
    })
    .then(function (blob) {
        let ints = JSON.parse(blob)
        let a = document.createElement("option")
        a.innerHTML = "choose an interface"
        sel.append(a)
        ints.forEach(i => {
            console.log(i)
            let a = document.createElement("option")
            a.value = i.ip
            a.innerHTML = i.name + ":" + i.ip
            sel.append(a)
        })
        ovIn.append(sel)
    })



    let cancel = document.createElement("div")
    cancel.innerHTML = "cancel"
    cancel.id = "cancelBtn"
    cancel.onclick = () => ov.outerHTML = ""
    ovIn.append(cancel)
    let ok = document.createElement("div")
    ok.innerHTML = "ok"
    ok.id = "okBtn"
    ovIn.append(ok)

    ok.onclick = () => {
        let rst = host.value.split(":")
        let rtp = multicast.value.split(":")
        getme("/status?add=3&streamIP="+rtp[0]+"&streamPORT="+rtp[1]+"&adapter="+sel.value+"&host="+rst[0]+"&destination="+rst[1])
        ov.outerHTML = ""
    }
}
var overRtpRst = () => {
    let ov = document.createElement("div")
    ov.id = "overlay"
    document.body.append(ov)
    let ovIn = document.createElement("div")
    ovIn.id = "overlayBox"
    ov.append(ovIn)

    let txt = document.createElement("div")
    txt.innerHTML = "<h1>Ravenna to WAN</h1>"
    ovIn.append(txt)


    let sel = document.createElement("select")
    let SDPs = null
    let sessions = document.createElement("select")
    fetch("/interfaces")
    .then(function(response) {
        return response.blob()
    })
    .then(function(response) {
        return response.text()
    })
    .then(function (blob) {
        let ints = JSON.parse(blob)
        let a = document.createElement("option")
        a.innerHTML = "choose an interface"
        sel.append(a)
        ints.forEach(i => {
            console.log(i)
            let a = document.createElement("option")
            a.value = i.ip
            a.innerHTML = i.name + ":" + i.ip
            sel.append(a)
        })
    })


    sel.onchange = () => {
        console.log(sel.value)
        fetch("/sessions?interface="+sel.value)
        .then(function(response) {
            return response.blob()
        })
        .then(function(response) {
            return response.text()
        })
        .then(function (blob) {
            SDPs = JSON.parse(blob)
            SDPs.forEach(i => {
                console.log(i)
                let a = document.createElement("option")
                a.value = JSON.stringify(i)
                a.innerHTML = i.name
                sessions.append(a)
            })
        })
    }
    sessions.onchange = () => SDP.innerHTML = JSON.parse(sessions.value).raw.replace(/\n/g,"<br>")

    let SDP = document.createElement("div")
    SDP.className = "small"
    ovIn.append(sel)
    ovIn.append(sessions)
    ovIn.append(SDP)


    let host = document.createElement("input")
    host.placeholder = "enter srt destination"
    host.onkeydown = (event) => {
        if(event.code === 'Enter') {
            let server = host.value.split(":")[0]
            let port = host.value.split(":")[1]
            console.log(server + " ---->  " + port)
            getRequest("http://" + server + "/status")
            .then(d => {
                try {
                    let J = JSON.parse(d)
                    r = 0
                    J.forEach(i => {
                        if(i.source == port) {
                            console.log(i)
                            if(i.source_state) {
                                console.log("Source is busy")
                                host.className = "orange"
                                r = 1
                            }
                            else {
                                console.log("Source is free")
                                host.className = "green"
                                r = 1
                            }
                        }
                    })
                    if(!r) { 
                        console.log("Source does not exist")
                        host.className = "stoped"
                    }
                }
                catch(e) {
                    console.log("JSON prse error")
                }
            })
            .catch(() => console.log("Error fectiching server status",server))
        }
    }
    ovIn.append(host)

    let cancel = document.createElement("div")
    cancel.innerHTML = "cancel"
    cancel.id = "cancelBtn"
    cancel.onclick = () => ov.outerHTML = ""
    ovIn.append(cancel)
    let ok = document.createElement("div")
    ok.innerHTML = "ok"
    ok.id = "okBtn"
    ovIn.append(ok)

    ok.onclick = () => {
        let rst = host.value.split(":")
        console.log(sessions.value)
        let sdp = JSON.parse(sessions.value)
        let rtp = [sdp.media[0].connection.ip.split("/")[0], sdp.media[0].port]

        let server = host.value.split(":")[0]
        let port = host.value.split(":")[1]
        post("http://" + server + "/sdp?port=" + port,JSON.parse(sessions.value).raw,(d) => console.log(d)).then(() => {})
        getme("/status?add=2&streamIP="+rtp[0]+"&streamPORT="+rtp[1]+"&adapter="+sel.value+"&host="+rst[0]+"&destination="+rst[1])
        ov.outerHTML = ""
    }
}
