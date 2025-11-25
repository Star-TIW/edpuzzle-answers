// ==UserScript==
// @name         Canvas Google Assignment Launcher
// @description  Opens Google Assignments directly from Canvas assignment API
// ==/UserScript==

(function() {
    // Ensure we're on a Canvas assignment page
    const match = window.location.href.match(/courses\/(\d+)\/assignments\/(\d+)/);
    if (!match) {
        alert("Please run this script on a Canvas assignment page.");
        return;
    }

    const courseId = match[1];
    const assignmentId = match[2];

    // Fetch assignment JSON
    fetch(`/api/v1/courses/${courseId}/assignments/${assignmentId}`)
        .then(resp => {
            if (!resp.ok) throw new Error("Failed to fetch assignment JSON");
            return resp.json();
        })
        .then(data => {
            const ltiUrl = data.external_tool_tag_attributes?.url;
            if (!ltiUrl) {
                alert("No Google Assignment / external tool URL found.");
                return;
            }

            // Open the LTI URL in a new tab
            window.open(ltiUrl, "_blank");
        })
        .catch(err => {
            console.error(err);
            alert("Error fetching assignment data. Make sure you're logged in to Canvas.");
        });
})();