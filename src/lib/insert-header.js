export default function insertHeader(updated, next) {
    const template = `<div class="col-wrap margin-top--3 margin-left--0">
    <div class="col col--md-4 col--lg-5">
        <a
            href="https://uksa.statisticsauthority.gov.uk/about-the-authority/uk-statistical-system/types-of-official-statistics/">
            <img class="meta__image meta__image--logo"
                src="https://cdn.ons.gov.uk/assets/images/ons-logo/kitemark/v2/uksa-kitemark-en.svg"
                alt="These are accredited official statistics. Click for information about types of official statistics."
                height="58" width="58">
        </a>
    </div>
    <p
        class="col  col--md-12 col--lg-15 margin-bottom-sm--1 margin-bottom-md--3 margin-top-sm--1 padding-bottom--0 padding-top--0">
        <span class="font-weight-700">Contact: </span><br><a href="mailto:health.data@ons.gov.uk"><span class="visuallyhidden">Email </span>Population Health Monitoring Group</a>
    </p>
    <p
        class="col  col--md-one-third col--lg-one-third margin-bottom-sm--1 margin-bottom-md--3 margin-top--0 padding-bottom--0 padding-top--0">
        <span class="font-weight-700">Last updated: </span><br>${updated}<br>
    </p>
    <p
        class="col  col--md-one-third col--lg-one-third margin-bottom-sm--3 margin-bottom-md--3 margin-top--0 padding-bottom--0 padding-top--0">
        <span class="font-weight-700">Next update: </span><br>${next}
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