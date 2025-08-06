import React from 'react';
import './Run.css';

const Run = () => {
  const commands = [
    {
      title: "🚀 Deploy to Server (One Command)",
      command: "ssh root@89.117.58.204 \"cd /var/www/graphykon && chmod +x deploy.sh && ./deploy.sh\"",
      description: "Complete automated deployment - pulls code, installs dependencies, restarts servers, builds frontend"
    },
    {
      title: "📤 Push to GitHub",
      command: "git add . && git commit -m \"Update changes\" && git push",
      description: "Stage, commit, and push all changes to GitHub repository"
    },
    {
      title: "📥 Pull Latest Code",
      command: "ssh root@89.117.58.204 \"cd /var/www/graphykon && git pull\"",
      description: "Pull latest changes from GitHub to server"
    },
    {
      title: "🔄 Restart Frontend",
      command: "ssh root@89.117.58.204 \"cd /var/www/graphykon/client && nohup npm start > client.log 2>&1 &\"",
      description: "Start React development server on port 3000"
    },
    {
      title: "🔄 Restart Backend",
      command: "ssh root@89.117.58.204 \"cd /var/www/graphykon/server && nohup npm start > server.log 2>&1 &\"",
      description: "Start Node.js backend server on port 5000"
    },
    {
      title: "🛑 Stop All Servers",
      command: "ssh root@89.117.58.204 \"pkill -f 'npm start' && pkill -f 'node server.js'\"",
      description: "Stop all running npm and node processes"
    },
    {
      title: "📦 Install Dependencies",
      command: "ssh root@89.117.58.204 \"cd /var/www/graphykon && npm install && cd client && npm install && cd ../server && npm install\"",
      description: "Install all dependencies for frontend and backend"
    },
    {
      title: "🔧 Check Server Status",
      command: "ssh root@89.117.58.204 \"ps aux | grep -E '(npm|node)' | grep -v grep\"",
      description: "Check which servers are currently running"
    },
    {
      title: "🌐 Check Ports",
      command: "ssh root@89.117.58.204 \"ss -tlnp | grep -E '(3000|5000)'\"",
      description: "Check which ports are being used"
    },
    {
      title: "📋 View Logs",
      command: "ssh root@89.117.58.204 \"cd /var/www/graphykon && tail -f client/client.log\"",
      description: "View frontend server logs in real-time"
    },
    {
      title: "🔍 Nginx Status",
      command: "ssh root@89.117.58.204 \"systemctl status nginx\"",
      description: "Check Nginx web server status"
    }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Command copied to clipboard!');
  };

  return (
    <div className="run-container">
      <h1>🚀 Server Management Commands</h1>
      <p className="run-description">
        All the commands you need to manage your Graphykon server deployment.
      </p>

      <div className="commands-grid">
        {commands.map((cmd, index) => (
          <div key={index} className="command-card">
            <h3>{cmd.title}</h3>
            <p className="command-description">{cmd.description}</p>
            <div className="command-box">
              <code>{cmd.command}</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(cmd.command)}
              >
                📋 Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => copyToClipboard("ssh root@89.117.58.204 \"cd /var/www/graphykon && ./deploy.sh\"")}
          >
            🚀 Full Deploy
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => copyToClipboard("git add . && git commit -m \"Update changes\" && git push")}
          >
            📤 Push to GitHub
          </button>
          <button 
            className="action-btn warning"
            onClick={() => copyToClipboard("ssh root@89.117.58.204 \"pkill -f 'npm start' && pkill -f 'node server.js'\"")}
          >
            🛑 Stop Servers
          </button>
        </div>
      </div>

      <div className="server-info">
        <h2>📊 Server Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Server IP:</strong> 89.117.58.204
          </div>
          <div className="info-item">
            <strong>Domain:</strong> graphykon.com
          </div>
          <div className="info-item">
            <strong>Frontend Port:</strong> 3000
          </div>
          <div className="info-item">
            <strong>Backend Port:</strong> 5000
          </div>
          <div className="info-item">
            <strong>Project Path:</strong> /var/www/graphykon
          </div>
          <div className="info-item">
            <strong>Deployment Script:</strong> ./deploy.sh
          </div>
        </div>
      </div>
    </div>
  );
};

export default Run; 