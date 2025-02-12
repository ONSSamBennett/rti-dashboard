<script>
  import {
    Embed,
    Notice,
    Section,
    Cards,
    Card,
    Twisty,
    Titleblock,
    Divider,
    Grid,
  } from "@onsvisual/svelte-components";
  import BarChart from "$lib/BarChart.svelte";
  import LineChart1 from "$lib/LineChart1.svelte";
  export let data;
  export let selectedYKey1; 
  export let selectedYKey2; 


  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // console.log(data.array);
  console.log(data.flu.value_involving);
  console.log(data.flu.percent_involving);
  console.log(data.flu.value_due_to);
  console.log(data.flu.percent_due_to);
</script>

<Embed>
  <Titleblock theme=lightblue title="Page title">
test
  </Titleblock>
  <Section width="medium">
    <Notice mode="warning" important>
      <p>
        The figures displayed on this page are the provisional estimates. This
        means they are the earliest estimates available and will be revised in
        the future. Read more in the <a>Data sources and quality page</a>
      </p>
    </Notice>
  </Section>

  <Section title="Deaths registered and expected deaths" width="medium">
    <p>
      England and Wales, week ending {data.current.date.toLocaleDateString(
        "en-GB",
        dateOptions
      )}
    </p>
  </Section>

  <Cards>
    <Card title="Deaths registered">
      <p class="ons-u-fs-xxxl">
        {data.deaths_registered.value.toLocaleString("en-GB")}
      </p>
      {#if data.deaths_registered.change === 0}
        <p class="ons-u-fs-r">No change from previous week</p>
      {:else}
        <p class="ons-u-fs-r" style="margin-bottom: 0">
          Change from previous week
        </p>

        {#if data.deaths_registered.change > 0}
          <div
            style="background: #FAD9CB; margin-top:5px;padding:5px; padding-left: 10px;padding-right:13px;display:inline-block"
            width="100px"
          >
            <!-- <p class="ons-u-fs-r"> -->

            <svg width="14" height="16" viewBox="0 0 12 14">
              <path
                d="M5.5 1.5L5.5 12.5M5.5 1.5L9.5 5.5M5.5 1.5L1.5 5.5"
                fill="none"
                stroke="#AD001F"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <span style="font-weight:700">
              {Math.abs(data.deaths_registered.change).toLocaleString("en-GB")}
            </span>
            ({Math.abs(data.deaths_registered.percent_change).toFixed(1)}%)
            higher
          </div>
        {:else}
          <div
            style="background: #D2E2CB; margin-top:5px;padding:5px; padding-left: 10px; padding-right:13px;display:inline-block"
            width="100px"
          >
            <!-- <p class="ons-u-fs-r"> -->

            <svg width="14" height="16" viewBox="0 0 12 14">
              <path
                d="M5.5 12.5L5.5 1.5M5.5 12.5L1.5 8.5M5.5 12.5L9.5 8.5"
                fill="none"
                stroke="#195000"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span style="font-weight:600">
              {Math.abs(data.deaths_registered.change).toLocaleString("en-GB")}
            </span>
            ({Math.abs(data.deaths_registered.percent_change).toFixed(1)}%)
            lower
          </div>
        {/if}

        <!-- </p> -->
      {/if}
      
    </Card>
    <Card title="Comparison to expected deaths">
      <p class="ons-u-fs-xxxl">
        {Math.abs(
          data.expected_comparison.percent_difference.toLocaleString("en-GB")
        ).toFixed(1)}%
        {#if data.expected_comparison.percent_difference === 0}
          difference
        {:else if data.expected_comparison.percent_difference > 0}
          higher
        {:else}
          lower
        {/if}
      </p>
      <p class="ons-u-fs-r">
        {#if data.expected_comparison.value === 0}
          As many as expected
        {:else if data.expected_comparison.value > 0}
          {Math.abs(data.expected_comparison.value).toLocaleString("en-GB")} more
          than expected
        {:else}
          {Math.abs(data.expected_comparison.value).toLocaleString("en-GB")} fewer
          than expected
        {/if}
      </p>
    </Card>
  </Cards>

  <Section width="medium">
    <Twisty title="What are death registrations?">
      <p>
        There can be delays between when a death occurs and the date it is
        registered. In the latest week, 48% of registered deaths also happened
        that week.
      </p>
      <p><a>Learn more about the death registration system</a></p>
    </Twisty>
    <Twisty title="What are expected deaths?">
      <p>
        We use statistical modelling to estimate the number of deaths that we
        would expect to happen based on current population and mortality trends.
      </p>
      <p><a>Learn more about expected deaths</a></p>
    </Twisty>
  </Section>

  <Section width="wide">
    <h3>Past two years trend</h3>
    <p>Deaths registered and expected deaths</p>
    <BarChart data={data.array} />
  </Section>
  <Divider hr="full"/>
  <Section title="Deaths by selected causes" width="medium">
    <p>
      Percentage of deaths due to or involving selected cause, England and
      Wales, week ending {data.current.date.toLocaleDateString(
        "en-GB",
        dateOptions
      )}
    </p>
  </Section>

  <Cards>
    <Card title="Influenza and pneumonia">
      <div class="causes-container">
        <div class="causes-child"> 
          <span style="color:#8D2865; font-weight:700"> Due to ⬥</span>
          <p class="ons-u-fs-xxxl" style="margin-bottom:0; color:#8D2865">
            {Math.abs(data.flu.percent_due_to.toLocaleString("en-GB")).toFixed(1)}%
          </p>
          {Math.abs(data.flu.value_due_to).toLocaleString("en-GB")} deaths
        </div>
       
        <div class="causes-child"> 
          <span style="color:#27A0CC; font-weight:700"> Involving ● </span>
          <p class="ons-u-fs-xxxl" style="margin-bottom:0; color:#27A0CC">
            {Math.abs(
              data.flu.percent_involving.toLocaleString("en-GB")
            ).toFixed(1)}%
          </p>
          {Math.abs(data.flu.value_involving).toLocaleString("en-GB")} deaths
        </div>
      </div>
    <p>
    <h4 style="padding-top:10px; margin-bottom:10px">Past two years trend</h4>
 
    <LineChart1 yKey1={"flu_with"} yKey2={"flu_due_to"} data={data.array} />
    
    </Card>
    <Card title="Coronavirus">
      <div class="causes-container">
        <div class="causes-child"> 
          <span style="color:#8D2865; font-weight:700"> Due to ⬥</span>
          <p class="ons-u-fs-xxxl" style="margin-bottom:0; color:#8D2865">
            {Math.abs(data.covid.percent_due_to.toLocaleString("en-GB")).toFixed(1)}%
          </p>
          {Math.abs(data.covid.value_due_to).toLocaleString("en-GB")} deaths
        </div>
       
        <div class="causes-child"> 
          <span style="color:#27A0CC; font-weight:700"> Involving ● </span>
          <p class="ons-u-fs-xxxl" style="margin-bottom:0; color:#27A0CC">
            {Math.abs(
              data.covid.percent_involving.toLocaleString("en-GB")
            ).toFixed(1)}%
          </p>
          {Math.abs(data.covid.value_involving).toLocaleString("en-GB")} deaths
        </div>
      </div>
      <p>
        <h4 style="padding-top:10px; margin-bottom:10px">Past two years trend</h4>
 
      <LineChart1 yKey1={"covid_with"} yKey2={"covid_due_to"} data={data.array} />
    </Card>
  </Cards>

  <Section width="medium">
    <Twisty
      title='What is the difference between deaths "due to" and deaths "involving"?'>
      <p>
        <strong>Deaths due to a disease:</strong> those where the disease was the
        underlying cause of death (in other words, the person died from the disease).
      </p>
      <p>
        <strong>Deaths involving a disease:</strong> those where the disease was
        mentioned anywhere on the death certificate (in other words, they died with
        the disease).
      </p>
    </Twisty>
  </Section>
  <Divider hr="full"/>
  <Section title="Deaths by country" width="medium">
    <p>
      Week ending {data.current.date.toLocaleDateString("en-GB", dateOptions)}
    </p>
  </Section>

  <Cards>
    <Card title="England">
      Deaths registered
      <p class="ons-u-fs-xxxl">
        {Math.abs(data.current.num_england).toLocaleString("en-GB")}
      </p>


      Comparison to expected
      <p class="ons-u-fs-xxl" style="margin-bottom:0">
        {Math.abs(
          data.expected_comparison_england.percent_difference.toLocaleString(
            "en-GB"
          )
        ).toFixed(1)}%
        {#if data.expected_comparison_england.percent_difference === 0}
          difference
        {:else if data.expected_comparison_england.percent_difference > 0}
          higher
        {:else}
          lower
        {/if}
      </p>
      {#if data.expected_comparison_england.percent_difference === 0}
        from expected
      {:else}
        than expected
      {/if}
    </Card>

    <Card title="Wales">
      Deaths registered
      <p class="ons-u-fs-xxxl">
        {Math.abs(data.current.num_wales).toLocaleString("en-GB")}
      </p>

   
      Comparison to expected
      <p class="ons-u-fs-xxl" style="margin-bottom:0">
        {Math.abs(
          data.expected_comparison_wales.percent_difference.toLocaleString(
            "en-GB"
          )
        ).toFixed(1)}%
        {#if data.expected_comparison_wales.percent_difference === 0}
          difference
        {:else if data.expected_comparison_wales.percent_difference > 0}
          higher
        {:else}
          lower
        {/if}
      </p>
      {#if data.expected_comparison_wales.percent_difference === 0}
        from expected
      {:else}
        than expected
      {/if}
    </Card>

    <Card title="UK">
      Deaths registered
      <p class="ons-u-fs-xxxl">
        X,XXX
        <!-- {Math.abs(data.current.num_wales).toLocaleString("en-GB")} -->
      </p>

      <p>Includes figures from Scotland and Northern Ireland.</p>
    </Card>
  </Cards>

  <Section width="medium">
    The figures for England and Wales exclude non-residents.
  </Section>
  <Divider hr="full"/>
</Embed>

<style>
  .placeholder {
    display: block;
    height: 300px;
    background: #eee;
    color: grey;
    padding: 24px;
  }

  .causes-child{
flex: 50%;
  }
.causes-container{
  display:flex;
   margin-top:16.8px
}

</style>
