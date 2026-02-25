import { Link } from "react-router";
import { useState, useRef, useEffect } from "react";
import svgPaths from "../../imports/svg-oe8cws8da9";
import { getAgentResponse, containsDelayLanguage, containsResetLanguage } from "../utils/agentLayer";
import { shouldDeliverFriction } from "../utils/frictionEngine";
import { recordAgentInteraction, recordDelayLanguage, recordResetEvent, getBehaviorState, calculateAlignmentScore } from "../utils/behaviorStore";

interface Message {
  type: 'system' | 'ai' | 'user' | 'plan' | 'friction' | 'pattern';
  text: string;
  timestamp: string;
  mode?: string;
  planData?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      rest: string;
    }>;
  };
}

type Agent = "atlas" | "orion" | "kade";

interface AgentInfo {
  name: string;
  title: string;
  description: string;
  personality: string;
}

const agentData: Record<Agent, AgentInfo> = {
  atlas: {
    name: "Atlas",
    title: "The Enforcer",
    description: "A calm and firm guardian of discipline that establishes a non-negotiable baseline to protect your streaks against hesitation and rationalization.",
    personality: "firm and disciplined"
  },
  orion: {
    name: "Orion",
    title: "The Navigator",
    description: "A warm and strategic guide that intelligently adapts your training trajectory in real-time to navigate stress, injury, or schedule changes without breaking your flow.",
    personality: "adaptive and strategic"
  },
  kade: {
    name: "Kade",
    title: "The Rival",
    description: "A bold and playful competitor that gamifies your daily execution with high-stakes dares, challenges and benchmarks to shatter complacency and drive momentum.",
    personality: "competitive and bold"
  }
};

function CheckCircle() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p1e46b900} fill="#ff6600" />
      </svg>
    </div>
  );
}

function EmptyCircle() {
  return (
    <div className="flex items-center justify-center relative shrink-0 size-[20px]">
      <div className="relative rounded-full shrink-0 size-[16px] border-2 border-[#ff6600]" />
    </div>
  );
}

export default function AIAgent() {
  const [input, setInput] = useState("");
  const [currentAgent, setCurrentAgent] = useState<Agent>(() => {
    const saved = localStorage.getItem('trainingAgent');
    return (saved as Agent) || "atlas";
  });
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(currentAgent);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "system",
      text: "COMMAND CHANNEL ESTABLISHED",
      timestamp: "09:41"
    },
    {
      type: "ai",
      text: "Training protocol analysis complete. Six-day operational streak detected. System recommends calibration adjustment for optimal performance sustainability.",
      timestamp: "09:41"
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate alignment score on mount
  useEffect(() => {
    calculateAlignmentScore();
  }, []);

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      type: "user",
      text: input,
      timestamp: getTimestamp()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");

    // Record agent interaction
    recordAgentInteraction();

    // Check for delay/reset language (for friction engine tracking)
    if (containsDelayLanguage(userInput)) {
      recordDelayLanguage();
    }
    if (containsResetLanguage(userInput)) {
      recordResetEvent();
    }

    // Simulate AI response with agent layer integration
    setTimeout(() => {
      const lowerInput = userInput.toLowerCase();
      let aiResponse: Message;

      // First: check if plan-type response is needed
      if (lowerInput.includes('adjust') || lowerInput.includes('plan') || lowerInput.includes('recalibrate')) {
        aiResponse = {
          type: "plan",
          text: "Protocol recalibration initiated. Next operation sequence generated based on current performance metrics and recovery status.",
          timestamp: getTimestamp(),
          planData: {
            exercises: [
              { name: "Push-Up Module", sets: 4, reps: 15, rest: "60s" },
              { name: "Squat Protocol", sets: 4, reps: 20, rest: "90s" },
              { name: "Plank Hold", sets: 3, reps: 45, rest: "60s" },
              { name: "Burpee Sequence", sets: 3, reps: 12, rest: "120s" }
            ]
          }
        };
      } else if (lowerInput.includes('streak') || lowerInput.includes('check') || lowerInput.includes('status')) {
        const state = getBehaviorState();
        aiResponse = {
          type: "ai",
          text: `Current operational streak: ${state.streakDays} days. Alignment score: ${state.alignmentScore}. Completion rate: ${Math.round((state.workoutsCompletedThisWeek / Math.max(state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek, 1)) * 100)}%. Performance trajectory: ${state.alignmentScore >= 75 ? 'Ascending' : 'Requires attention'}.`,
          timestamp: getTimestamp()
        };
      } else if (lowerInput.includes('pain') || lowerInput.includes('injury')) {
        aiResponse = {
          type: "ai",
          text: "Pain indicator flagged. Suspending current protocol. Recommend consultation with medical operator. Alternative low-impact sequences available upon request.",
          timestamp: getTimestamp()
        };
      } else {
        // Use the agent conversational layer
        const { mode, response } = getAgentResponse(userInput);
        aiResponse = {
          type: mode === "patternReflection" ? "pattern" : "ai",
          text: response,
          timestamp: getTimestamp(),
          mode: mode
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);

      // Check if friction should be delivered (10-15% of eligible cases)
      setTimeout(() => {
        const frictionDecision = shouldDeliverFriction();
        if (frictionDecision.eligible) {
          const frictionMessage: Message = {
            type: "friction",
            text: frictionDecision.response,
            timestamp: getTimestamp(),
            mode: `friction:${frictionDecision.flag}`
          };
          setMessages(prev => [...prev, frictionMessage]);

          // If friction routes to a different agent, note it
          if (frictionDecision.agent !== currentAgent) {
            const routingMessage: Message = {
              type: "system",
              text: `ROUTING: ${agentData[frictionDecision.agent].name} — ${agentData[frictionDecision.agent].title}`,
              timestamp: getTimestamp()
            };
            setMessages(prev => [...prev, routingMessage]);
          }
        }
      }, 1200);
    }, 800);
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
    inputRef.current?.focus();
  };

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const confirmAgentChange = () => {
    setCurrentAgent(selectedAgent);
    localStorage.setItem('trainingAgent', selectedAgent);
    setShowAgentModal(false);
  };

  return (
    <div className="bg-black w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#ff6600] flex items-center justify-between shrink-0">
        <div className="flex-1">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
            Neural Interface
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[18px] text-[#ff6600] font-bold uppercase tracking-wider">
            Command Channel
          </div>
          <button
            onClick={() => setShowAgentModal(true)}
            className="mt-1 font-['JetBrains_Mono',monospace] text-[9px] text-white/60 hover:text-[#ff6600] uppercase tracking-wide transition-colors flex items-center gap-1"
          >
            <span>Agent: {agentData[currentAgent].name}</span>
            <span className="text-[#ff6600]">▸</span>
          </button>
        </div>
        <Link
          to="/app"
          className="size-10 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-3 border-b border-white/20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-[#ff6600] animate-pulse" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
              Online · {agentData[currentAgent].name} Active
            </div>
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
            Alignment: {getBehaviorState().alignmentScore}
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div key={idx} className={`${message.type === 'user' ? 'ml-6' : 'mr-6'}`}>
            {message.type === 'system' && (
              <div className="border-l-2 border-[#ff6600] pl-3 py-2">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-1">
                  {message.timestamp} • SYS
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
                  {message.text}
                </div>
              </div>
            )}
            
            {message.type === 'ai' && (
              <div className="border border-white/20 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-2">
                  {message.timestamp} • AGENT
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'plan' && (
              <div className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-2">
                  {message.timestamp} • PROTOCOL GENERATED
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed mb-3">
                  {message.text}
                </div>
                
                {/* Next Day Preview */}
                <div className="border-t border-[#ff6600]/30 pt-3 mt-2">
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider mb-2">
                    → Tomorrow's Sequence
                  </div>
                  <div className="space-y-2">
                    {message.planData?.exercises.map((exercise, i) => (
                      <div key={i} className="flex items-center justify-between text-[9px] border-b border-white/10 pb-1.5">
                        <span className="font-['JetBrains_Mono',monospace] text-white/80">
                          [{(i + 1).toString().padStart(2, '0')}] {exercise.name}
                        </span>
                        <span className="font-['JetBrains_Mono',monospace] text-white/60">
                          {exercise.sets}x{exercise.reps} • {exercise.rest}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {message.type === 'user' && (
              <div className="bg-[#ff6600]/10 border border-[#ff6600]/50 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600]/70 uppercase tracking-wider mb-2">
                  {message.timestamp} • INPUT
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'friction' && (
              <div className="border-l-[3px] border-[#ff6600] bg-[#ff6600]/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-2">
                  {message.timestamp} • CALIBRATED FRICTION
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white leading-[1.6]">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'pattern' && (
              <div className="border border-white/30 bg-white/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase tracking-wider mb-2">
                  {message.timestamp} • PATTERN ANALYSIS
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed whitespace-pre-line">
                  {message.text}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands - Compact */}
      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            "Recalibrate plan",
            "Report completion",
            "Check streak",
            "High fatigue",
            "Time constraint",
            "Pain/injury"
          ].map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCommand(cmd)}
              className="border border-white/20 px-2.5 py-1.5 text-left hover:border-[#ff6600] hover:bg-[#ff6600]/10 transition-colors whitespace-nowrap shrink-0"
            >
              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/70 flex items-center gap-1.5">
                <span className="text-[#ff6600]">&gt;</span>
                {cmd}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input - Fixed at Bottom */}
      <div className="p-4 border-t-2 border-[#ff6600] shrink-0 bg-black">
        <div className="flex items-center gap-2 border border-white/30 p-3">
          <span className="font-['JetBrains_Mono',monospace] text-[12px] text-[#ff6600]">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter command..."
            className="flex-1 bg-transparent font-['JetBrains_Mono',monospace] text-[11px] text-white outline-none placeholder:text-white/40"
          />
          <button
            onClick={handleSend}
            className="border border-[#ff6600] px-3 py-1 hover:bg-[#ff6600]/20 transition-colors"
          >
            <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
              Send
            </span>
          </button>
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Scanline effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
              backgroundSize: "100% 4px",
            }}
          />
          
          <div className="relative bg-black border-2 border-[#ff6600] p-6 w-full max-w-[340px] max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-white/20">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-1">
                System Configuration
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[16px] text-[#ff6600] font-bold uppercase tracking-wider">
                Select Training Agent
              </div>
            </div>

            {/* Agent Options */}
            <div className="space-y-4 mb-6">
              {Object.keys(agentData).map((agentKey) => {
                const agent = agentKey as Agent;
                const agentInfo = agentData[agent];
                return (
                  <button
                    key={agent}
                    onClick={() => handleAgentChange(agent)}
                    className={`relative w-full bg-white/5 border p-4 flex items-start gap-3 transition-all text-left ${
                      selectedAgent === agent
                        ? "border-[#ff6600] bg-[#ff6600]/10"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {/* Selection Indicator */}
                    <div className="shrink-0 mt-0.5">
                      {selectedAgent === agent ? <CheckCircle /> : <EmptyCircle />}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="font-['JetBrains_Mono',monospace] text-[12px] text-[#ff6600] font-bold uppercase tracking-wide mb-1">
                        {agentInfo.name} - {agentInfo.title}
                      </div>
                      <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/70 leading-relaxed">
                        {agentInfo.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/20">
              <button
                onClick={() => setShowAgentModal(false)}
                className="flex-1 border border-white/30 py-2.5 hover:bg-white/5 transition-colors"
              >
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-white/70 uppercase tracking-wide">
                  Cancel
                </span>
              </button>
              <button
                onClick={confirmAgentChange}
                className="flex-1 border-2 border-[#ff6600] bg-[#ff6600]/10 py-2.5 hover:bg-[#ff6600]/20 transition-colors"
              >
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wide font-bold">
                  Confirm
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}