//Copyright (C) 2025 ading2210

const gpl_text = `ading2210/edpuzzle-answers: a Javascript bookmarklet that provides many useful utilities for Edpuzzle
Copyright (C) 2025 ading2210

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See <https://www.gnu.org/licenses/>.`;

// Simple fetch wrapper
function http_get(url, callback, headers = [], method = "GET", content = null) {
  var request = new XMLHttpRequest();
  request.addEventListener("load", callback);
  request.open(method, url, true);

  if (window.__EDPUZZLE_DATA__ && window.__EDPUZZLE_DATA__.token && (new URL(url).hostname) == "edpuzzle.com") {
    headers.push(["authorization", window.__EDPUZZLE_DATA__.token]);
  }
  for (const header of headers) {
    request.setRequestHeader(header[0], header[1]);
  }

  request.send(content);
}

// Edpuzzle popup logic
function openEdpuzzlePopup() {
  http_get(base_url + "/popup.html", function() {
    const popup = window.open("about:blank", "", "width=760, height=450");
    if (!popup) {
      alert("Enable popups to open Edpuzzle assignment.");
      return;
    }
    writePopup(popup, this.responseText);

    function popup_unload() {
      http_get(base_url + "/popup.html", function() {
        if (popup.closed) return;
        writePopup(popup, this.responseText);
        popup.addEventListener("beforeunload", popup_unload);
      });
    }
    popup.addEventListener("beforeunload", popup_unload);
  });
}

function writePopup(popup, html) {
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

  http_get(base_url + "/styles/popup.css", function() { create_element("style", this.responseText); });
  http_get(base_url + "/main.js", function() { create_element("script", this.responseText); });
}

// Main function to handle Canvas external tools and Edpuzzle
function init() {
  console.info(gpl_text);

  const real_location = window.__uv ? __uv.location : window.location;

  // Edpuzzle assignment
  if ((/https?:\/\/edpuzzle.com\/(lms\/lti\/)?assignments\/[a-f0-9]{1,30}\/(watch|view)/).test(real_location.href)) {
    openEdpuzzlePopup();
    return;
  }

  // Canvas / Google Assignments LTI
  const locationSplit = real_location.href.split("/");
  if (real_location.hostname.includes("instructure.com") && locationSplit[6]) {
    const courseId = locationSplit[4];
    const assignmentId = locationSplit[6];

    fetch(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        // External tool detected
        if (data.submission_types.includes("external_tool") && data.external_tool_tag_attributes?.url) {
          const sessionlessLaunch = `/api/v1/courses/${courseId}/external_tools/sessionless_launch?assignment_id=${assignmentId}&launch_type=assessment`;
          const launchTab = window.open("", "_blank");

          fetch(sessionlessLaunch, { credentials: "same-origin" })
            .then(res => {
              if (!res.ok) {
                alert("Cannot launch directly. Open assignment via Canvas first.");
                throw new Error("Unauthorized");
              }
              return res.json();
            })
            .then(json => {
              const externalUrl = json.url || data.external_tool_tag_attributes.url;
              launchTab.location.href = externalUrl;
            })
            .catch(err => console.error(err));
        } else {
          alert("This assignment is not an external tool or is not supported.");
        }
      });
  } else {
    alert("Please run this script on a Canvas assignment (like Google Assignments) or an Edpuzzle assignment.");
  }
}

// Run it
init();
