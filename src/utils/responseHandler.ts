// Levenshtein distance function to compute similarity between two strings
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

// Check if the input is a fuzzy greeting
export function isFuzzyGreeting(input: string): boolean {
  const greetings = ["hi", "hello", "hey", "heya", "hii", "hyy", "helo"];
  const msg = input.trim().toLowerCase();

  return greetings.some((greet) => levenshtein(msg, greet) <= 2);
}

// Generate a reply based on user input
export const generateReply = (userText: string): string => {
  const userMessage = userText.toLowerCase();
  let replyText = "";

  // Fuzzy Greeting detection
  if (isFuzzyGreeting(userMessage)) {
    replyText =
      "Hey there! 👋 I’m your audio transcriber 🤖. Send me a voice note or audio document and I’ll summarize it for you! 🎧";
  }
  // How are you / What's up
  else if (/how (are|r) (you|u)\b/.test(userMessage)) {
    replyText =
      "I’m doing great, thanks for asking! 🤖 How can I help you with your audio today?";
  }
  // Compliment response
  else if (/you’re welcome|thanks/.test(userMessage)) {
    replyText = "You’re welcome! 😊 Got more audio? Send it over!";
  }
  // Goodbye
  else if (/bye|goodbye|see you/.test(userMessage)) {
    replyText = "Goodbye! 👋 Catch you later with more voice notes!";
  }
  // Offering help
  else if (/help|assist|support/.test(userMessage)) {
    replyText =
      "I’m here to help! 🤖 Send me your voice notes or audio files, and I’ll transcribe and summarize them for you!";
  }
  // Polite inquiry
  else if (/please/.test(userMessage)) {
    replyText =
      "Of course! 😊 Just send me an audio, and I’ll take care of the rest!";
  }
  // Apology
  else if (/sorry/.test(userMessage)) {
    replyText =
      "No worries at all! 😊 Feel free to send me your audio anytime!";
  }
  // Thank you variations
  else if (/thank(s|you)/.test(userMessage)) {
    replyText =
      "You’re very welcome! 😄 Let me know if you need anything else!";
  }
  // Casual check-in or small talk
  else if (/what’s up|whats up|how’s it going/.test(userMessage)) {
    replyText =
      "I’m here and ready to transcribe your audio! 🎧 How can I assist you today?";
  }
  // Friendly greeting at any time of the day
  else if (/good morning/.test(userMessage)) {
    replyText =
      "Good morning! 🌞 Ready to transcribe your audio and make your day easier!";
  } else if (/good afternoon/.test(userMessage)) {
    replyText =
      "Good afternoon! ☀️ Send me your audio files, and I’ll summarize them for you!";
  } else if (/good evening/.test(userMessage)) {
    replyText =
      "Good evening! 🌙 Let me know if you’ve got any audio to transcribe!";
  } else if (/good night|kal baat krte h(ai)/.test(userMessage)) {
    replyText =
      "Good night! 🌙 Rest well, and feel free to reach out tomorrow if you’ve got any audio you'd like transcribed. Sweet dreams!";
  }
  // Curious / inquisitive messages
  else if (/what can you do|what is this/.test(userMessage)) {
    replyText =
      "I’m an audio-to-text summarizer 🤖. Just send me your voice notes or documents, and I’ll transcribe and summarize them for you!";
  }
  // Error / misunderstanding (unknown message type)
  else if (/what|how/.test(userMessage)) {
    replyText =
      "I didn’t quite get that. 😅 Could you please send me an audio note for transcribing?";
  }
  // Encouraging the user
  else if (/good job|nice/.test(userMessage)) {
    replyText =
      "Thanks! 😄 Keep sending those voice notes my way, and I’ll keep transcribing!";
  }
  // Anything else (catch-all response)
  else {
    replyText =
      "I didn’t quite catch that! 😅 But feel free to send me an audio note for transcribing anytime!";
  }

  return replyText;
};
