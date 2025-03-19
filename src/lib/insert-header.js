export default function insertHeader(updated, next, latest) {
    const template = `
    <div style="font-size:28px; font-weight:400" class="col-wrap margin-top--3 margin-left--0">
    
    <div>
    Week ending ${latest}
    </div>
    <div class="col col--md-4 col--lg-5">
    <a
        href="https://uksa.statisticsauthority.gov.uk/about-the-authority/uk-statistical-system/types-of-official-statistics/">
        <img class="meta__image meta__image--logo"
            src="https://cdn.ons.gov.uk/assets/images/ons-logo/kitemark/v2/uksa-kitemark-en.svg"
            alt="These are accredited official statistics. Click for information about types of official statistics."
            height="90" width="90">
    </a>
</div>
    </div>

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
      <span class="font-weight-700">Contact: </span><a style="font-size:18px" href="mailto:health.data@ons.gov.uk"><span class="visuallyhidden">Email </span>Population Health Monitoring Group</a>
</p>
</div>`;

    if (window?.parent?.document) {
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