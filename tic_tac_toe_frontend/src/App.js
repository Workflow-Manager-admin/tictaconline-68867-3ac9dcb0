import React, { useState, useEffect } from 'react';
import './App.css';
import './ttt.css';

// Color constants for styling
const COLORS = {
  primary: '#1976D2',
  secondary: '#1565C0',
  accent: '#FFC107',
  boardLine: '#1565C0',
  boardBG: '#fff',
  boardCellHover: '#e3f0fd',
  text: '#222',
  sidebarBG: '#f8f9fa',
  controlBG: '#1976D2',
  controlText: '#fff',
  scoreBG: '#fff',
  scoreBorder: '#1976D2'
};

// Helper to get API URL, could refactor for env settings
const API_URL = process.env.REACT_APP_TTT_API_URL || 'http://localhost:5000/api';

function getInitialGameSettings() {
  return {
    vsAI: true,
    aiLevel: 'easy'
  };
}

// PUBLIC_INTERFACE
function App() {
  // Game state
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [nextPlayer, setNextPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [loading, setLoading] = useState(false);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(getInitialGameSettings());
  const [error, setError] = useState('');

  // Fetch new game on mount or when settings change
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // PUBLIC_INTERFACE
  async function startNewGame() {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vsAI: settings.vsAI,
          aiLevel: settings.aiLevel
        })
      });
      if (!resp.ok) throw new Error('Failed to start game');
      const data = await resp.json();
      setGameId(data.game_id);
      setBoard(data.board);
      setNextPlayer(data.next_player);
      setWinner(null);
      setIsDraw(false);
      setScores(data.scores || { X: 0, O: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  async function handleCellClick(idx) {
    if (loading || winner || isDraw || board[idx] != null) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API_URL}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          position: idx
        })
      });
      if (!resp.ok) throw new Error('Invalid move');
      const data = await resp.json();
      setBoard(data.board);
      setNextPlayer(data.next_player);
      setWinner(data.winner || null);
      setIsDraw(Boolean(data.is_draw));
      setScores(data.scores || scores);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  function openSidebar() {
    setSidebarOpen(true);
  }
  // PUBLIC_INTERFACE
  function closeSidebar() {
    setSidebarOpen(false);
  }

  // PUBLIC_INTERFACE
  function handleSettingsChange(e) {
    const { name, type, checked, value } = e.target;
    setSettings(s => ({
      ...s,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  // PUBLIC_INTERFACE
  function handleApplySettings(e) {
    e.preventDefault();
    setSidebarOpen(false);
    // startNewGame will be automatically triggered via settings change effect
  }

  // PUBLIC_INTERFACE
  function scoreText() {
    return (
      <div className="ttt-score-row">
        <span style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 22 }}>X&nbsp;
          <span className="score-num">{scores.X}</span>
        </span>
        <span style={{ margin: '0 18px', color: COLORS.secondary }}> VS </span>
        <span style={{ color: COLORS.secondary, fontWeight: 'bold', fontSize: 22 }}>O&nbsp;
          <span className="score-num">{scores.O}</span>
        </span>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function renderBoard() {
    return (
      <div className="ttt-board" aria-label="Tic Tac Toe Board">
        {board.map((cell, i) => (
          <button
            className="ttt-cell"
            key={i}
            aria-label={`cell ${i + 1} (${cell == null ? 'empty' : cell})`}
            onClick={() => handleCellClick(i)}
            disabled={!!cell || !!winner || isDraw || loading}
            style={{
              color:
                cell === 'X'
                  ? COLORS.primary
                  : cell === 'O'
                  ? COLORS.secondary
                  : COLORS.text
            }}
          >
            {cell}
          </button>
        ))}
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function renderStatus() {
    if (winner) {
      return (
        <span style={{ color: COLORS.accent, fontWeight: 'bold' }}>
          Winner: {winner}
        </span>
      );
    }
    if (isDraw) {
      return <span style={{ color: COLORS.text }}>Draw!</span>;
    }
    return (
      <span>
        Next: <span style={{
          color: nextPlayer === 'X' ? COLORS.primary : COLORS.secondary,
          fontWeight: 600
        }}>{nextPlayer}</span>
      </span>
    );
  }

  // PUBLIC_INTERFACE
  function renderControlButtons() {
    return (
      <div className="ttt-controls">
        <button
          className="ttt-btn"
          onClick={startNewGame}
          disabled={loading}
        >
          New Game
        </button>
        <button
          className="ttt-btn"
          onClick={openSidebar}
          type="button"
        >
          Settings
        </button>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function renderSidebar() {
    return (
      <>
        <div className={`ttt-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
        <aside className={`ttt-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <form onSubmit={handleApplySettings} className="ttt-sidebar-form">
            <h2 style={{ color: COLORS.primary, marginBottom: 18 }}>Settings</h2>
            <div className="ttt-sidebar-section">
              <label className="ttt-switch-label">
                <input
                  type="checkbox"
                  name="vsAI"
                  checked={settings.vsAI}
                  onChange={handleSettingsChange}
                />{' '}
                Play vs AI
              </label>
            </div>
            <div className="ttt-sidebar-section">
              <label>AI Difficulty:</label>
              <select
                name="aiLevel"
                value={settings.aiLevel}
                onChange={handleSettingsChange}
                disabled={!settings.vsAI}
              >
                <option value="easy">Easy</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="ttt-btn" type="submit">
                Apply and Restart
              </button>
            </div>
          </form>
        </aside>
      </>
    );
  }

  return (
    <div className="ttt-root">
      {/* Top bar with score */}
      <header className="ttt-header">
        <h1 className="ttt-title" style={{ color: COLORS.primary }}>Tic-Tac-Toe</h1>
        <div className="ttt-scoreboard" style={{
          background: COLORS.scoreBG,
          border: `1.5px solid ${COLORS.scoreBorder}`
        }}>
          {scoreText()}
        </div>
        <div className="ttt-status" style={{ marginTop: 8 }}>
          {renderStatus()}
        </div>
      </header>

      {/* Central board */}
      <main className="ttt-main">
        <section className="ttt-board-section">{renderBoard()}</section>
        <section className="ttt-controls-section">{renderControlButtons()}</section>
        {error && <div className="ttt-error">{error}</div>}
      </main>

      {/* Sidebar and overlay */}
      {renderSidebar()}

      {/* Minimal footer */}
      <footer className="ttt-footer">
        <span style={{ fontSize: 13, color: COLORS.text, opacity: 0.65 }}>
          &copy; {new Date().getFullYear()} Minimal Tic-Tac-Toe
        </span>
      </footer>
    </div>
  );
}

export default App;
