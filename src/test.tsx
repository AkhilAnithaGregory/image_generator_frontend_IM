import { useState } from "react";

export default function App() {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (!images.length) {
      alert("Upload at least one image");
      return;
    }

    const formData = new FormData();

    images.forEach((img) => {
      formData.append("images", img);
    });

    formData.append("prompt", prompt);

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResult(data.output);
    } catch (err) {
      console.error(err);
      alert("Error sending request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Multi Image Gemini</h2>

      <input type="file" multiple onChange={handleFileChange} />

      <br /><br />

      <input
        type="text"
        placeholder="Enter prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        {loading ? "Loading..." : "Send"}
      </button>

      <h3>Result:</h3>
      <p>{result}</p>
    </div>
  );
}