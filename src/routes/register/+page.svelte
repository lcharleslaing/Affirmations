<script>
  let username = "";
  let password = "";
  let errorMessage = "";
  let successMessage = "";

  // Function to handle user registration
  function register() {
    errorMessage = ""; // Reset any previous error message

    // Check if username and password are provided
    if (!username || !password) {
      errorMessage = "Username and password are required";
      return;
    }

    // Retrieve the users array from localStorage, or initialize an empty array
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Check if the username already exists in the array of users
    const userExists = users.some((user) => user.username === username);
    if (userExists) {
      errorMessage = "User is already registered";
      return;
    }

    // Add the new user to the array and store it back in localStorage
    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));

    // Show a success message using a DaisyUI toast
    successMessage = "Registration successful! Redirecting to login...";

    // Show the toast for a few seconds, then redirect to the login page
    setTimeout(() => {
      window.location.href = "/login"; // Redirect to the login page
    }, 2000); // 2-second delay before redirect
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

<!-- Registration Form -->
<div class="flex justify-center items-center min-h-screen">
  <div class="card w-full max-w-sm">
    <div class="card-body">
      <h2 class="text-center text-2xl font-bold mb-6">Register</h2>

      <form on:submit|preventDefault={register}>
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
          <button type="submit" class="btn btn-primary w-full">
            Register
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
