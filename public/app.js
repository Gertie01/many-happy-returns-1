// -----------------------------
// DOM Elements
// -----------------------------
const generateBtn = document.getElementById("generateBtn");
const editBtn = document.getElementById("editBtn");

const promptInput = document.getElementById("prompt");
const editPromptInput = document.getElementById("editPrompt");
const imageInput = document.getElementById("imageInput");

const resultImage = document.getElementById("resultImage");
const editedImage = document.getElementById("editedImage");

const statusBox = document.getElementById("status");

// -----------------------------
// Helpers
// -----------------------------
function setStatus(msg) {
  statusBox.innerText = msg;
}

function blobToImageURL(blob) {
  return URL.createObjectURL(blob);
}

// -----------------------------
// IMAGE GENERATION
// -----------------------------
async function generateImage() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    setStatus("Please enter a prompt.");
    return;
  }

  setStatus("Generating image…");

  try {
    const response = await fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const err = await response.json();
      setStatus("Error: " + err.error);
      return;
    }

    const blob = await response.blob();
    const url = blobToImageURL(blob);

    resultImage.src = url;
    setStatus("Image generated successfully.");
  } catch (err) {
    setStatus("Failed to generate image: " + err.message);
  }
}

// -----------------------------
// IMAGE EDITING
// -----------------------------
async function editImage() {
  const prompt = editPromptInput.value.trim();
  const file = imageInput.files[0];

  if (!prompt) {
    setStatus("Please enter an edit prompt.");
    return;
  }
  if (!file) {
    setStatus("Please upload an image to edit.");
    return;
  }

  setStatus("Editing image…");

  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("prompt", prompt);

    const response = await fetch("/edit-image", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      setStatus("Error: " + err.error);
      return;
    }

    const blob = await response.blob();
    const url = blobToImageURL(blob);

    editedImage.src = url;
    setStatus("Image edited successfully.");
  } catch (err) {
    setStatus("Failed to edit image: " + err.message);
  }
}

// -----------------------------
// Event Listeners
// -----------------------------
generateBtn.addEventListener("click", generateImage);
editBtn.addEventListener("click", editImage);
