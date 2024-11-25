import { useState } from "react";
import "./App.css";

type AnalysisData = {
  category: string;
  score: number;
  description: string;
};

type Result = {
  title: string;
  data: AnalysisData[];
} | null;

function App() {
  const [activeTab, setActiveTab] = useState("scan");
  const [result, setResult] = useState<Result>(null);
  const [url, setUrl] = useState("");

  const analyzePage = () => {
    setResult({
      title: "Current Page Analysis",
      data: [
        { category: "Data Collection", score: 85, description: "The service collects user data for improving user experience." },
        { category: "Data Sharing", score: 70, description: "User data is shared with advertising and analytics providers." },
        { category: "User Choice", score: 90, description: "Users can opt-out through settings and manage preferences." },
        { category: "Data Security", score: 95, description: "256-bit encryption and regular security audits ensure data protection." },
        { category: "Data Deletion", score: 80, description: "Users can delete data via account settings or requests." },
        { category: "Policy Update", score: 75, description: "Policy updates are communicated via email and in-app notifications." },
        { category: "Data Retention", score: 65, description: "User data is retained for up to 5 years of inactivity." },
        { category: "International Audiences", score: 88, description: "Complies with GDPR, CCPA, and other international standards." },
        { category: "Children", score: 95, description: "Service complies with COPPA and avoids data collection from underage users." },
        { category: "Miscellaneous", score: 78, description: "Covers cookie policies and additional disclaimers." },
        { category: "Do Not Track", score: 60, description: "The service does not honor 'Do Not Track' signals." },
        { category: "Contact Information", score: 92, description: "Provides contact details, including DPO email and phone number." },
      ],
    });
    setActiveTab("result");
  };

  const analyzeUrl = () => {
    if (!url) {
      alert("Please enter a valid URL.");
      return;
    }
    setResult({
      title: `Analysis for URL: ${url}`,
      data: [
        { category: "Data Collection", score: 85, description: "The service collects user data for improving user experience." },
        { category: "Data Sharing", score: 70, description: "User data is shared with advertising and analytics providers." },
        { category: "User Choice", score: 90, description: "Users can opt-out through settings and manage preferences." },
        { category: "Data Security", score: 95, description: "256-bit encryption and regular security audits ensure data protection." },
        { category: "Data Deletion", score: 80, description: "Users can delete data via account settings or requests." },
        { category: "Policy Update", score: 75, description: "Policy updates are communicated via email and in-app notifications." },
        { category: "Data Retention", score: 65, description: "User data is retained for up to 5 years of inactivity." },
        { category: "International Audiences", score: 88, description: "Complies with GDPR, CCPA, and other international standards." },
        { category: "Children", score: 95, description: "Service complies with COPPA and avoids data collection from underage users." },
        { category: "Miscellaneous", score: 78, description: "Covers cookie policies and additional disclaimers." },
        { category: "Do Not Track", score: 60, description: "The service does not honor 'Do Not Track' signals." },
        { category: "Contact Information", score: 92, description: "Provides contact details, including DPO email and phone number." },
      ],
    });
    setActiveTab("result");
  };

  const analyzePdf = (file: File | null) => {
    if (!file) {
      alert("Please upload a PDF file.");
      return;
    }
    setResult({
      title: `PDF Analysis for: ${file.name}`,
      data: [
        { category: "Data Collection", score: 85, description: "The service collects user data for improving user experience." },
        { category: "Data Sharing", score: 70, description: "User data is shared with advertising and analytics providers." },
        { category: "User Choice", score: 90, description: "Users can opt-out through settings and manage preferences." },
        { category: "Data Security", score: 95, description: "256-bit encryption and regular security audits ensure data protection." },
        { category: "Data Deletion", score: 80, description: "Users can delete data via account settings or requests." },
        { category: "Policy Update", score: 75, description: "Policy updates are communicated via email and in-app notifications." },
        { category: "Data Retention", score: 65, description: "User data is retained for up to 5 years of inactivity." },
        { category: "International Audiences", score: 88, description: "Complies with GDPR, CCPA, and other international standards." },
        { category: "Children", score: 95, description: "Service complies with COPPA and avoids data collection from underage users." },
        { category: "Miscellaneous", score: 78, description: "Covers cookie policies and additional disclaimers." },
        { category: "Do Not Track", score: 60, description: "The service does not honor 'Do Not Track' signals." },
        { category: "Contact Information", score: 92, description: "Provides contact details, including DPO email and phone number." },
      ],
    });
    setActiveTab("result");
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Policy Check Extension</h1>
        <p>Analyze privacy policies effortlessly!</p>
      </header>

      <div className="main-content">
        {activeTab === "scan" && (
          <div>
            <button className="option-button" onClick={analyzePage}>
              Scan Current Page
            </button>
          </div>
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
            <button className="input-button" onClick={analyzeUrl}>
              Check URL
            </button>
          </div>
        )}

        {activeTab === "pdf" && (
          <div className="upload-container">
            <input
              type="file"
              accept="application/pdf"
              className="file-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  analyzePdf(e.target.files[0]);
                }
              }}
            />
            <button className="upload-button" onClick={() => alert("Please upload a PDF.")}>
              Upload PDF
            </button>
          </div>
        )}

        {activeTab === "result" && result && <ResultPage result={result} onBack={() => setActiveTab("scan")} />}
      </div>

      {activeTab !== "result" && (
        <nav className="bottom-nav">
          <button
            className={`nav-button ${activeTab === "scan" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("scan");
              setResult(null);
            }}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Scan</span>
          </button>
          <button
            className={`nav-button ${activeTab === "url" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("url");
              setResult(null);
            }}
          >
            <span className="nav-icon">🌐</span>
            <span className="nav-text">URL</span>
          </button>
          <button
            className={`nav-button ${activeTab === "pdf" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pdf");
              setResult(null);
            }}
          >
            <span className="nav-icon">📄</span>
            <span className="nav-text">PDF</span>
          </button>
        </nav>
      )}
    </div>
  );
}

type ResultPageProps = {
  result: Result;
  onBack: () => void;
};
function ResultPage({ result, onBack }: ResultPageProps) {
  if (!result) return null;

  const overallScore =
    Math.round(result.data.reduce((sum, item) => sum + item.score, 0) / result.data.length);

  return (
    <div className="result-container">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <div className="top-metrics">
        <div className="circle-metric">
          <div className="circle" style={{ borderColor: overallScore >= 90 ? "#4caf50" : "#ff9800" }}>
            {overallScore}
          </div>
          <p>Overall Score</p>
        </div>
      </div>

      <h3>Details</h3>
      <div className="metrics-grid">
        {result.data.map((item: AnalysisData, index: number) => (
          <div key={index} className="metric-item">
            <h4>{item.category}</h4>
            <div
              className="metric-score"
              style={{ color: item.score >= 90 ? "#4caf50" : item.score >= 50 ? "#ff9800" : "#f44336" }}
            >
              {item.score}%
            </div>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
