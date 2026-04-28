// ------------------------------------------------------
// ELEMENTS (must match your HTML exactly)
// ------------------------------------------------------
const generateBtn = document.querySelector("#generateBtn");
const editBtn = document.querySelector("#editBtn");

const promptInput = document.querySelector("#prompt");
const editPromptInput = document.querySelector("#editPrompt");
const imageInput = document.querySelector("#imageInput");

const resultImage = document.querySelector("#resultImage");
const editedImage = document.querySelector("#editedImage");

const statusBox = document.querySelector("#status");

// ------------------------------------------------------
// STATUS HANDLER
// ------------------------------------------------------
function setStatus(msg, error = false) {
  statusBox.textContent = msg;
  statusBox.style.color = error ? "red" : "white";
}

// ------------------------------------------------------
// IMAGE GENERATION
// ------------------------------------------------------
async function generateImage() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    setStatus("Please enter a prompt.", true);
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
      setStatus("Error: " + err.error, true);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    resultImage.src = url;
    resultImage.style.display = "block";

    setStatus("Image generated successfully.");
  } catch (err) {
    setStatus("Failed to generate image: " + err.message, true);
  }
}

// ------------------------------------------------------
// IMAGE EDITING
// ------------------------------------------------------
async function editImage() {
  const prompt = editPromptInput.value.trim();
  const file = imageInput.files[0];

  if (!prompt) {
    setStatus("Please enter an edit prompt.", true);
    return;
  }
  if (!file) {
    setStatus("Please upload an image to edit.", true);
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
      setStatus("Error: " + err.error, true);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    editedImage.src = url;
    editedImage.style.display = "block";

    setStatus("Image edited successfully.");
  } catch (err) {
    setStatus("Failed to edit image: " + err.message, true);
  }
}

// ------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------
if (generateBtn) generateBtn.addEventListener("click", generateImage);
if (editBtn) editBtn.addEventListener("click", editImage);
