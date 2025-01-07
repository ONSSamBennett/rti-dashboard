<script>
  import { Embed, Notice, Section, Cards, Card, Twisty, Grid } from "@onsvisual/svelte-components";

  export let data;

  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  console.log(data.array);
  console.log(data.expected_comparison.value);
</script>

<Embed>
  <Section width="medium">
    <Notice mode="warning" important>
      <p>The figures displayed on this page are the provisional estimates. This means
        they are the earliest estimates available and will be revised in the future.
        Read more in the <a>Data sources and quality page</a></p>
    </Notice>
  </Section>
  
  <Section title="Deaths registered and expected deaths" width="medium">
    <p>England and Wales, week ending {data.current.date.toLocaleDateString("en-GB", dateOptions)}</p>
  </Section>

  <Cards>
    <Card title="Deaths registered">
      <p class="ons-u-fs-xxxl">{data.deaths_registered.value.toLocaleString("en-GB")}</p>
      {#if data.deaths_registered.change === 0}
        <p class="ons-u-fs-r">No change from previous week</p>
      {:else}
        <p class="ons-u-fs-r">Change from previous week</p>
        <p class="ons-u-fs-r"><span>
          {#if data.deaths_registered.change > 0}
            &uarr; Up
          {:else}
            &darr; Down
          {/if}
          {Math.abs(data.deaths_registered.change).toLocaleString("en-GB")}
          ({Math.abs(data.deaths_registered.percent_change).toFixed(1)}%)
        </span></p>
      {/if}
    </Card>
    <Card title="Comparison to expected deaths">
      <p class="ons-u-fs-xxxl">{Math.abs(data.expected_comparison.percent_difference.toLocaleString("en-GB")).toFixed(1)}% 
        {#if data.expected_comparison.percent_difference === 0}
          difference
        {:else}
          {#if data.expected_comparison.percent_difference > 0}
            higher
          {:else}
            lower
          {/if}  
        {/if}  
      </p>
      <p class="ons-u-fs-r">
        {#if data.expected_comparison.value === 0}
          As many as expected
        {:else}
          {#if data.expected_comparison.value > 0}
            {Math.abs(data.expected_comparison.value).toLocaleString("en-GB")} more than expected
          {:else}
            {Math.abs(data.expected_comparison.value).toLocaleString("en-GB")} fewer than expected
          {/if}  
        {/if}  
      </p>
    </Card>
  </Cards>

  <Section width="medium">
    <Twisty title="What are death registrations?">
      <p>There can be delays between when a death occurs and the date it is registered. In the latest week, 48% of registered deaths also happened that week.</p>
      <p><a>Learn more about the death registration system</a></p>
    </Twisty>
    <Twisty title="What are expected deaths?">
      <p>We use statistical modelling to estimate the number of deaths that we would expect to happen based on current population and mortality trends.</p>
      <p><a>Learn more about expected deaths</a></p>
    </Twisty>
  </Section>

  <Section width="wide">
    <h3>Trend since January 2023</h3>
    <p>Deaths registered and expected deaths</p>
    <div class="placeholder">Weekly deaths chart</div>
  </Section>

  <Section title="Deaths by selected causes" width="medium">
    <p>Percentage of deaths due to or involving selected cause, England and Wales, week ending {data.current.date.toLocaleDateString("en-GB", dateOptions)}</p>
  </Section>

  <Cards>
    <Card title="Influenza and pneumonia">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </Card>
    <Card title="Coronavirus">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </Card>
  </Cards>

  <Section width="medium">
    <Twisty title='What is the difference between deaths "due to" and deaths "involving"?'>
      <p><strong>Deaths due to a disease:</strong> those where the disease was the underlying cause of death (in other words, the person died from the disease).</p>
      <p><strong>Deaths involving a disease:</strong> those where the disease was mentioned anywhere on the death certificate (in other words, they died with the disease).</p>
    </Twisty>
  </Section>

  <Section title="Deaths by country" width="medium">
    <p>Week ending {data.current.date.toLocaleDateString("en-GB", dateOptions)}</p>
  </Section>

  <Cards>
    <Card title="England">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </Card>
    <Card title="Wales">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </Card>
    <Card title="UK">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </Card>
  </Cards>

  <Section width="medium">
    The figures for England and Wales exclude non-residents.
  </Section>
</Embed>

<style>
  .placeholder {
    display: block;
    height: 300px;
    background: #eee;
    color: grey;
    padding: 24px;
  }
</style>