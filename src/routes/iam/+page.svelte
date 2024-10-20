<script>
  import RecordAudio from "$lib/components/iam/RecordAudio.svelte";

  let selectedFile = null; // Stores either uploaded or selected file
  let recordedAudioBlob = null; // Stores the recorded audio

  // Handle recorded audio from RecordAudio component
  const handleRecording = (audioBlob) => {
    console.log("Recorded audio blob:", audioBlob); // Debugging log
    recordedAudioBlob = new File([audioBlob], "recorded_audio.m4a", {
      type: "audio/m4a",
    });
  };

  const handleUpload = async () => {
    const formData = new FormData();

    if (recordedAudioBlob) {
      // If there's a recorded audio, send that
      console.log("Sending recorded audio..."); // Debugging log
      formData.append("recordedAudio", recordedAudioBlob);
    } else if (selectedFile) {
      // Otherwise, use the uploaded file
      console.log("Sending selected file..."); // Debugging log
      formData.append("file", selectedFile);
    } else {
      console.error("No file selected or recorded.");
      return;
    }

    formData.append("title", "Your Title");
    formData.append("artist", "Your Artist");

    try {
      const response = await fetch("/iam", {
        method: "POST",
        body: formData,
      });

      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };
</script>

<div class="">
  <h1 class="text-4xl text-center font-black my-4">Record or Upload Audio</h1>

  <!-- Record audio directly in the app -->
  <RecordAudio on:audioRecorded={handleRecording} />

  <div
    class="mt-4 p-8 space-y-6 bg-base-200 rounded-lg shadow-md max-w-xl mx-auto"
  >
    <h1 class="text-3xl font-bold text-center">Upload Your Recording</h1>

    <div class="flex justify-center items-center my-6">
      <!-- Or upload/select an audio file -->
      <input
        type="file"
        accept="audio/*"
        on:change={(e) => (selectedFile = e.target.files[0])}
      />

      <button class="btn btn-primary" on:click={handleUpload}>Submit</button>
    </div>
  </div>
</div>
