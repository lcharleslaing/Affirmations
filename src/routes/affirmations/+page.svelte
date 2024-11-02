<!-- src/routes/affirmations/+page.svelte -->

<script>
  import { onMount } from "svelte";

  let selectedFile = null;
  let backgroundMusic = "";
  let title = "";
  let artist = "";

  let audioPlayer;

  const backgroundTracks = [
    { name: "Family", file: "family.mp3" },
    { name: "Inspiration", file: "inspiration.mp3" },
    // Add more tracks as needed
  ];

  function previewTrack(file) {
    audioPlayer.src = `/background-music/${file}`;
    audioPlayer.play();
  }

  const handleUpload = async () => {
    if (!selectedFile || !backgroundMusic || !title || !artist) {
      alert("Please fill in all fields.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to upload an affirmation.");
      window.location.href = "/login";
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("backgroundMusic", backgroundMusic);
    formData.append("title", title);
    formData.append("artist", artist);

    try {
      const response = await fetch("/affirmations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.text();

      if (response.ok) {
        console.log(result);
        alert("Audio processed and saved successfully.");
        // Optionally reset the form
        selectedFile = null;
        backgroundMusic = "";
        title = "";
        artist = "";
      } else {
        console.error("Server error:", result);
        alert("There was an error uploading your affirmation.");
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("There was an error uploading your affirmation.");
    }
  };
</script>

<div class="container mx-auto p-6">
  <h1 class="text-4xl font-bold mb-4">Upload Audio Affirmation</h1>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium">Select Audio File</label>
      <input
        type="file"
        accept="audio/*"
        on:change={(e) => (selectedFile = e.target.files[0])}
        class="mt-1 block w-full"
      />
    </div>

    <div>
      <label class="block text-sm font-medium">Select Background Music</label>
      <select bind:value={backgroundMusic} class="mt-1 block w-full">
        <option value="" disabled selected>Select a track</option>
        {#each backgroundTracks as track}
          <option value={track.file}>{track.name}</option>
        {/each}
      </select>

      <!-- Preview background music tracks -->
      <div class="mt-2">
        {#each backgroundTracks as track}
          <div class="flex items-center space-x-2">
            <span>{track.name}</span>
            <button
              type="button"
              on:click={() => previewTrack(track.file)}
              class="btn btn-secondary btn-sm"
            >
              Preview
            </button>
          </div>
        {/each}
      </div>

      <!-- Audio player for previewing -->
      <audio bind:this={audioPlayer} hidden></audio>
    </div>

    <div>
      <label class="block text-sm font-medium">Title</label>
      <input
        type="text"
        bind:value={title}
        placeholder="Enter title"
        class="mt-1 block w-full"
      />
    </div>

    <div>
      <label class="block text-sm font-medium">Artist</label>
      <input
        type="text"
        bind:value={artist}
        placeholder="Enter artist name"
        class="mt-1 block w-full"
      />
    </div>

    <div>
      <button on:click={handleUpload} class="btn btn-primary mt-4">
        Upload Affirmation
      </button>
    </div>
  </div>
</div>

<style>
  /* Add any necessary styles here */
</style>
