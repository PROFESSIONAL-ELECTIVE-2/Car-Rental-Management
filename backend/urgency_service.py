

from __future__ import annotations

import re
import os
from dataclasses import dataclass, field, asdict
from typing import Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow Node.js backend on a different port to reach this service


# ─── Data structures ──────────────────────────────────────────────────────────

@dataclass
class Keyword:
    term: str
    weight: float


@dataclass
class ClassifyResult:
    urgency: str          # 'high' | 'medium' | 'low'
    score: float
    breakdown: dict
    confidence: str = 'rule-based-v3'


# ─── Keyword lists ────────────────────────────────────────────────────────────
#
# HIGH   — weights 5–10.  A single strong match can reach the HIGH threshold.
# MEDIUM — weights 1–4.  Many medium matches reach MEDIUM but not HIGH because
#          their contribution is capped in the scoring formula.
# LOW    — weights 2–5.  These are subtracted from the final score.
#
# Improvements over the JS version:
#   • Expanded Filipino vocabulary (Tagalog + Taglish)
#   • Added domain-specific rental terms ('wrong vehicle', 'late return', etc.)
#   • Negation detection uses word-boundary regex, not simple prefix match
#   • Sentiment thresholds tuned (1+ exclamation marks counts, not 2+)
#   • Multi-word phrases checked before single words to prevent double-counting

HIGH_KEYWORDS: list[Keyword] = [
    # Direct urgency
    Keyword('urgent',               10),
    Keyword('emergency',            10),
    Keyword('asap',                  9),
    Keyword('as soon as possible',   9),
    Keyword('immediately',           9),
    Keyword('right away',            8),
    Keyword('right now',             7),
    Keyword('need it now',           9),

    # Vehicle / road failure
    Keyword('broken down',           9),
    Keyword('broke down',            9),
    Keyword('not working',           7),
    Keyword('accident',              9),
    Keyword('naaksidente',          10),
    Keyword('stranded',             10),
    Keyword('stuck on the',          7),
    Keyword('stuck in traffic',      6),
    Keyword('flat tire',             7),
    Keyword('engine failure',        9),
    Keyword('wont start',            7),
    Keyword("won't start",           7),

    # Safety / crime
    Keyword('stolen',               10),
    Keyword('theft',                10),
    Keyword('hijacked',             10),

    # Billing abuse
    Keyword('fraud',                10),
    Keyword('scam',                 10),
    Keyword('overcharge',            8),
    Keyword('charged twice',         9),
    Keyword('double charge',         9),
    Keyword('unauthorized charge',   9),

    # Service failure with urgency
    Keyword('wrong vehicle',         8),
    Keyword('wrong car',             8),
    Keyword('cancelled without notice', 9),
    Keyword('late return',           6),
    Keyword('cant return',           7),
    Keyword("can't return",          7),

    # Time-critical today signals (HIGH weight only when no other rescue)
    Keyword('tonight',               7),
    Keyword('this morning',          7),
    Keyword('this afternoon',        7),
    Keyword('this evening',          7),

    # Filipino high-urgency
    Keyword('nasiraan',              9),
    Keyword('nasira',                8),
    Keyword('tulong',                8),
    Keyword('tulungan niyo',         9),
    Keyword('tulungan mo',           9),
    Keyword('hindi gumagana',        7),
    Keyword('sira ang',              8),
    Keyword('kailangan ko na',       9),
    Keyword('ngayon na',             9),
    Keyword('kailangan ngayon',      9),
    Keyword('matulungan',            7),
    Keyword('aksidente',             9),
]

MEDIUM_KEYWORDS: list[Keyword] = [
    Keyword('question',              2),
    Keyword('inquiry',               2),
    Keyword('availability',          2),
    Keyword('available',             2),
    Keyword('booking',               1),
    Keyword('reservation',           2),
    Keyword('reserve',               2),
    Keyword('schedule',              2),
    Keyword('price',                 1),
    Keyword('rate',                  1),
    Keyword('cost',                  1),
    Keyword('quote',                 3),
    Keyword('this week',             3),
    Keyword('next week',             2),
    Keyword('this weekend',          2),
    Keyword('how much',              2),
    Keyword('cancel',                3),
    Keyword('problem',               3),
    Keyword('issue',                 2),
    Keyword('concern',               2),
    Keyword('today',                 2),   # standalone "today" = medium
    Keyword('tomorrow',              2),
    Keyword('flight',                4),   # flight context = medium (HIGH if paired)
    Keyword('airport',               3),
    Keyword('pahabol',               3),

    # Filipino medium
    Keyword('magkano',               2),
    Keyword('pwede ba',              2),
    Keyword('mayroon ba',            2),
    Keyword('bukas',                 2),
    Keyword('tanong ko lang',        2),
    Keyword('gusto ko',              1),
    Keyword('sa susunod na linggo',  2),
]

LOW_KEYWORDS: list[Keyword] = [
    Keyword('feedback',              3),
    Keyword('suggestion',            3),
    Keyword('just wanted',           3),
    Keyword('when you get a chance', 4),
    Keyword('when you have time',    4),
    Keyword('no rush',               5),
    Keyword('whenever',              4),
    Keyword('next month',            4),
    Keyword('future reference',      3),
    Keyword('satisfied',             3),
    Keyword('compliment',            3),
    Keyword('great service',         3),
    Keyword('hello',         3),
    Keyword('nice',         3),
    Keyword('wow',         3),

    # Filipino low
    Keyword('salamat',               2),
    Keyword('susunod na buwan',      3),
    Keyword('walang madalian',       5),
    Keyword('hindi urgent',          6),   # explicit negation of urgency
]


# ─── Negation detector ────────────────────────────────────────────────────────

# Negation window: looks for NOT/NO/NEVER within 3 words before the term
_NEGATION_PREFIX = r'(?:not|no|none|never|hindi|wala)\s+(?:\w+\s+){0,2}'

def classify_urgency(message: str, subject: str = '') -> ClassifyResult:

    if len(message.strip()) < 3:
        return ClassifyResult(
            urgency='low',
            score=0.0,
            breakdown={'note': 'Message too short to classify'},
        )
    
def _is_negated(text: str, term: str) -> bool:
    """Return True if `term` appears to be negated in `text`."""
    escaped = re.escape(term)
    pattern = _NEGATION_PREFIX + escaped
    return bool(re.search(pattern, text, re.IGNORECASE))


# ─── Keyword scorer ────────────────────────────────────────────────────────────

def _score_keywords(text: str, keywords: list[Keyword]) -> tuple[float, list[str]]:
    """
    Score `text` against a keyword list.
    Multi-word phrases are matched with word boundaries.
    Returns (raw_score, list_of_matched_terms).
    """
    lower = text.lower()
    score  = 0.0
    matched: list[str] = []
    seen: set[str] = set()   # prevent a substring match from double-counting

    # Sort longest term first so multi-word phrases are checked before subwords
    for kw in sorted(keywords, key=lambda k: len(k.term), reverse=True):
        term = kw.term.lower()
        # Skip if a longer phrase already consumed this text position
        if any(term in s for s in seen):
            continue
        # Word-boundary pattern (handles Unicode-friendly boundaries)
        pattern = r'(?<![a-z])' + re.escape(term) + r'(?![a-z])'
        if re.search(pattern, lower):
            if _is_negated(lower, term):
                score -= kw.weight * 0.5   # negated: partial penalty
            else:
                score += kw.weight
                matched.append(term)
                seen.add(term)

    return score, matched


# ─── Time signal detector ─────────────────────────────────────────────────────

def _extract_time_signals(text: str) -> tuple[float, list[str]]:
    """Detect near-future time references that amplify urgency."""
    score  = 0.0
    found: list[str] = []

    if re.search(r'\d{1,2}:\d{2}\s*(am|pm)', text, re.IGNORECASE):
        score += 5; found.append('specific time of day')

    if re.search(r'\d{1,2}\s*(am|pm)\b', text, re.IGNORECASE):
        score += 4; found.append('am/pm time reference')

    if re.search(r'within\s+\d+\s+hour', text, re.IGNORECASE):
        score += 7; found.append('hours-level deadline')

    if re.search(r'\d+[\s-]hour', text, re.IGNORECASE):
        score += 5; found.append('N-hour window')

    if re.search(r'in\s+\d+\s+(minutes?|hours?|days?)', text, re.IGNORECASE):
        score += 5; found.append('relative deadline')

    # Date pattern: Dec 25, 12/25, 25-12-2025
    if re.search(r'\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b', text):
        score += 3; found.append('specific date')
    if re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}',
                 text, re.IGNORECASE):
        score += 3; found.append('month-day date')

    return score, found


# ─── Sentiment amplifier detector ─────────────────────────────────────────────

def _extract_sentiment_signals(text: str) -> tuple[float, list[str]]:
    """Detect frustration/distress markers that amplify an already-urgent message."""
    score  = 0.0
    found: list[str] = []

    excl = len(re.findall(r'!', text))
    if excl >= 1:
        score += min(excl * 1.5, 5)
        found.append(f'{excl} exclamation mark(s)')

    caps_words = re.findall(r'\b[A-Z]{3,}\b', text)
    if caps_words:
        score += min(len(caps_words) * 2, 7)
        found.append(f'{len(caps_words)} ALL CAPS word(s)')

    qs = len(re.findall(r'\?', text))
    if qs > 2:
        score += min(qs, 3)
        found.append(f'{qs} question marks')

    word_count = len(text.split())
    if word_count > 80:
        score += 3
        found.append('long message (80+ words)')

    return score, found


# ─── Core classifier ──────────────────────────────────────────────────────────

def classify_urgency(message: str, subject: str = '') -> ClassifyResult:
    """
    Classify a contact message into 'high', 'medium', or 'low' urgency.

    Scoring formula
    ---------------
    1.  High keyword score                        (full weight)
    2.  Subject-line high keyword bonus           (+75% extra if urgent word in subject)
    3.  Time-pressure signals                     (full weight)
    4.  Sentiment amplifiers                      (capped at 6, dampened ×0.4)
    5.  Medium keyword contribution               (capped — cannot push LOW → HIGH alone)
        • No high match: min(med_score × 0.5, 8)
        • With high match: min(med_score × 0.25, 3)   [co-signal boost]
    6.  Low keyword penalty                       (subtracted)

    Thresholds
    ----------
    HIGH   : final_score ≥ 10
    MEDIUM : final_score ≥ 1  AND (medium keyword OR time signal present)
    LOW    : everything else
    """
    full_text = f'{subject} {message}'

    high_score,  high_matched  = _score_keywords(full_text, HIGH_KEYWORDS)
    med_score,   med_matched   = _score_keywords(full_text, MEDIUM_KEYWORDS)
    low_score,   low_matched   = _score_keywords(full_text, LOW_KEYWORDS)
    time_score,  time_found    = _extract_time_signals(full_text)
    sent_score,  sent_found    = _extract_sentiment_signals(message)

    subj_high, _ = _score_keywords(subject, HIGH_KEYWORDS)
    subject_bonus = subj_high * 0.75

    if high_score > 0:
        med_contribution = min(med_score * 0.25, 3)   
    elif med_score > 0:
        med_contribution = min(med_score * 0.5, 8)    
    else:
        med_contribution = 0.0

    final_score = (
        high_score
        + subject_bonus
        + time_score
        + min(sent_score * 0.4, 6)   
        + med_contribution
        - low_score
    )
    final_score = max(0.0, final_score)

    
    has_medium_signal = bool(med_matched or time_found)

    if final_score >= 10:
        urgency = 'high'
    elif final_score >= 3 and has_medium_signal:
        urgency = 'medium'
    else:
        urgency = 'low'

    breakdown = {
        'highKeywords':     high_matched,
        'mediumKeywords':   med_matched,
        'lowKeywords':      low_matched,
        'timeSignals':      time_found,
        'sentimentSignals': sent_found,
        'subjectBonus':     round(subject_bonus, 2),
        'rawScore':         round(final_score, 2),
    }

    return ClassifyResult(
        urgency=urgency,
        score=round(final_score, 2),
        breakdown=breakdown,
    )


def build_urgency_report(messages: list[dict]) -> dict:
    """
    Summarise urgency distribution across a list of message dicts.
    Each dict must have 'urgency' (str|None) and 'status' (str) keys.
    """
    report = {'total': 0, 'high': 0, 'medium': 0, 'low': 0,
              'unclassified': 0, 'highUnread': 0}
    for msg in messages:
        report['total'] += 1
        urg = msg.get('urgency') or 'unclassified'
        if urg in report:
            report[urg] += 1
        else:
            report['unclassified'] += 1
        if urg == 'high' and msg.get('status') == 'Unread':
            report['highUnread'] += 1
    return report



@app.route('/health', methods=['GET'])
def health():
    """Liveness check — Node backend polls this before routing requests."""
    return jsonify({'status': 'ok', 'service': 'urgency-classifier', 'version': 'v3'})


@app.route('/classify', methods=['POST'])
def classify():
    """
    Classify a single message.

    Body (JSON):
        { "message": "...", "subject": "..." }

    Response:
        { "urgency": "high"|"medium"|"low",
          "score": 14.5,
          "breakdown": { ... },
          "confidence": "rule-based-v3" }
    """
    body    = request.get_json(silent=True) or {}
    message = str(body.get('message', '')).strip()
    subject = str(body.get('subject', '')).strip()

    if not message:
        return jsonify({'error': 'message field is required'}), 400

    result = classify_urgency(message, subject)
    return jsonify(asdict(result))


@app.route('/classify/batch', methods=['POST'])
def classify_batch():
    """
    Classify multiple messages in one request.

    Body (JSON):
        { "messages": [ { "id": "...", "message": "...", "subject": "..." }, ... ] }

    Response:
        { "results": [ { "id": "...", "urgency": "...", "score": ..., ... }, ... ] }
    """
    body     = request.get_json(silent=True) or {}
    messages = body.get('messages', [])

    if not isinstance(messages, list) or not messages:
        return jsonify({'error': 'messages must be a non-empty array'}), 400

    results = []
    for item in messages:
        msg_id  = item.get('id', '')
        message = str(item.get('message', '')).strip()
        subject = str(item.get('subject', '')).strip()
        if not message:
            results.append({'id': msg_id, 'error': 'message is required'})
            continue
        result = classify_urgency(message, subject)
        results.append({'id': msg_id, **asdict(result)})

    return jsonify({'results': results})


@app.route('/reclassify', methods=['POST'])
def reclassify():
    
    body     = request.get_json(silent=True) or {}
    messages = body.get('messages', [])

    if not isinstance(messages, list):
        return jsonify({'error': 'messages must be an array'}), 400

    results = []
    for item in messages:
        doc_id  = item.get('_id', item.get('id', ''))
        message = str(item.get('message', '')).strip()
        subject = str(item.get('subject', '')).strip()
        if not message:
            continue
        result = classify_urgency(message, subject)
        results.append({'_id': doc_id, **asdict(result)})

    return jsonify({'updated': len(results), 'results': results})


@app.route('/report', methods=['POST'])
def report():
    body     = request.get_json(silent=True) or {}
    messages = body.get('messages', [])

    if not isinstance(messages, list):
        return jsonify({'error': 'messages must be an array'}), 400

    return jsonify(build_urgency_report(messages))


@app.errorhandler(404)
def not_found(_):
    return jsonify({'error': 'endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(_):
    return jsonify({'error': 'method not allowed'}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'internal server error', 'detail': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('URGENCY_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    print(f'Urgency classifier service starting on port {port}')
    print(f'  POST http://localhost:{port}/classify')
    print(f'  POST http://localhost:{port}/classify/batch')
    print(f'  POST http://localhost:{port}/reclassify')
    print(f'  POST http://localhost:{port}/report')
    print(f'  GET  http://localhost:{port}/health')
    app.run(host='0.0.0.0', port=port, debug=debug)