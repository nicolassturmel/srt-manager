var getme = (uri) => {
    let cont = document.getElementById("container")
    if(document.getElementById("containerIn")) {
        document.getElementById("containerIn").outerHTML = ""
    }
    let contIn = document.createElement("div")
    contIn.id = "containerIn"
    cont.appendChild(contIn)
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
        X.forEach(element => {
            let E = document.createElement("div")
            E.className = "backup-config-container"
            E.id = "container-" + element.Id
            createSrt(element,E,element)
            contIn.append(E)
        });
        let plus = document.createElement("div")
        plus.innerHTML = "+ add a new backup configuration"
        plus.className = "backup-config-container"
        plus.onclick = () => getme("status?add=1")
        contIn.append(plus)
    });
}

window.addEventListener('load', function() {
    getme('status')
    console.log('All assets are loaded')
})

var createSrt = (B,container,data) => {
    // Create list of options for devices
    let x = document.createElement("div")
    x.innerHTML = data.host + ":" + data.source + " -> " + data.destination
    container.appendChild(x)
    if(data.status == 0) x.classList.add("stoped")
    let l = document.createElement("div")
    l.innerHTML = data.log
    container.appendChild(l)
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
