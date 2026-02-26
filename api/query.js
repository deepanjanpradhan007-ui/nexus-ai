// Nexus AI — Smart Multi-Model Router
// Vercel Serverless Function (api/query.js)
// All API keys stored in Vercel Environment Variables — never in code!

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY   = process.env.GROQ_API_KEY;

const MAX_PROMPT_CHARS = 2000;
const MAX_BODY_CHARS   = 8000;

const TOPIC_ROUTING = {
  math: { label:"Mathematics", icon:"📐", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are an expert mathematician. Provide clear step-by-step solutions with full working shown." },
  science: { label:"Science", icon:"🔬", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are an expert scientist. Explain concepts clearly and use real-world examples." },
  health: { label:"Health & Medicine", icon:"🏥", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are a knowledgeable medical advisor. Always recommend professional consultation for serious concerns." },
  coding: { label:"Coding & Tech", icon:"💻", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are an expert software engineer. Write clean, well-commented code and explain your approach." },
  history: { label:"History & Culture", icon:"📜", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are a historian. Provide rich context and multiple perspectives." },
  creative: { label:"Creative Writing", icon:"✍️", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are a gifted creative writer. Be imaginative, evocative, and original." },
  finance: { label:"Finance & Business", icon:"💰", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are a financial expert. Always note that advice is educational, not personalized financial advice." },
  general: { label:"General", icon:"🌐", models:[
    { provider:"openai", model:"gpt-4o-mini",            name:"GPT-4o mini"    },
    { provider:"groq",   model:"llama-3.3-70b-versatile",name:"Llama 3.3 70B"  },
    { provider:"gemini", model:"gemini-1.5-pro",          name:"Gemini 1.5 Pro" },
    { provider:"groq",   model:"mixtral-8x7b-32768",      name:"Mixtral 8x7B"  },
    { provider:"gemini", model:"gemini-2.0-flash-exp",    name:"Gemini 2.0 Flash"},
  ], systemHint:"You are a knowledgeable, helpful assistant. Be accurate, concise, and genuinely useful." }
};

function detectTopic(prompt) {
  const p = prompt.toLowerCase();
  const keywords = {
    math:    ["math","equation","solve","algebra","calculus","derivative","integral","matrix","probability","statistics","geometry","proof","formula","calculate","compute","arithmetic","fraction","polynomial","trigonometry","logarithm","vector"],
    science: ["physics","chemistry","biology","molecule","atom","cell","dna","evolution","quantum","relativity","thermodynamics","gravity","force","energy","reaction","element","orbit","planet","galaxy","photosynthesis","enzyme","protein","gene"],
    health:  ["health","medical","medicine","doctor","disease","symptom","pain","treatment","diagnosis","hospital","drug","medication","diet","nutrition","exercise","fitness","vitamin","cancer","diabetes","heart","blood","anxiety","depression","sleep","immune","virus","infection","vaccine"],
    coding:  ["code","program","function","class","variable","algorithm","debug","javascript","python","java","typescript","react","api","database","sql","html","css","git","docker","linux","bash","array","loop","recursion","framework","library","bug","error","compile","deploy","server","frontend","backend","software"],
    history: ["history","historical","war","empire","civilization","ancient","medieval","renaissance","revolution","battle","king","queen","president","century","dynasty","colonialism","culture","religion","politics","election","democracy","communism","capitalism","treaty","independence"],
    creative:["write","story","poem","fiction","creative","character","plot","narrative","script","dialogue","imagine","brainstorm","novel","metaphor","haiku","sonnet","essay","article","blog","describe","invent","fantasy","adventure","romance","thriller"],
    finance: ["money","finance","invest","stock","market","economy","budget","saving","loan","debt","tax","revenue","profit","business","startup","entrepreneur","trade","crypto","bitcoin","inflation","recession","portfolio","dividend","asset"]
  };
  const scores = {};
  for (const [topic, words] of Object.entries(keywords)) {
    scores[topic] = words.filter(w => p.includes(w)).length;
  }
  const best = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  return best[0][1] === 0 ? "general" : best[0][0];
}

function sanitizePrompt(raw) {
  if (typeof raw !== "string") return null;
  let clean = raw.replace(/\x00/g,"").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g,"").trim();
  const injectionPatterns = [
    /ignore (all |previous |above |prior )?instructions/i,
    /you are now/i, /disregard (your |all |any )?/i,
    /new (persona|role|identity)/i, /act as (a |an |if )?/i,
    /jailbreak/i, /do anything now/i,
    /bypass (your |all |safety )?/i, /pretend (you are|to be)/i,
  ];
  for (const p of injectionPatterns) { if (p.test(clean)) return null; }
  return clean.length > 0 ? clean : null;
}

const requestCounts = new Map();
const RATE_LIMIT = 20, RATE_WINDOW = 60*60*1000, CLEANUP_EVERY = 500;
let reqsSinceCleanup = 0;
function checkRateLimit(ip) {
  const now = Date.now();
  reqsSinceCleanup++;
  if (reqsSinceCleanup > CLEANUP_EVERY) {
    for (const [k,v] of requestCounts.entries()) {
      const fresh = v.filter(t => now-t < RATE_WINDOW);
      fresh.length === 0 ? requestCounts.delete(k) : requestCounts.set(k,fresh);
    }
    reqsSinceCleanup = 0;
  }
  const reqs = (requestCounts.get(ip)||[]).filter(t=>now-t<RATE_WINDOW);
  if (reqs.length >= RATE_LIMIT) return false;
  reqs.push(now); requestCounts.set(ip,reqs); return true;
}

async function queryGemini(prompt, model, name, systemHint) {
  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ system_instruction:{parts:[{text:systemHint}]}, contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:2048,temperature:0.7} }) }
    );
    if (!res.ok) { console.error(`Gemini error [${model}]: ${res.status}`); throw new Error("unavailable"); }
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { provider:"gemini", model, name, content, tokens:data.usageMetadata?.totalTokenCount||0, latency:Date.now()-start, success:true };
  } catch { return { provider:"gemini", model, name, content:"Unavailable", tokens:0, latency:Date.now()-start, success:false }; }
}

async function queryOpenAI(prompt, model, name, systemHint) {
  const start = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${OPENAI_API_KEY}`},
      body: JSON.stringify({ model, messages:[{role:"system",content:systemHint},{role:"user",content:prompt}], max_tokens:2048, temperature:0.7 })
    });
    if (!res.ok) { console.error(`OpenAI error [${model}]: ${res.status}`); throw new Error("unavailable"); }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { provider:"openai", model, name, content, tokens:data.usage?.total_tokens||0, latency:Date.now()-start, success:true };
  } catch { return { provider:"openai", model, name, content:"Unavailable", tokens:0, latency:Date.now()-start, success:false }; }
}

async function queryGroq(prompt, model, name, systemHint) {
  const start = Date.now();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${GROQ_API_KEY}`},
      body: JSON.stringify({ model, messages:[{role:"system",content:systemHint},{role:"user",content:prompt}], max_tokens:2048, temperature:0.7 })
    });
    if (!res.ok) { console.error(`Groq error [${model}]: ${res.status}`); throw new Error("unavailable"); }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { provider:"groq", model, name, content, tokens:data.usage?.total_tokens||0, latency:Date.now()-start, success:true };
  } catch { return { provider:"groq", model, name, content:"Unavailable", tokens:0, latency:Date.now()-start, success:false }; }
}

function queryModel(m, prompt, systemHint) {
  if (m.provider==="openai" && OPENAI_API_KEY) return queryOpenAI(prompt, m.model, m.name, systemHint);
  if (m.provider==="groq"   && GROQ_API_KEY)   return queryGroq(prompt,   m.model, m.name, systemHint);
  if (m.provider==="gemini" && GEMINI_API_KEY)  return queryGemini(prompt, m.model, m.name, systemHint);
  return Promise.resolve({ provider:m.provider, model:m.model, name:m.name, content:"API key not configured", tokens:0, latency:0, success:false });
}

function selectBestResponse(responses) {
  const valid = responses.filter(r => r.success && r.content.length > 20);
  if (valid.length === 0) return responses[0];
  const scored = valid.map(r => {
    let score = 0;
    const c = r.content, words = c.split(/\s+/).length;
    if (words >= 100 && words <= 800) score += 3; else if (words >= 50) score += 1;
    if (/(\n\d+\.|\n-|\n\*)/.test(c)) score += 2;
    if (c.includes("```")) score += 2;
    if (/\n#+\s/.test(c)) score += 1;
    if (/(example|for instance|such as|consider)/i.test(c)) score += 1;
    if (/(therefore|because|since|thus|however)/i.test(c)) score += 1;
    if (words < 30) score -= 3;
    if (/i (cannot|can't|am not able)/i.test(c)) score -= 2;
    const myWords = new Set(c.toLowerCase().match(/\b\w{5,}\b/g)||[]);
    for (const other of valid) {
      if (other.model === r.model) continue;
      const ow = new Set(other.content.toLowerCase().match(/\b\w{5,}\b/g)||[]);
      const overlap = [...myWords].filter(w=>ow.has(w)).length;
      const union   = new Set([...myWords,...ow]).size;
      if (union > 0) score += (overlap/union)*3;
    }
    return { ...r, score: Math.round(score*100)/100 };
  });
  return scored.sort((a,b) => b.score-a.score)[0];
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options",       "nosniff");
  res.setHeader("X-Frame-Options",              "DENY");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error:"Method not allowed" });

  if (!GEMINI_API_KEY && !OPENAI_API_KEY && !GROQ_API_KEY) {
    return res.status(500).json({ error:"Server misconfigured. Contact the site owner." });
  }

  const bodyStr = JSON.stringify(req.body||"");
  if (bodyStr.length > MAX_BODY_CHARS) return res.status(413).json({ error:"Request too large." });

  const rawIp    = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const clientIp = rawIp.split(",")[0].trim();
  if (!checkRateLimit(clientIp)) return res.status(429).json({ error:"Too many requests. Wait an hour and try again." });

  const prompt = sanitizePrompt(req.body?.prompt);
  if (!prompt) return res.status(400).json({ error:"Invalid or empty prompt." });
  if (prompt.length > MAX_PROMPT_CHARS) return res.status(400).json({ error:`Prompt too long. Max is ${MAX_PROMPT_CHARS} characters.` });

  try {
    const topicKey    = detectTopic(prompt);
    const topicConfig = TOPIC_ROUTING[topicKey] || TOPIC_ROUTING.general;
    const modelsToQuery = topicConfig.models.filter(m =>
      (m.provider==="gemini" && GEMINI_API_KEY) ||
      (m.provider==="openai" && OPENAI_API_KEY) ||
      (m.provider==="groq"   && GROQ_API_KEY)
    );
    const responses = await Promise.all(
      modelsToQuery.map(m => queryModel(m, prompt, topicConfig.systemHint))
    );
    const best = selectBestResponse(responses);
    return res.status(200).json({
      success:true,
      topic:{ key:topicKey, label:topicConfig.label, icon:topicConfig.icon },
      best,
      all: responses.map(r => ({ ...r, isBest: r.model===best.model })),
      timestamp: new Date().toISOString()
    });
  } catch(error) {
    console.error("Handler error:", error.message);
    return res.status(500).json({ error:"Something went wrong. Please try again." });
  }
}
