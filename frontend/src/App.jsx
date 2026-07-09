import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, User, FileText, Share2, Award, 
  Smile, Frown, Meh, Sparkles, Send, Bot, Check, 
  AlertCircle, Plus, Trash2, Search, BarChart3, Users,
  TrendingUp, Activity
} from 'lucide-react';

function App() {
  // --- Form State ---
  const [hcpSearch, setHcpSearch] = useState('');
  const [selectedHcp, setSelectedHcp] = useState(null);
  const [hcpSuggestions, setHcpSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [interactionType, setInteractionType] = useState('Meeting');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const [attendeeInput, setAttendeeInput] = useState('');
  const [attendees, setAttendees] = useState([]);
  
  const [topicsDiscussed, setTopicsDiscussed] = useState('');
  
  // Materials Shared Section
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialInput, setMaterialInput] = useState('');
  const [materialsShared, setMaterialsShared] = useState([]);

  // Samples Distributed Section
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [sampleInput, setSampleInput] = useState('');
  const [samplesDistributed, setSamplesDistributed] = useState([]);

  const [sentiment, setSentiment] = useState('Neutral');
  const [outcomes, setOutcomes] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');
  
  // AI suggestions list
  const [suggestedFollowUps, setSuggestedFollowUps] = useState([
    'Schedule follow-up meeting in 2 weeks',
    'Send OncoBoost Phase III PDF',
    'Add Dr. Sharma to advisory board invite list'
  ]);

  // --- API status & logging state ---
  const [allHcps, setAllHcps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { success: boolean, message: string }

  // --- AI Assistant Chat State ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Log interaction details here (e.g., 'Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure') or ask for help."
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- New Dashboard / Directory States ---
  const [activeTab, setActiveTab] = useState('log');
  
  // Stats State
  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  
  // Directory State
  const [directoryHcps, setDirectoryHcps] = useState([]);
  const [selectedDirHcp, setSelectedDirHcp] = useState(null);
  const [dirHcpHistory, setDirHcpHistory] = useState([]);
  const [dirHcpNextAction, setDirHcpNextAction] = useState('');
  const [isDirLoading, setIsDirLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const res = await fetch('/api/interactions/stats/summary');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch HCP Directory
  const fetchDirectory = async () => {
    setIsDirLoading(true);
    try {
      const res = await fetch('/api/hcp/');
      if (res.ok) {
        const data = await res.json();
        setDirectoryHcps(data);
        if (data.length > 0 && !selectedDirHcp) {
          handleSelectDirectoryHcp(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
    } finally {
      setIsDirLoading(false);
    }
  };

  // Fetch specific Doctor History & AI next action
  const handleSelectDirectoryHcp = async (hcp) => {
    setSelectedDirHcp(hcp);
    setIsHistoryLoading(true);
    setDirHcpNextAction('Generating next best action...');
    try {
      const histRes = await fetch(`/api/hcp/${hcp.id}/history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setDirHcpHistory(histData.history);
      }
      
      const actRes = await fetch(`/api/hcp/${hcp.id}/next-action`);
      if (actRes.ok) {
        const actData = await actRes.json();
        setDirHcpNextAction(actData.recommendation);
      }
    } catch (err) {
      console.error('Error fetching details for HCP:', err);
      setDirHcpNextAction('Could not load recommendation.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Trigger fetches when switching tabs
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchStats();
    } else if (activeTab === 'directory') {
      fetchDirectory();
    }
  }, [activeTab]);

  // --- Fetch initial HCP list ---
  const fetchHcps = async (searchVal = '') => {
    try {
      const res = await fetch(`/api/hcp/${searchVal ? `?search=${encodeURIComponent(searchVal)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setHcpSuggestions(data);
        if (!searchVal) {
          setAllHcps(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch HCPs:', err);
    }
  };

  useEffect(() => {
    fetchHcps();
    // Default date and time to today
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
    setTime(today.toTimeString().split(' ')[0].substring(0, 5));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // --- Search Autocomplete Handler ---
  const handleHcpSearchChange = (e) => {
    const val = e.target.value;
    setHcpSearch(val);
    if (val.trim()) {
      fetchHcps(val);
      setShowSuggestions(true);
    } else {
      setSelectedHcp(null);
      setHcpSuggestions(allHcps);
      setShowSuggestions(false);
    }
  };

  const selectHcp = (hcp) => {
    setSelectedHcp(hcp);
    setHcpSearch(hcp.name);
    setShowSuggestions(false);
  };

  // --- Add/Remove Lists Helpers ---
  const addAttendee = (e) => {
    e.preventDefault();
    if (attendeeInput.trim()) {
      setAttendees([...attendees, attendeeInput.trim()]);
      setAttendeeInput('');
    }
  };

  const removeAttendee = (index) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const addMaterial = (e) => {
    e.preventDefault();
    if (materialInput.trim()) {
      setMaterialsShared([...materialsShared, materialInput.trim()]);
      setMaterialInput('');
      setShowMaterialForm(false);
    }
  };

  const removeMaterial = (index) => {
    setMaterialsShared(materialsShared.filter((_, i) => i !== index));
  };

  const addSample = (e) => {
    e.preventDefault();
    if (sampleInput.trim()) {
      setSamplesDistributed([...samplesDistributed, sampleInput.trim()]);
      setSampleInput('');
      setShowSampleForm(false);
    }
  };

  const removeSample = (index) => {
    setSamplesDistributed(samplesDistributed.filter((_, i) => i !== index));
  };

  // Click on suggested follow-ups
  const handleAddSuggestion = (text) => {
    if (followUpActions) {
      setFollowUpActions(prev => prev + '\n' + text);
    } else {
      setFollowUpActions(text);
    }
  };

  // --- Voice Note Simulation ---
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const handleVoiceNote = () => {
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      // Simulate transcription text
      const transcript = "Met Dr. Rajesh Gupta at Fortis Hospital at 4:30 PM. We had a great video call. Discussed oncology trials. He was positive about trial progress. I provided them with clinical brochure. Follow up with him next Tuesday.";
      
      // Send to AI parser directly
      processAiInput(transcript);
    }, 2000);
  };

  // --- AI Chat Parsing Execution ---
  const processAiInput = async (text) => {
    setIsAiLoading(true);
    
    // Add user message to local state
    const newUserMessage = { id: Date.now(), role: 'user', content: text };
    setChatMessages(prev => [...prev, newUserMessage]);

    // Format chat history to send to backend (excluding local IDs)
    const history = chatMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (res.ok) {
        const data = await res.json();
        
        // If the LangGraph agent executed a tool and returned structured_data, populate the form
        if (data.structured_data) {
          const parsed = data.structured_data;
          if (parsed.interaction_type) setInteractionType(parsed.interaction_type);
          if (parsed.date) setDate(parsed.date);
          if (parsed.time) setTime(parsed.time);
          if (parsed.topics_discussed) setTopicsDiscussed(parsed.topics_discussed);
          if (parsed.sentiment) setSentiment(parsed.sentiment);
          if (parsed.outcomes) setOutcomes(parsed.outcomes);
          if (parsed.follow_up_actions) setFollowUpActions(parsed.follow_up_actions);
          
          if (parsed.attendees && parsed.attendees.length > 0) {
            setAttendees(parsed.attendees);
          }
          if (parsed.materials_shared && parsed.materials_shared.length > 0) {
            setMaterialsShared(parsed.materials_shared);
          }
          if (parsed.samples_distributed && parsed.samples_distributed.length > 0) {
            setSamplesDistributed(parsed.samples_distributed);
          }
          if (parsed.suggested_follow_ups && parsed.suggested_follow_ups.length > 0) {
            setSuggestedFollowUps(parsed.suggested_follow_ups);
          }

          // Try to match HCP name from database suggestions
          if (parsed.hcp_name) {
            const matchVal = parsed.hcp_name.toLowerCase().replace('dr.', '').trim();
            const matched = allHcps.find(h => h.name.toLowerCase().includes(matchVal));
            if (matched) {
              setSelectedHcp(matched);
              setHcpSearch(matched.name);
            } else {
              setHcpSearch(parsed.hcp_name);
              setSelectedHcp(null);
            }
          }
        }

        // Add LangGraph agent conversational reply
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.reply
        }]);

      } else {
        const errorData = await res.json();
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Error: ${errorData.detail || 'Could not process chat.'}`
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error connecting to LangGraph agent: ${err.message}`
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const text = chatInput.trim();
      setChatInput('');
      processAiInput(text);
    }
  };

  // --- Save Form to Database ---
  const handleLogInteractionSubmit = async (e) => {
    e.preventDefault();
    
    // Check if HCP is selected or typed
    let hcpId = selectedHcp?.id;

    if (!hcpId) {
      if (!hcpSearch.trim()) {
        setSubmitStatus({ success: false, message: 'Please select or enter an HCP Name.' });
        return;
      }
      
      // Auto-create HCP if not selected from suggestions
      try {
        setIsSubmitting(true);
        const hcpRes = await fetch('/api/hcp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: hcpSearch.trim(),
            specialty: 'Other',
            institution: 'General Practice',
            engagement_score: 5.0
          })
        });
        
        if (hcpRes.ok) {
          const newHcp = await hcpRes.json();
          hcpId = newHcp.id;
          setSelectedHcp(newHcp);
          // Refresh list
          fetchHcps();
        } else {
          setSubmitStatus({ success: false, message: 'Failed to create HCP profile.' });
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        setSubmitStatus({ success: false, message: `Error registering HCP: ${err.message}` });
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      hcp_id: hcpId,
      interaction_type: interactionType,
      date,
      time,
      attendees,
      topics_discussed: topicsDiscussed,
      materials_shared: materialsShared,
      samples_distributed: samplesDistributed,
      sentiment,
      outcomes,
      follow_up_actions: followUpActions,
      suggested_follow_ups: suggestedFollowUps
    };

    try {
      const res = await fetch('/api/interactions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitStatus({ success: true, message: 'Interaction successfully logged to the database!' });
        // Reset form except search
        setAttendees([]);
        setTopicsDiscussed('');
        setMaterialsShared([]);
        setSamplesDistributed([]);
        setSentiment('Neutral');
        setOutcomes('');
        setFollowUpActions('');
        
        // Reset dashboard & directory state to force fresh fetches on tab switch
        setStats(null);
        setDirectoryHcps([]);
        setSelectedDirHcp(null);
      } else {
        const errorData = await res.json();
        setSubmitStatus({ success: false, message: `Failed to save: ${errorData.detail || 'Unknown server error'}` });
      }
    } catch (err) {
      setSubmitStatus({ success: false, message: `Error saving interaction: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>AI-First HCP CRM</h1>
        
        {/* Navigation Tabs */}
        <div className="nav-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          <button 
            type="button"
            className={`nav-tab ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            <Calendar size={16} />
            Log Interaction
          </button>
          <button 
            type="button"
            className={`nav-tab ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <Users size={16} />
            HCP Directory
          </button>
          <button 
            type="button"
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} />
            Analytics Dashboard
          </button>
        </div>
      </header>

      {/* TAB 1: LOG INTERACTION (Form + Chat) */}
      {activeTab === 'log' && (
        <div className="main-layout">
          
          {/* Left Card: Interaction Details Form */}
          <div className="card">
            <h2>Interaction Details</h2>
            
            <form onSubmit={handleLogInteractionSubmit}>
              
              <div className="form-grid">
                
                {/* HCP Name (Autocomplete) */}
                <div className="form-group">
                  <label>HCP Name</label>
                  <div className="autocomplete-wrapper">
                    <div className="input-container">
                      <Search className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input has-icon" 
                        placeholder="Search or select HCP..."
                        value={hcpSearch}
                        onChange={handleHcpSearchChange}
                        onFocus={() => { if (hcpSuggestions.length > 0) setShowSuggestions(true); }}
                      />
                      {hcpSearch && (
                        <span 
                          className="input-icon-right" 
                          style={{ top: '12px' }}
                          onClick={() => {
                            setHcpSearch('');
                            setSelectedHcp(null);
                            setHcpSuggestions(allHcps);
                            setShowSuggestions(false);
                          }}
                        >
                          ×
                        </span>
                      )}
                    </div>
                    
                    {/* Auto-complete Suggestions Dropdown */}
                    {showSuggestions && hcpSuggestions.length > 0 && (
                      <div className="suggestions-dropdown" ref={suggestionsRef}>
                        {hcpSuggestions.map((hcp) => (
                          <div 
                            key={hcp.id} 
                            className="suggestion-item"
                            onClick={() => handleSelectHcp(hcp)}
                          >
                            <span className="suggestion-name">{hcp.name}</span>
                            <span className="suggestion-detail">{hcp.specialty} • {hcp.institution}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interaction Type */}
                <div className="form-group">
                  <label>Interaction Type</label>
                  <select 
                    className="form-select"
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value)}
                  >
                    <option value="Meeting">Meeting (In-person)</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Video Call">Video Call</option>
                    <option value="Email">Email</option>
                    <option value="Conference">Conference</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date */}
                <div className="form-group">
                  <label>Date</label>
                  <div className="input-container">
                    <Calendar className="input-icon" />
                    <input 
                      type="date" 
                      className="form-input has-icon"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="form-group">
                  <label>Time</label>
                  <div className="input-container">
                    <Clock className="input-icon" />
                    <input 
                      type="time" 
                      className="form-input has-icon"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Attendees */}
                <div className="form-group full-width">
                  <label>Attendees</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="input-container" style={{ flexGrow: 1 }}>
                      <User className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input has-icon"
                        placeholder="Add attendee name..."
                        value={attendeeInput}
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttendee(); } }}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-inline" 
                      style={{ padding: '10px 16px' }}
                      onClick={addAttendee}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  
                  {/* Attendees Badges */}
                  <div className="item-list">
                    {attendees.map((att, idx) => (
                      <div key={idx} className="item-badge">
                        <span>{att}</span>
                        <button type="button" onClick={() => removeAttendee(idx)}>×</button>
                      </div>
                    ))}
                    {attendees.length === 0 && <span className="empty-text">No attendees added.</span>}
                  </div>
                </div>

                {/* Topics Discussed */}
                <div className="form-group full-width">
                  <label>Topics Discussed</label>
                  <div className="input-container">
                    <FileText className="input-icon" style={{ top: '12px' }} />
                    <textarea 
                      className="form-input has-icon form-textarea"
                      placeholder="Details on medicine discussions, clinical studies, or products discussed..."
                      value={topicsDiscussed}
                      onChange={(e) => setTopicsDiscussed(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Voice Note Simulation Trigger */}
                  <button 
                    type="button" 
                    className="voice-note-btn"
                    onClick={handleVoiceNote}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <>
                        <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderLeftColor: 'var(--primary)', width: '12px', height: '12px' }}></div>
                        <span>Transcribing audio...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles />
                        <span>Simulate Dictate/Voice Note</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Materials Shared Box */}
                <div className="form-group full-width">
                  <div className="materials-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3>Materials Shared</h3>
                      {!showMaterialForm ? (
                        <button 
                          type="button" 
                          className="btn-inline"
                          onClick={() => setShowMaterialForm(true)}
                        >
                          <Plus size={12} /> Add Material
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-inline"
                          onClick={() => { setShowMaterialForm(false); setMaterialInput(''); }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {showMaterialForm && (
                      <div className="inline-add-form">
                        <input 
                          type="text" 
                          className="inline-add-input"
                          placeholder="Brochure or Clinical Trial PDF name..."
                          value={materialInput}
                          onChange={(e) => setMaterialInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMaterial(); } }}
                          autoFocus
                        />
                        <button 
                          type="button" 
                          className="btn-inline-submit"
                          onClick={addMaterial}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="item-list" style={{ marginTop: '8px' }}>
                      {materialsShared.map((mat, idx) => (
                        <div key={idx} className="item-badge" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                          <span>{mat}</span>
                          <button type="button" style={{ color: '#1e40af' }} onClick={() => removeMaterial(idx)}>×</button>
                        </div>
                      ))}
                      {materialsShared.length === 0 && <span className="empty-text">No materials shared.</span>}
                    </div>
                  </div>
                </div>

                {/* Samples Distributed Box */}
                <div className="form-group full-width">
                  <div className="materials-section" style={{ borderColor: '#fed7aa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ color: '#c2410c' }}>Samples Distributed</h3>
                      {!showSampleForm ? (
                        <button 
                          type="button" 
                          className="btn-inline"
                          style={{ borderColor: '#fed7aa' }}
                          onClick={() => setShowSampleForm(true)}
                        >
                          <Plus size={12} /> Add Sample
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-inline"
                          onClick={() => { setShowSampleForm(false); setSampleInput(''); }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {showSampleForm && (
                      <div className="inline-add-form">
                        <input 
                          type="text" 
                          className="inline-add-input"
                          placeholder="Medicine Sample name and Qty..."
                          value={sampleInput}
                          onChange={(e) => setSampleInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSample(); } }}
                          autoFocus
                        />
                        <button 
                          type="button" 
                          className="btn-inline-submit"
                          style={{ backgroundColor: '#ea580c' }}
                          onClick={addSample}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="item-list" style={{ marginTop: '8px' }}>
                      {samplesDistributed.map((sam, idx) => (
                        <div key={idx} className="item-badge" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                          <span>{sam}</span>
                          <button type="button" style={{ color: '#c2410c' }} onClick={() => removeSample(idx)}>×</button>
                        </div>
                      ))}
                      {samplesDistributed.length === 0 && <span className="empty-text">No samples distributed.</span>}
                    </div>
                  </div>
                </div>

                {/* Sentiment Radio Options */}
                <div className="form-group full-width">
                  <label>HCP Response Sentiment</label>
                  <div className="sentiment-group">
                    <label className="sentiment-option">
                      <input 
                        type="radio" 
                        name="sentiment" 
                        value="Positive"
                        checked={sentiment === 'Positive'}
                        onChange={() => setSentiment('Positive')}
                      />
                      <Smile size={16} color="#10b981" /> Positive
                    </label>
                    <label className="sentiment-option">
                      <input 
                        type="radio" 
                        name="sentiment" 
                        value="Neutral"
                        checked={sentiment === 'Neutral'}
                        onChange={() => setSentiment('Neutral')}
                      />
                      <Meh size={16} color="#64748b" /> Neutral
                    </label>
                    <label className="sentiment-option">
                      <input 
                        type="radio" 
                        name="sentiment" 
                        value="Negative"
                        checked={sentiment === 'Negative'}
                        onChange={() => setSentiment('Negative')}
                      />
                      <Frown size={16} color="#ef4444" /> Negative
                    </label>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="form-group full-width">
                  <label>Key Outcomes</label>
                  <div className="input-container">
                    <Award className="input-icon" style={{ top: '12px' }} />
                    <textarea 
                      className="form-input has-icon form-textarea"
                      placeholder="Doctor's interest level, next appointments scheduled, or agreements reached..."
                      value={outcomes}
                      onChange={(e) => setOutcomes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Follow-up Actions */}
                <div className="form-group full-width">
                  <label>Follow-up Actions & Reminders</label>
                  <div className="input-container">
                    <FileText className="input-icon" style={{ top: '12px' }} />
                    <textarea 
                      className="form-input has-icon form-textarea"
                      placeholder="Reminders of what you need to do next (e.g. email trials PDF, call to schedule webinar)..."
                      value={followUpActions}
                      onChange={(e) => setFollowUpActions(e.target.value)}
                    />
                  </div>

                  {/* AI Suggested Actions links box */}
                  {suggestedFollowUps.length > 0 && (
                    <div className="ai-suggestions-container">
                      <h4>AI Suggested Actions (Click to add)</h4>
                      {suggestedFollowUps.map((actionText, index) => (
                        <button 
                          key={index} 
                          type="button" 
                          className="ai-suggest-link"
                          onClick={() => handleAddSuggestion(actionText)}
                        >
                          + {actionText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Status Message */}
              {submitStatus && (
                <div className={`success-message ${!submitStatus.success ? 'error' : ''}`} style={{
                  backgroundColor: submitStatus.success ? '#ecfdf5' : '#fee2e2',
                  borderColor: submitStatus.success ? '#a7f3d0' : '#fecaca',
                  color: submitStatus.success ? '#065f46' : '#991b1b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    {submitStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{submitStatus.message}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting || !hcpSearch.trim() || !topicsDiscussed.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    <span>Saving Interaction...</span>
                  </>
                ) : (
                  <>
                    <FileText size={16} /> Log Interaction
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right Card: AI Assistant Panel */}
          <div className="card" style={{ alignSelf: 'stretch' }}>
            <div className="ai-assistant-header">
              <div className="ai-icon-container">
                <Bot />
              </div>
              <div className="ai-assistant-title">
                <h3>AI Assistant</h3>
                <p>Log interaction via chat</p>
              </div>
            </div>

            <div className="chat-box">
              
              <div className="chat-messages">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                    <div className="chat-bubble-inner">
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isAiLoading && (
                  <div className="chat-bubble assistant">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ borderTopColor: '#2563eb', borderLeftColor: '#2563eb' }}></div>
                      <span>AI is reading notes and filling form fields...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="chat-input-container">
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Describe interaction..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isAiLoading}
                />
                <button 
                  type="submit" 
                  className="btn-chat-send"
                  disabled={isAiLoading || !chatInput.trim()}
                >
                  <Send style={{ width: 14, height: 14 }} /> Log
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: HCP DIRECTORY & TIMELINE */}
      {activeTab === 'directory' && (
        <div className="directory-layout">
          {/* Left panel: List of HCPs */}
          <div className="card">
            <h2>HCP Directory</h2>
            {isDirLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '24px', height: '24px' }}></div>
              </div>
            ) : (
              <div className="hcp-list">
                {directoryHcps.map(hcp => (
                  <div 
                    key={hcp.id}
                    className={`hcp-card ${selectedDirHcp?.id === hcp.id ? 'active' : ''}`}
                    onClick={() => handleSelectDirectoryHcp(hcp)}
                  >
                    <h4>{hcp.name}</h4>
                    <p>{hcp.specialty} • {hcp.institution}</p>
                    <span className="hcp-score-badge">Engagement: {hcp.engagement_score}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Profile Details & Timeline */}
          <div className="card">
            {selectedDirHcp ? (
              <div className="hcp-profile-details">
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ borderBottom: 'none', marginBottom: '4px', paddingBottom: 0 }}>Dr. {selectedDirHcp.name}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedDirHcp.specialty} — {selectedDirHcp.institution}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="hcp-score-badge" style={{ fontSize: '13px', padding: '4px 10px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '4px' }}>
                        Engagement Score: {selectedDirHcp.engagement_score}/10
                      </span>
                    </div>
                  </div>

                  {/* AI Next Best Action Recommendation */}
                  <div className="next-action-box">
                    <div className="next-action-title">
                      <Sparkles size={14} fill="currentColor" />
                      AI Next Best Action
                    </div>
                    <div className="next-action-content">
                      {isHistoryLoading ? 'Analyzing history...' : dirHcpNextAction}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Interaction History & Timeline</h3>
                  
                  {isHistoryLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '24px', height: '24px' }}></div>
                    </div>
                  ) : dirHcpHistory.length === 0 ? (
                    <p className="empty-text" style={{ padding: '16px 0' }}>No interactions logged with this doctor yet.</p>
                  ) : (
                    <div className="timeline-container">
                      {dirHcpHistory.map(item => (
                        <div key={item.id} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-card">
                            <div className="timeline-header">
                              <span className="timeline-title">{item.interaction_type}</span>
                              <span className="timeline-date">{item.date} at {item.time ? item.time.substring(0, 5) : ''}</span>
                            </div>
                            <div className="timeline-body">
                              <div><strong>Topics discussed:</strong> {item.topics_discussed || 'N/A'}</div>
                              {item.outcomes && <div><strong>Outcomes:</strong> {item.outcomes}</div>}
                              {item.follow_up_actions && <div><strong>Follow-up actions:</strong> {item.follow_up_actions}</div>}
                              
                              <div className="timeline-meta">
                                <span className={`sentiment-pill ${item.sentiment ? item.sentiment.toLowerCase() : 'neutral'}`}>
                                  Sentiment: {item.sentiment || 'Neutral'}
                                </span>
                                {item.materials_shared && item.materials_shared.map((m, i) => (
                                  <span key={i} style={{ fontSize: '11px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px' }}>
                                    📦 {m}
                                  </span>
                                ))}
                                {item.samples_distributed && item.samples_distributed.map((s, i) => (
                                  <span key={i} style={{ fontSize: '11px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '4px' }}>
                                    🧪 {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <p>Select a doctor from the list to view profile timeline & next best actions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div>
          {isStatsLoading || !stats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '32px', height: '32px' }}></div>
            </div>
          ) : (
            <div>
              {/* Stats Summary KPIs Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.total_hcps}</span>
                    <span className="stat-label">Total HCP Profiles</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <Activity size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.total_interactions}</span>
                    <span className="stat-label">Interactions Logged</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    <Award size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.avg_engagement}/10</span>
                    <span className="stat-label">Avg Engagement Score</span>
                  </div>
                </div>
              </div>

              {/* Charts Display Grid */}
              <div className="charts-grid">
                
                {/* Sentiment Donut Chart */}
                <div className="chart-card">
                  <h3>Sentiment Distribution</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: '10px' }}>
                    {/* SVG Donut */}
                    {(() => {
                      const total = stats.sentiments.Positive + stats.sentiments.Neutral + stats.sentiments.Negative;
                      const pPct = total > 0 ? (stats.sentiments.Positive / total) * 100 : 0;
                      const nPct = total > 0 ? (stats.sentiments.Neutral / total) * 100 : 0;
                      const gPct = total > 0 ? (stats.sentiments.Negative / total) * 100 : 0;
                      
                      return (
                        <svg width="150" height="150" viewBox="0 0 160 160">
                          <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                          {pPct > 0 && (
                            <circle cx="80" cy="80" r="50" fill="transparent" stroke="#10b981" strokeWidth="18" 
                                    strokeDasharray={`${pPct * 3.14159} ${314.159 - pPct * 3.14159}`} 
                                    strokeDashoffset="0" transform="rotate(-90 80 80)" />
                          )}
                          {nPct > 0 && (
                            <circle cx="80" cy="80" r="50" fill="transparent" stroke="#64748b" strokeWidth="18" 
                                    strokeDasharray={`${nPct * 3.14159} ${314.159 - nPct * 3.14159}`} 
                                    strokeDashoffset={-pPct * 3.14159} transform="rotate(-90 80 80)" />
                          )}
                          {gPct > 0 && (
                            <circle cx="80" cy="80" r="50" fill="transparent" stroke="#ef4444" strokeWidth="18" 
                                    strokeDasharray={`${gPct * 3.14159} ${314.159 - gPct * 3.14159}`} 
                                    strokeDashoffset={-(pPct + nPct) * 3.14159} transform="rotate(-90 80 80)" />
                          )}
                          <text x="80" y="85" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--text-main)">
                            {total > 0 ? `${Math.round(pPct)}%` : '0%'}
                          </text>
                          <text x="80" y="102" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)">
                            Positive
                          </text>
                        </svg>
                      );
                    })()}

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        <span>Positive: <strong>{stats.sentiments.Positive}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#64748b' }} />
                        <span>Neutral: <strong>{stats.sentiments.Neutral}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        <span>Negative: <strong>{stats.sentiments.Negative}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interaction Channels Bar Chart */}
                <div className="chart-card">
                  <h3>Interaction Channels</h3>
                  {(() => {
                    const channels = [
                      { name: 'Meeting', count: stats.types.Meeting || 0, color: '#2563eb' },
                      { name: 'Phone Call', count: stats.types['Phone Call'] || 0, color: '#3b82f6' },
                      { name: 'Video Call', count: stats.types['Video Call'] || 0, color: '#8b5cf6' },
                      { name: 'Email', count: stats.types.Email || 0, color: '#ec4899' },
                      { name: 'Other', count: (stats.types.Conference || 0) + (stats.types.Webinar || 0) + (stats.types.Other || 0), color: '#64748b' }
                    ];
                    const maxVal = Math.max(...channels.map(c => c.count), 1);
                    return (
                      <svg width="100%" height="180" viewBox="0 0 300 180" style={{ maxWidth: '300px' }}>
                        <line x1="30" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="30" y1="70" x2="290" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="30" y1="120" x2="290" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="30" y1="145" x2="290" y2="145" stroke="#cbd5e1" strokeWidth="1" />
                        
                        {channels.map((chan, idx) => {
                          const x = 40 + idx * 50;
                          const barHeight = (chan.count / maxVal) * 110;
                          const y = 145 - barHeight;
                          return (
                            <g key={chan.name}>
                              <rect x={x} y={y} width="22" height={barHeight} fill={chan.color} rx="3" />
                              <text x={x + 11} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--text-main)">
                                {chan.count}
                              </text>
                              <text x={x + 11} y="160" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-muted)">
                                {chan.name.split(' ')[0]}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>

                {/* Engagement Leaderboard (Top 5 Doctors) */}
                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ marginBottom: '8px' }}>Top Engaged Doctors (Engagement Leaderboard)</h3>
                  {stats.top_hcps.length === 0 ? (
                    <p className="empty-text">No doctors registered yet.</p>
                  ) : (
                    <div className="leaderboard-list">
                      {stats.top_hcps.map(hcp => (
                        <div key={hcp.id} className="leaderboard-item">
                          <div className="leaderboard-meta">
                            <span>Dr. {hcp.name} ({hcp.specialty})</span>
                            <strong>{hcp.score}/10</strong>
                          </div>
                          <div className="leaderboard-bar-bg">
                            <div 
                              className="leaderboard-bar-fill"
                              style={{ width: `${(hcp.score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
