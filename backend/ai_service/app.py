from flask import Flask, request, jsonify
import random
import os  # ⭐ Added this missing import to fix your error

app = Flask(__name__)

# --- NEW: LOAD EXTERNAL NEGATIVE WORDS ---
def load_negative_words():
    # Construct path relative to this script
    file_path = os.path.join(os.path.dirname(__file__), 'negative-words.txt')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read lines, strip whitespace, and filter out empty lines
            return [line.strip().lower() for line in f if line.strip()]
    except FileNotFoundError:
        print("Warning: negative-words.txt not found in backend/ai_service. Using fallback list.")
        return ["bad", "sad", "fail", "tired"]

def load_positive_words():
    # Construct path relative to this script
    file_path = os.path.join(os.path.dirname(__file__), 'positive-words.txt')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read lines, strip whitespace, and filter out empty lines
            return [line.strip().lower() for line in f if line.strip()]
    except FileNotFoundError:
        print("Warning: positive-words.txt not found in backend/ai_service. Using fallback list.")
        return ["good", "happy", "amazing", "joyful"]



# Initial load of external dictionary
NEGATIVE_WORDS = load_negative_words()
POSITIVE_WORDS = load_positive_words()

# --- ROUTE 1: QUANTITATIVE RECOMMENDATIONS (Existing) ---
@app.route('/recommend', methods=['POST'])
def get_recommendation():
    data = request.get_json()
    mood_score = data.get('mood_score', 5)  
    tasks_count = data.get('incomplete_tasks_count', 0) 

    high_tips = [
        "بہترین! آپ کا موڈ بہت اچھا ہے، اسے برقرار رکھیں۔ (Excellent! Your mood is great, keep it up.)",
        "شاندار! آج کا دن آپ کی ترقی کے لیے بہترین ہے۔ (Fantastic! Today is a great day for your progress.)"
    ]
    neutral_tips = [
        "آپ کا موڈ ٹھیک ہے۔ تھوڑی سی ورزش آپ کو مزید بہتر محسوس کرائے گی۔ (Your mood is okay. A little exercise will make you feel even better.)",
        "آج کا دن پرسکون ہے۔ اپنی پسند کا کوئی چھوٹا کام کریں۔ (Today is a calm day. Do something small that you enjoy.)"
    ]
    low_tips = [
        "آپ کا موڈ تھوڑا کم معلوم ہو رہا ہے۔ کیا آپ 10 منٹ کی واک کرنا پسند کریں گے؟ (Your mood seems low. Would you like to take a 10-minute walk?)",
        "آج خود پر زیادہ بوجھ نہ ڈالیں۔ تھوڑا آرام کریں۔ (Don't overwork yourself today. Take some rest.)"
    ]

    if mood_score >= 8:
        recommendation = random.choice(high_tips)
    elif mood_score < 4:
        recommendation = random.choice(low_tips)
    elif tasks_count > 5:
        recommendation = "You have a lot of tasks. Try the 'Pomodoro' technique! (پومودورو تکنیک آزمائیں!)"
    else:
        recommendation = random.choice(neutral_tips)

    return jsonify({
        "status": "success",
        "recommendation": recommendation
    })

# --- ROUTE 2: QUALITATIVE SENTIMENT ANALYSIS (NEW) ---
@app.route('/analyze_text', methods=['POST'])
def analyze_text():
    data = request.get_json()
    user_text = data.get('text', '').lower()
    
    # Check against loaded external list
    if any(word in user_text for word in NEGATIVE_WORDS):
        return jsonify({
            "english": "It sounds like you're having a hard time. Be kind to yourself today.",
            "urdu": "ایسا لگتا ہے کہ آپ مشکل وقت سے گزر رہے ہیں۔ آج اپنے ساتھ نرمی برتیں۔",
            "sentiment_score": 30 
        })
    elif any(word in user_text for word in POSITIVE_WORDS):
        return jsonify({
            "english": "Great mindset! Your reflection shows a positive trend toward your goals.",
            "urdu": "بہت اچھی سوچ! آپ کی تحریر آپ کے اہداف کی جانب مثبت پیشرفت ظاہر کرتی ہے۔",
            "sentiment_score": 85 
        })

if __name__ == '__main__':
    # Running on 5002 as expected by NestJS
    app.run(port=5002, debug=True)