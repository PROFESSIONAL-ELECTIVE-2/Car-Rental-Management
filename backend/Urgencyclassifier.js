
const HIGH_KEYWORDS = [
    { term: 'urgent', weight: 10 },
    { term: 'emergency', weight: 10 },
    { term: 'asap', weight: 9 },
    { term: 'immediately', weight: 9 },
    { term: 'right away', weight: 8 },
    { term: 'broken down', weight: 9 },
    { term: 'accident', weight: 10 },
    { term: 'stranded', weight: 10 },
    { term: 'stolen', weight: 10 },
    { term: 'overcharge', weight: 8 },
    { term: 'fraud', weight: 10 },
    { term: 'naaksidente', weight: 10 },
    { term: 'nasiraan', weight: 9 },
    { term: 'tulong', weight: 8 },
    { term: 'flight', weight: 6 }, 
    { term: 'airport', weight: 5 }
];

const MEDIUM_KEYWORDS = [
    { term: 'question', weight: 2 },
    { term: 'availability', weight: 3 },
    { term: 'booking', weight: 2 },
    { term: 'reservation', weight: 2 },
    { term: 'price', weight: 1 },
    { term: 'quote', weight: 3 },
    { term: 'cancel', weight: 4 },
    { term: 'issue', weight: 3 },
    { term: 'tomorrow', weight: 3 },
    { term: 'magkano', weight: 2 },
    { term: 'pahabol', weight: 3 }
];

const LOW_KEYWORDS = [
    { term: 'feedback', weight: 3 },
    { term: 'suggestion', weight: 3 },
    { term: 'no rush', weight: 5 },
    { term: 'whenever', weight: 4 },
    { term: 'next month', weight: 4 },
    { term: 'future', weight: 3 },
    { term: 'satisfied', weight: 3 }
];


function isNegated(text, term) {
    const regex = new RegExp(`(?:not|no|none|never)\\s+${term}`, 'i');
    return regex.test(text);
}

function scoreKeywords(text, list) {
    let score = 0;
    const matched = [];
    
    list.forEach(({ term, weight }) => {

        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(text)) {
            if (isNegated(text, term)) {
                score -= (weight * 0.5); 
            } else {
                score += weight;
                matched.push({ term, weight });
            }
        }
    });
    return { score, matched };
}

function extractTimeSignals(text) {
    let score = 0;
    const found = [];
    
    if (/\d{1,2}:\d{2}\s*(am|pm)/i.test(text)) { score += 5; found.push('Specific time'); }
    if (/\b(today|tonight|morning)\b/i.test(text)) { score += 4; found.push('Current day focus'); }
    if (/\b(within|in)\s+\d+\s+(hour|min)/i.test(text)) { score += 7; found.push('Immediate window'); }
    
    return { score, found };
}

function extractSentimentSignals(text) {
    let score = 0;
    const found = [];

    const excl = (text.match(/!/g) || []).length;
    if (excl > 2) { score += Math.min(excl, 5); found.push('Multiple exclamation marks'); }

    const caps = (text.match(/\b[A-Z]{4,}\b/g) || []).length;
    if (caps > 1) { score += Math.min(caps * 1.5, 6); found.push('Shouting (All Caps)'); }

    return { score, found };
}



export function classifyUrgency(message = '', subject = '') {
    const cleanMessage = message || '';
    const cleanSubject = subject || '';
    const fullText = `${cleanSubject} ${cleanMessage}`;

    const highResult = scoreKeywords(fullText, HIGH_KEYWORDS);
    const medResult = scoreKeywords(fullText, MEDIUM_KEYWORDS);
    const lowResult = scoreKeywords(fullText, LOW_KEYWORDS);
    const timeResult = extractTimeSignals(fullText);
    const sentimentResult = extractSentimentSignals(cleanMessage);

    const subjectHigh = scoreKeywords(cleanSubject, HIGH_KEYWORDS);
    const subjectBonus = subjectHigh.score * 0.75;

    let finalScore = highResult.score;
    
    finalScore += subjectBonus;
    
    finalScore += timeResult.score;

    finalScore += Math.min(sentimentResult.score, 6);

    const medContribution = highResult.score > 0 
        ? Math.min(medResult.score * 0.3, 4) 
        : Math.min(medResult.score * 0.5, 7);
    finalScore += medContribution;

    finalScore -= lowResult.score;

    let urgency = 'low';
    const normalizedScore = Math.max(0, finalScore);

    if (normalizedScore >= 12 || highResult.score >= 9) {
        urgency = 'high';
    } else if (normalizedScore >= 4 || timeResult.score > 0) {
        urgency = 'medium';
    }

    return {
        urgency,
        score: Math.round(normalizedScore * 10) / 10,
        breakdown: {
            highMatched: highResult.matched.map(m => m.term),
            timeMatched: timeResult.found,
            sentimentImpact: sentimentResult.found.length > 0,
            isSubjectPrioritized: subjectBonus > 0
        },
        confidence: 'rule-based-v2'
    };
}

export function buildUrgencyReport(messages = []) {
    return messages.reduce((acc, msg) => {
        const type = msg.urgency || 'unclassified';
        acc[type] = (acc[type] || 0) + 1;
        if (type === 'high' && msg.status === 'Unread') acc.highUnread++;
        acc.total++;
        return acc;
    }, { total: 0, high: 0, medium: 0, low: 0, unclassified: 0, highUnread: 0 });
}