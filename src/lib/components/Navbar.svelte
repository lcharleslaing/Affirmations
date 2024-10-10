<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation"; // SvelteKit's client-side navigation

  let isLoggedIn = false;
  let isInitialized = false; // To ensure we don't render prematurely
  let username = ""; // Store the username

  // Client-side check using onMount (runs only on the client, not during SSR)
  onMount(() => {
    if (typeof window !== "undefined") {
      const storedStatus = localStorage.getItem("isLoggedIn");
      const storedUsername = localStorage.getItem("username"); // Retrieve username from localStorage

      if (storedStatus === "true") {
        isLoggedIn = true; // User is logged in
        username = storedUsername; // Set the username
      } else {
        goto("/login"); // Redirect to login if not logged in
      }
      isInitialized = true; // Indicate that the login check is complete
    }
  });

  // Handle logging out (clears the login state and redirects to login)
  function logout() {
    localStorage.removeItem("isLoggedIn"); // Clear login state
    localStorage.removeItem("username"); // Clear the stored username
    isLoggedIn = false; // Set local state to false
    goto("/login"); // Redirect to login page
  }

  // Menu items definition
  $: menuItems = [
    {
      name: "Home",
      href: "/",
      active: false,
      visible: true,
      icon: true,
      iconPath: "",
    }, // Always visible
    {
      name: "Affirmations",
      href: "/affirmations",
      active: false,
      visible: true,
      icon: true,
      iconPath: "", // Add a real path here if necessary
    }, // Always visible
    {
      name: "Login",
      href: "/login",
      active: false,
      visible: !isLoggedIn,
      iconPath: "", // No icon here
    },
    {
      name: "Register",
      href: "/register",
      active: false,
      visible: !isLoggedIn,
      iconPath: "", // No icon here
    },
    {
      name: "Logout",
      href: "#",
      active: false,
      visible: isLoggedIn,
      onClick: logout,
      iconPath: "", // No icon here
    },
  ];

  // Set active menu item by index
  function setActive(index) {
    menuItems = menuItems.map((item, i) => ({
      ...item,
      active: i === index, // Set the clicked item as active
    }));
  }

  // Set active menu item based on URL
  function setActiveByUrl(pathname) {
    menuItems = menuItems.map((item) => ({
      ...item,
      active: item.href === pathname, // Set active based on the URL
    }));
  }
</script>

<div class="navbar bg-base-100 sticky top-0 z-50">
  <a href="/" class="btn btn-ghost text-xl">Affirmations</a>

  {#if isLoggedIn && username}
    <!-- Move the username to the right using 'ml-auto' -->
    <div class="ml-auto flex flex-row items-center">
      <span class="font-bold">{username}</span>
      <!-- <button on:click={logout} class="btn btn-ghost text-sm">Logout</button> -->
    </div>
  {/if}
</div>

<!-- Only render menu when login status is initialized -->
{#if isInitialized}
  <div class="btm-nav">
    {#each menuItems as item, index}
      {#if item.visible}
        <!-- Render only items that are visible based on login status -->
        <a
          href={item.href}
          class={item.active ? "active" : ""}
          on:click={() => {
            setActive(index);
            if (item.onClick) item.onClick(); // Handle logout
          }}
        >
          <!-- Display icon if available -->
          {#if item.icon && item.iconPath}
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
                d={item.iconPath}
              />
            </svg>
          {/if}
          <span class="btm-nav-label">{item.name}</span>
        </a>
      {/if}
    {/each}
  </div>
{/if}
