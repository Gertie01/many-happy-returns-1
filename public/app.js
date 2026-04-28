let currentImageBase64 = null;

// UI elements
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const imgPreview = document.getElementById("img-preview");
const previewArea = document.getElementById("preview-area");
const promptInput = document.getElementById("prompt-input");
const sendBtn = document.getElementById("send-btn");
const chatHistory = document.getElementById("chat-history");

// ------------------------------
// Drag & Drop + File Upload
// ------------------------------
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFile(e.target.files[0]);

dropZone.ondragover = (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
};

dropZone.ondragleave = () => dropZone.classList.remove("dragover");

dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  handleFile(e.dataTransfer.files[0]);
};

function handleFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageBase64 = e.target.result;
    imgPreview.src = currentImageBase64;
    previewArea.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  currentImageBase64 = null;
  previewArea.classList.add("hidden");
  fileInput.value = "";
}

// ------------------------------
// Chat Helpers
// ------------------------------
function appendMessage(role, content, imageData = null) {
  const div = document.createElement("div");
  div.className = `p-4 rounded-lg ${
    role === "user" ? "bg-zinc-700 ml-12" : "bg-blue-900/30 mr-12"
  }`;

  div.innerHTML = `<strong>${role === "user" ? "You" : "Gemini 2.0"}</strong>: <div>${content}</div>`;

  if (imageData) {
    const img = document.createElement("img");
    img.src = imageData;
    img.className = "mt-2 rounded shadow-xl border border-zinc-600 max-h-96";
    div.appendChild(img);
  }

  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ------------------------------
// Utility: Base64 → Blob
// ------------------------------
function base64ToBlob(base64) {
  const parts = base64.split(",");
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

// ------------------------------
// API Calls
// ------------------------------
async function generateImage(prompt) {
  const res = await fetch("/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error("Image generation failed");

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function editImage(prompt, base64Image) {
  const form = new FormData();

  const blob = base64ToBlob(base64Image);

  form.append("prompt", prompt);
  form.append("image", blob, "uploaded.png");

  const res = await fetch("/edit-image", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Image editing failed");

  const editedBlob = await res.blob();
  return URL.createObjectURL(editedBlob);
}

// ------------------------------
// Main Button Handler
// ------------------------------
sendBtn.onclick = async () => {
  const prompt = promptInput.value.trim();

  if (!prompt && !currentImageBase64) {
    appendMessage("assistant", "Please enter a prompt or upload an image.");
    return;
  }

  appendMessage("user", prompt, currentImageBase64);
  promptInput.value = "";

  try {
    let imageURL;

    if (currentImageBase64) {
      appendMessage("assistant", "Editing image...");
      imageURL = await editImage(prompt, currentImageBase64);
    } else {
      appendMessage("assistant", "Generating image...");
      imageURL = await generateImage(prompt);
    }

    appendMessage("assistant", "Done!", imageURL);
  } catch (err) {
    console.error(err);
    appendMessage("assistant", "Error: " + err.message);
  }
};
