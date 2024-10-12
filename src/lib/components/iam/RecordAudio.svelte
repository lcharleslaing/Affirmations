<script>
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let audioBlob;
  let audioURL;
  let audioTitle = "";
  let artistName = "";
  let recordingTime = new Date().toISOString();
  let isSubmitting = false;

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      isRecording = true;

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        audioURL = URL.createObjectURL(audioBlob);
        audioChunks = [];
      };
    });
  }

  function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
  }

  async function submitAudio() {
    if (!audioBlob || !audioTitle || !artistName) {
      alert(
        "Please provide title, artist, and record the audio before submission."
      );
      return;
    }

    isSubmitting = true;

    const formData = new FormData();
    formData.append("file", audioBlob, `${audioTitle}.mp3`);
    formData.append("title", audioTitle);
    formData.append("artist", artistName);

    try {
      const response = await fetch("/iam", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("File uploaded successfully");
      } else {
        alert("Failed to upload file");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error uploading the file.");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="p-8 space-y-6 bg-base-200 rounded-lg shadow-md max-w-xl mx-auto">
  <h1 class="text-3xl font-bold text-center">Record Your Affirmation</h1>

  {#if isRecording}
    <button class="btn btn-error w-full" on:click={stopRecording}>
      <i class="fas fa-stop mr-2"></i> Stop Recording
    </button>
  {:else}
    <button class="btn btn-primary w-full" on:click={startRecording}>
      <i class="fas fa-microphone mr-2"></i> Start Recording
    </button>
  {/if}

  {#if audioURL}
    <div class="space-y-4">
      <audio controls class="w-full mt-4">
        <source src={audioURL} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>

      <div class="form-control space-y-2">
        <label class="label">
          <span class="label-text">Title</span>
        </label>
        <input
          type="text"
          placeholder="Enter title"
          bind:value={audioTitle}
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control space-y-2">
        <label class="label">
          <span class="label-text">Artist</span>
        </label>
        <input
          type="text"
          placeholder="Enter artist name"
          bind:value={artistName}
          class="input input-bordered w-full"
        />
      </div>

      <button
        on:click={submitAudio}
        class="btn btn-success w-full mt-4"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <i class="fas fa-spinner fa-spin mr-2"></i> Submitting...
        {:else}
          <i class="fas fa-upload mr-2"></i> Submit Audio
        {/if}
      </button>
    </div>
  {/if}
</div>
