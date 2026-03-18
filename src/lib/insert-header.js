export default function insertHeader(updated, next, latest, email = 'health.data@ons.gov.uk', emailText = 'Real Time Indicators team') {
    const template = `
    

    <div class="col-wrap margin-top--3 margin-left--0">
   

    <p style="font-size:18px; margin-left:0px"
        class="col  col--md-one-third col--lg-one-third margin-bottom-sm--1 margin-bottom-md--3 margin-top--0 padding-bottom--0 padding-top--0">
        <span class="font-weight-700" style="font-size:18px">Last updated: </span>${updated}<br>
    </p>
    <p style="font-size:18px; margin-left:0px"
        class="col  col--md-one-third col--lg-one-third margin-bottom-sm--3 margin-bottom-md--3 margin-top--0 padding-bottom--0 padding-top--0">
        <span class="font-weight-700">Next update: </span>${next}
    </p>
    <p style="font-size:18px; margin-left:0px"
    class="col  col--md-one-third col--lg-one-third margin-bottom-sm--3 margin-bottom-md--3 margin-top--0 padding-bottom--0 padding-top--0">
      <span class="font-weight-700">Contact: </span><a style="font-size:18px" href="mailto:${email}"><span class="visuallyhidden">Email </span>${emailText}</a>
</p>
</div>`;

    if (window?.parent?.document) {
        // Insert "Dashboard" before the h1 title
        const title = window.parent.document.getElementsByClassName("page-neutral-intro__title")?.[0];
        if (title && !window.parent.document.getElementById("dashboard-prefix")) {
            const prefix = window.parent.document.createElement('div');
            prefix.id = "dashboard-prefix";
            prefix.style.fontSize = "22px";
            prefix.style.fontWeight = "400";
            prefix.style.color = "#8D8C8E";
            prefix.style.paddingBottom = "10px";
            prefix.textContent = "Dashboard";
            title.parentNode.insertBefore(prefix, title);
        }

        // Insert metadata after the intro section
        const header = window.parent.document.getElementsByClassName("page-neutral-intro")?.[1];
        if (header && !window.parent.document.getElementById("dashboard-metadata")) {
            const div = window.parent.document.createElement('div');
            div.className = "wrapper";
            div.id = "dashboard-metadata";
            div.innerHTML = template;
            header.appendChild(div);
        }
    }
}