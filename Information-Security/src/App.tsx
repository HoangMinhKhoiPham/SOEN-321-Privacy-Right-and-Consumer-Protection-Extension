import { useState } from "react";
import "./App.css";
import {
  categories,
  labels,
  extractTextFromPrivacyPage,
  fetchApi,
  IResponse,
} from "./utils/apiUtils"; // Import the updated utility functions

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<"error" | "found" | "not found" | "links found" | "">("");
  const [response, setResponse] = useState<IResponse | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("scan");

  const analyzePage = async () => {
    console.log("hello")
    setIsScanning(true);
    try {
      const pageText = await extractTextFromPrivacyPage();
      if (!pageText) {
        setState("not found");
        return;
      }
      console.log("API:", pageText)
      // Step 4: Send the extracted content to OpenAI for analysis
      const parsedJson = await fetchApi(pageText);
      console.log(parsedJson)
      if (parsedJson) {
        setResponse(parsedJson);
        setState("found");

        const totalScore = categories.reduce(
          (sum, category) => sum + parsedJson.scores[category],
          0
        );
        setTotal(((totalScore / categories.length) * 10).toFixed(2) as unknown as number);
      } else {
        setState("error");
      }
    } catch (error) {
      console.error("Error analyzing page:", error);
      setState("error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container">
      {isScanning ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Analyzing... Please wait.</p>
        </div>
      ) : (
        <>
          <header className="header">
            <h1>Policy Check Extension</h1>
            <p>Analyze privacy policies effortlessly!</p>
          </header>

          <div className="main-content">
            {state === "found" && response && total !== null ? (
              <div className="result-container">
                <button className="back-button" onClick={() => setState("")}>
                  Back
                </button>
                <div className="top-metrics">
                  <div className="circle-metric">
                    <div
                      className="circle"
                      style={{
                        borderColor: total >= 90 ? "#4caf50" : "#ff9800",
                      }}
                    >
                      {total}
                    </div>
                    <p>Overall Score</p>
                  </div>
                </div>
                <div className="metrics-grid">
                  {categories.map((category) => (
                    <div key={category} className="metric-item">
                      <h4>{labels[category]}</h4>
                      <p>Score: {response.scores[category]}</p>
                      <p>{response.description[category]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : state === "not found" ? (
              <p>No privacy policy found on this page.</p>
            ) : state === "links found" ? (
              <p>Privacy or Terms link found. Extracting content...</p>
            ) : (
              <div>
                {activeTab === "scan" && (
                  <button className="option-button" onClick={analyzePage}>
                    Scan Current Page
                  </button>
                )}
                {activeTab === "url" && (
                  <div className="input-container">
                    <input
                      type="url"
                      placeholder="Enter URL"
                      className="input-field"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <button className="input-button" onClick={analyzePage}>
                      Check URL
                    </button>
                  </div>
                )}
                {activeTab === "upload" && (
                  <div>
                    <input
                      type="file" />
                  </div>
                )}
              </div>
            )}
          </div>

          {state === "" && (
            <nav className="bottom-nav">
              <button onClick={() => setActiveTab("scan")}>🔍 Analyze</button>
              <button onClick={() => setActiveTab("url")}>🌐 URL</button>
              <button onClick={() => setActiveTab("upload")}>📄 Upload</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default App;
