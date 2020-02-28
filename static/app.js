let examples = {
  complex: {
    template: "", // set by init()
    data: "", // set by init()
    info:
      'Complex example with parsing for the Junos OS <a target="blank" ' +
      'href="https://www.juniper.net/documentation/en_US/junos/topics/reference/command-summary/' +
      'show-interfaces-gigabit-ethernet.html#jd0e6745">"show interfaces"</a> command.'
  },
  "1": {
    template: "Value FirstName ([\\w]+)\nValue LastName ([\\w]+)\n\nStart\n  ^${FirstName}.${LastName}",
    data: "John Doe is 31 years old.\n",
    info: "Basic example: a rule that matches the first two words of a line."
  },
  "2_multi1": {
    template: "Value FirstName ([\\w]+)\nValue LastName ([\\w]+)\n\nStart\n  ^${FirstName}.${LastName}",
    data: "John Doe is 31 years old.\nJane Dye is 33 years old.\n",
    info: "When a rule matches multiple lines, TextFSM by default returns the last one."
  },
  "2_multi2": {
    template: "Value FirstName ([\\w]+)\nValue LastName ([\\w]+)\n\nStart\n  ^${FirstName}.${LastName} -> Record",
    data: "John Doe is 31 years old.\nJane Dye is 33 years old.\n",
    info: "To find all lines matching our rule we have to add &minus;&gt; Record."
  },
  "3_BAD": {
    template: "Value Firstname ([\\w]+)\nValue Lastname ([\\w]+)\n\nStart\n  ^${Firstname}.${Lastname} -> Record",
    data: "Firstname Lastname\n------------------\nJohn Doe\nJane Dye\n",
    info:
      "This will match Firstname and Lastname as well, while we would only like to match what's after the separation line."
  },
  "3_GOOD": {
    template:
      "Value Firstname ([\\w]+)\nValue Lastname ([\\w]+)\n\nStart\n  ^------------------ -> Names\n\nNames\n  ^${Firstname}.${Lastname} -> Record",
    data: "Firstname Lastname\n------------------\nJohn Doe\nJane Dye\n",
    info: "This only matches below the line."
  },
  "4_TYPO": {
    template: "Value Firstname ([\\w]+)\nValue Lastname ([\\w]+)\n\nStart\n  ^${firstname}.${Lastname} -> Record",
    data: "John Doe\nJane Dye\n",
    info:
      "We have a typo in our template, ${firstname} should start with a capital F. Try correcting it to make the template valid."
  },
  "4_NEWL": {
    template: "Value Firstname ([\\w]+)\nValue Lastname ([\\w]+)\n\nStart\n\n  ^${Firstname}.${Lastname} -> Record",
    data: "John Doe\nJane Dye\n",
    info: "An empty line after 'Start' will cause a syntax error. Try removing it to make the template valid."
  }
};
let ws;
let socket;
let initialized = false;

function escape_html(unsafe_text) {
  let text = document.createTextNode(unsafe_text);
  let div = document.createElement("div");
  div.appendChild(text);
  return div.innerHTML;
}

function example(id) {
  /* Fill template/input data into the corresponding textarea's and call parse() */
  if (!(id in examples)) {
    console.log("Undefined example " + id);
    return;
  }
  document.getElementById("template").value = examples[id].template;
  document.getElementById("data").value = examples[id].data;
  document.getElementById("info").innerHTML = examples[id].info;
  console.log("loaded example " + id);
  socket.emit("parse", {
    data: document.getElementById("data").value,
    template: document.getElementById("template").value
  });
}

function init() {
  // Lazy solution to avoid having to escape the 'complex' example
  examples["complex"].data = document.getElementById("data").value;
  examples["complex"].template = document.getElementById("template").value;

  // Connect to the Socket.IO server.
  // The connection URL has the following format, relative to the current page:
  //     http[s]://<domain>:<port>[/<namespace>]
  host = $("#status").data("host");
  port = $("#status").data("port");
  socket = io(`${host}:${port}`);

  // Event handler for new connections.
  // The callback function is invoked when connection with the server is established.
  socket.on("connect", function() {
    let versions = $("#status").data("versions");
    document.getElementById("status").innerHTML = `Connected SocketIO (${versions})`;
    if (!initialized) example(1); // Show example 1 as default
    initialized = true;
  });

  socket.on("disconnect", function() {
    document.getElementById("status").innerHTML = "Disconnected. Polling server..";
  });

  // Event handler for server sent data.
  // The callback function is invoked whenever the server emits data
  // to the client. The data is then displayed in the "Received"
  // section of the page.
  socket.on("parse_response", function(msg, cb) {
    let parsed_text = msg.error;
    let parsed_style = "color: red";
    let parsed_regex = "";
    let ts = msg.ts;
    if (msg.text) {
      parsed_text = msg.text;
      parsed_style = "color: green";
      parsed_regex = msg.regex;
    }

    document.getElementById("parsed").innerHTML = "<pre>" + escape_html(parsed_text) + "</pre>";
    document.getElementById("parsed").style.cssText = parsed_style;
    document.getElementById("regexes").innerHTML = "<pre>" + escape_html(parsed_regex) + "</pre>";
    document.getElementById("timestamp").innerHTML = ts;
  });

  // Create split for left/right pane
  Split(["#content-left", "#content-right"], {
    gutterSize: 8,
    sizes: [50, 50],
    minSize: 300,
    cursor: "col-resize"
  });

  //  Create split for the left pane
  Split(["#content-left-top", "#content-left-bottom"], {
    direction: "vertical",
    sizes: [50, 50],
    gutterSize: 6,
    snapOffset: 10,
    minSize: 200
  });
  //  Create split for the right pane
  Split(["#content-right-top", "#content-right-bottom"], {
    direction: "vertical",
    sizes: [75, 25],
    gutterSize: 6,
    minSize: 200,
    snapOffset: 10,
    cursor: "row-resize"
  });

  // Listen for changes on FSM template or input data
  let areas_to_watch = ["#template", "#data"];
  for (let i = 0; i < areas_to_watch.length; i++) {
    document.querySelector(areas_to_watch[i]).addEventListener(
      "input",
      function() {
        socket.emit("parse", {
          data: document.getElementById("data").value,
          template: document.getElementById("template").value
        });
      },
      false
    );
  }
}

// Prevent accidentally closing the tab and potentially losing work
window.onbeforeunload = function before_leaving(e) {
  if (!e) {
    e = window.event;
  }
  e.cancelBubble = true;
  e.returnValue = "You sure you want to leave?";
  if (e.stopPropagation) {
    e.stopPropagation();
    e.preventDefault();
  }
};
