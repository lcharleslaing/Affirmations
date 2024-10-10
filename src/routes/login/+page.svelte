<script>
  let username = "";
  let password = "";
  let errorMessage = "";
  let successMessage = "";

  // Function to handle login
  function login() {
    errorMessage = ""; // Reset any previous error message

    // Retrieve users array from localStorage, or initialize it as an empty array
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Check if a user with the entered username exists and if the password matches
    const foundUser = users.find(
      (user) => user.username === username && user.password === password
    );

    if (foundUser) {
      // Save login status and username to localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username); // Save username to localStorage

      successMessage = "Login successful! Redirecting...";

      setTimeout(() => {
        window.location.href = "/"; // Redirect to the homepage
      }, 2000); // 2-second delay before redirect
    } else {
      errorMessage = "Invalid username or password";
    }
  }
</script>

<!-- DaisyUI Toast Container -->
<div aria-live="polite" class="toast toast-top toast-center z-50">
  {#if successMessage}
    <div class="alert alert-success">
      <div>
        <span>{successMessage}</span>
      </div>
    </div>
  {/if}
  {#if errorMessage}
    <div class="alert alert-error">
      <div>
        <span>{errorMessage}</span>
      </div>
    </div>
  {/if}
</div>

<!-- Login Form -->
<div class="flex justify-center items-center min-h-screen">
  <div class="card w-full max-w-sm">
    <div class="card-body">
      <h2 class="text-center text-2xl font-bold mb-6">Login</h2>

      <form on:submit|preventDefault={login}>
        <div class="form-control mb-4">
          <label for="username" class="label">
            <span class="label-text">Username</span>
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            bind:value={username}
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="form-control mb-6">
          <label for="password" class="label">
            <span class="label-text">Password</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            bind:value={password}
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="form-control">
          <button type="submit" class="btn btn-primary w-full">Login</button>
        </div>
      </form>
    </div>
  </div>
</div>
