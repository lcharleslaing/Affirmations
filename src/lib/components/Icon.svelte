<script>
  export let iconPath = ""; // Path for the icon
  export let showIcon = true; // Control whether the icon is displayed or not
</script>

{#if showIcon}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d={iconPath}
    />
  </svg>
{/if}
