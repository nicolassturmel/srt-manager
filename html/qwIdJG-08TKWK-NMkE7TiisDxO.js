let ctttt = 0
var getme = (uri,reask) => {
    ctttt++
    let contIn = document.getElementById("container")
    fetch(uri)
    .then(function(response) {
        return response.blob()
    })
    .then(function(response) {
        return response.text()
    })
    .then(function (blob) {
        console.log(blob)
        document.getElementById("debug").innerHTML = blob
        let X = JSON.parse(blob)
        console.log(X)

        let plus = document.getElementById("pluselem") 
        if(plus) plus.outerHTML = ""

        X.forEach(element => {
            let E = document.getElementById("container-" + element.id)
            if(!E) {
                E = document.createElement("div")
                E.className = "backup-config-container"
                E.id = "container-" + element.id

            }
            E.innerHTML = ""
            createSrt(element,E,element)
            contIn.append(E)
        });
        plus = document.createElement("div")
        plus.innerHTML = "+ add a new backup configuration"
        plus.className = "backup-config-container"
        plus.id = "pluselem"
        plus.onclick = () => getme("status?add=1")
        //contIn.append(plus)
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
    if(data.source_state)
        x.innerHTML = " Send data to :" + data.source + " (connected)"
    else
        x.innerHTML = " Send data to :" + data.source      + " (waiting connection)"
    if(data.target_state)
        x.innerHTML  += " ->  Receive data from :" + data.destination + " (connected)"
    else
        x.innerHTML  += " ->  Receive data from :" + data.destination + " (waiting connection)"
    container.appendChild(x)
    container.classList.remove("stopped")
    container.classList.remove("gray")
    container.classList.remove("orange")
    if(data.status == 0) {
        container.classList.add("stoped")
        x.innerHTML = "process has ended"
    }
    else if(!data.source_state &&  !data.target_state) container.classList.add("gray")
    else if(!data.source_state ||  !data.target_state) container.classList.add("orange")
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
