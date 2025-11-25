//Copyright (C) 2023 ading2210
//see README.md for more information

//this script launches the popup and contains handlers for canvas/schoology

const gpl_text = `ading2210/edpuzzle-answers: a Javascript bookmarklet that provides many useful utilities for Edpuzzle
Copyright (C) 2025 ading2210
...
`;

//legacy code - use the fetch api instead
function http_get(url, callback, headers=[], method="GET", content=null) {
  console.log(`[HTTP] Preparing ${method} request to: ${url}`);

  var request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    console.log(`[HTTP] Response received from: ${url}`);
    callback.call(this);
  });

  request.open(method, url, true);

  if (window.__EDPUZZLE_DATA__ && window.__EDPUZZLE_DATA__.token && (new URL(url).hostname) == "edpuzzle.com") {
    headers.push(["authorization", window.__EDPUZZLE_DATA__.token]);
    console.log(`[HTTP] Added authorization header for Edpuzzle`);
  }

  for (const header of headers) {
    console.log(`[HTTP] Added header: ${header[0]} = ${header[1]}`);
    request.setRequestHeader(header[0], header[1]);
  }
  
  console.log(`[HTTP] Sending request...`);
  request.send(content);
}

function format_text(text, replacements) {
  let formatted = text;
  for (let key of Object.keys(replacements)) {
    while (formatted.includes("{{"+key+"}}")) {
      formatted = formatted.replace("{{"+key+"}}", replacements[key]);
    }
  }
  return formatted;
}

function init() {
  console.info(gpl_text);

  console.log(`[Init] Current URL: ${window.location.href}`);

  window.real_location = window.location;
  if (window.__uv) {
    console.log("[Init] Running within Ultraviolet proxy");
    window.real_location = __uv.location;
  }

  if (window.real_location.hostname == "edpuzzle.hs.vc") {
    alert("To use this, drag this button into your bookmarks bar. Then, run it when you're on an Edpuzzle assignment.");
  }
  else if ((/https?:\/\/edpuzzle.com\/(lms\/lti\/)?assignments\/[a-f0-9]{1,30}\/(watch|view)/).test(window.real_location.href)) {
    console.log("[Init] Detected Edpuzzle assignment page. Loading popup...");
    http_get(base_url+"/popup.html", open_popup);
  }
  else if (window.canvasReadyState) {
    console.log("[Init] Detected Canvas environment");
    handle_canvas_url();
  }
  else if (window.schoologyMoreLess) {
    console.log("[Init] Detected Schoology environment");
    handle_schoology_url();
  }
  else {
    console.log("[Init] Not an Edpuzzle assignment. Aborting.");
    alert("Please run this script on an Edpuzzle assignment...");
  }
}

function open_popup() {
  console.log("[Popup] Writing popup window with loaded HTML");
  const popup = window.open("about:blank", "", "width=760, height=450");
  if (popup == null) {
    alert("Error: Could not open the popup...");
    return;
  }
  write_popup(popup, this.responseText);
  
  function popup_unload() { 
    console.log("[Popup] Reloading popup content after unload");
    http_get(base_url+"/popup.html", function(){
      if (popup.closed) return;
      write_popup(popup, this.responseText);
      popup.addEventListener("beforeunload", popup_unload);
    });
  }

  popup.addEventListener("beforeunload", popup_unload);
}

function write_popup(popup, html) {
  console.log("[Popup] Injecting CSS, JS, and HTML into popup");

  popup.document.base_url = base_url;
  popup.document.edpuzzle_data = window.__EDPUZZLE_DATA__;
  popup.document.gpl_text = gpl_text;
  popup.document.write(html);

  let create_element = function(tag, innerHTML) {
    let element = popup.document.createElement(tag);
    element.innerHTML = innerHTML;
    popup.document.head.append(element);
    return element;
  }

  http_get(base_url+"/styles/popup.css", function(){
    console.log("[Popup] Loaded popup CSS");
    create_element("style", this.responseText);
  });

  http_get(base_url+"/main.js", function() {
    console.log("[Popup] Loaded popup JS");
    create_element("script", this.responseText);
  });
}

function handle_canvas_url() {
  console.log("[Canvas] Starting Canvas assignment resolution");

  let location_split = window.real_location.href.split("/");
  let url = `/api/v1/courses/${location_split[4]}/assignments/${location_split[6]}`;
  console.log(`[Canvas] Fetching assignment info from: ${url}`);

  http_get(url, function(){
    let data = JSON.parse(this.responseText);
    let url2 = data.url;
    console.log(`[Canvas] Found external tool URL: ${url2}`);

    http_get(url2, function() {
      let data = JSON.parse(this.responseText);
      let url3 = data.url;
      console.log(`[Canvas] Final Edpuzzle URL discovered: ${url3}`);
      console.log("[Canvas] Opening final target tab...");

      alert(`Please re-run this script in the newly opened tab...`);
      open(url3);
    });
  });
}

function handle_schoology_url() {
  console.log("[Schoology] Starting Schoology assignment resolution");

  let assignment_id = window.real_location.href.split("/")[4];
  let url = `/external_tool/${assignment_id}/launch/iframe`;

  console.log(`[Schoology] Fetching launch iframe from: ${url}`);

  http_get(url, function() {
    console.log("[Schoology] Received response. Processing form...");

    alert(`Please re-run this script in the newly opened tab...`);

    let html = this.responseText.replace(/<script[\s\S]+?<\/script>/, ""); 
    let div = document.createElement("div");
    div.innerHTML = html;
    let form = div.querySelector("form");
    
    let input = document.createElement("input")
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "ext_submit");
    input.setAttribute("value", "Submit");
    form.append(input);

    console.log("[Schoology] Submitting external tool form in new tab");

    document.body.append(div);
    form.setAttribute("target", "_blank");
    form.submit();
    div.remove();
  });
}

init();
