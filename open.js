// Script for launching Google Assignments (or other Canvas external tools)
function launchGoogleAssignment() {
    const locationSplit = window.location.href.split("/");
    if (!window.location.hostname.includes("instructure.com") || !locationSplit[6]) {
        alert("Please run this script on a Canvas assignment page.");
        return;
    }

    const courseId = locationSplit[4];
    const assignmentId = locationSplit[6];

    // Fetch the assignment JSON
    fetch(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, { credentials: "same-origin" })
        .then(res => res.json())
        .then(data => {
            if (!data.submission_types.includes("external_tool") || !data.external_tool_tag_attributes?.url) {
                alert("This assignment is not an external tool or is not supported.");
                return;
            }

            // Open a new tab for sessionless launch
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
        });
}

// Run the script
launchGoogleAssignment();