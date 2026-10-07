const clues = [
  {
    id: 1,
    title: "THE CEMETERY SIGN",
    story: "The cemetery of Medina is known to most visitors simply as Al-Baqi. But its full name has been largely forgotten. Hidden in that name is a connection to something that once grew here - something mentioned in hadith, with a significance most people never learn.",
    task: "Find the sign that points toward the cemetery. The sign reveals the full name.",
    question: "Write the second word of the full name exactly as it appears.",
    acceptedAnswers: ["al-gharqad", "algharqad", "gharqad"],
    hint: null,
    photoChallenge: "Team photo with the sign visible behind you",
    answerFormat: "AL-GHARQAD",
    extractLetters: [{ letter: 2, box: 1 }, { letter: 5, box: 16 }, { letter: 8, box: 12 }, { letter: 9, box: 9 }],
    navigation: "Return through the door you came from. Once inside, turn left and walk toward the washroom structures, counting them as you go. You want the second one. Look for the structure marked with a large P, with the numbers 1 and 2 beneath it. Take the elevator down and press P2."
  },
  {
    id: 2,
    title: "THE HIDDEN MUSEUM",
    story: "Most visitors walk past this entrance every single day without noticing it exists. Hidden beneath the Masjid lies a treasure of rare Islamic manuscripts - one of the most significant collections in the world. Very few visitors ever find their way down.",
    task: "Find the sign at the museum entrance.",
    question: "Write the second word on the sign.",
    acceptedAnswers: ["manuscripts", "manuscript"],
    hint: null,
    photoChallenge: "Team photo at the top of the stairs leading down",
    answerFormat: "MANUSCRIPTS",
    extractLetters: [{ letter: 11, box: 14 }],
    navigation: "Exit the museum and walk straight. Take the first elevator to GF. Turn right and walk until you are standing opposite Gate 367. Look at the mosque wall."
  },
  {
    id: 3,
    title: "THE DOOR WITH TWO NAMES",
    story: "Most doors in the Masjid carry one name. This door carries two. One name honours the angel who brought revelation to the Prophet, peace be upon him. The other honours the Companion who stood faithfully by his side through every hardship and gave generously from his wealth for Islam. Directly in front of the number 39, you will notice a door with a gold and green ledge - that is the famous Door of Jibril, Door 40.",
    task: "Find the number 39 in Arabic on the mosque wall.",
    question: "Write the door number as a word. Example: if it were door 5, write FIVE.",
    acceptedAnswers: ["thirty nine", "thirty-nine", "thirtynine"],
    hint: null,
    photoChallenge: "Team photo with Door 39 visible",
    answerFormat: "THIRTY NINE",
    extractLetters: [{ letter: 3, box: 10 }, { letter: 7, box: 11 }, { letter: 8, box: 13 }],
    navigation: "Now walk toward the green minaret - the one that looks completely different from all the others. Get close enough to see its tip clearly."
  },
  {
    id: 4,
    title: "THE MINARET THAT STANDS OUT",
    story: "Look up at the minarets surrounding the Masjid. Most of them look identical. But one was built centuries ago in a completely different style - Ottoman architecture. You are looking at one of the oldest minarets in the world. It has something at its very tip that sets it apart from every other minaret here.",
    task: "Find the minaret that looks completely different from all the others. Look at its tip.",
    question: "Complete this sentence: The tip of this minaret is _______ green. What is the missing word?",
    acceptedAnswers: ["olive"],
    hint: "This shade of green shares its name with a fruit mentioned in the Quran.",
    photoChallenge: "Team photo with the minaret tip visible above you",
    answerFormat: "OLIVE",
    extractLetters: [{ letter: 4, box: 3 }, { letter: 5, box: 4 }],
    navigation: "Walk to the base of the minaret. Stand opposite Door 1 - do not enter the barricaded area - so you can see it clearly."
  },
  {
    id: 5,
    title: "DOOR NUMBER ONE",
    story: "There are over 300 numbered entrances around the Masjid. This door is the first. The Companion Umar ibn al-Khattab, may Allah be pleased with him, built the corridor leading to this door so that every visitor could send salawat upon the Prophet, peace be upon him, as they entered.",
    task: "Find the door with the large number 1 on it. Read the name on the plaque. You may ask someone nearby to help you. Translate the name into English.",
    question: "Write the English translation of the name.",
    acceptedAnswers: ["door of peace", "gate of peace", "bab al salam", "bab al-salam"],
    hint: null,
    photoChallenge: "Team photo at Door 1 with the number visible",
    answerFormat: "DOOR OF PEACE",
    extractLetters: [{ letter: 2, box: 2 }, { letter: 5, box: 5 }, { letter: 6, box: 6 }, { letter: 8, box: 8 }],
    navigation: "Walk along the mosque wall toward the large number 3. Get close enough to read the plaque beneath it. Note: this area is near the men's entrance - women in the group may need to observe from a short distance."
  },
  {
    id: 6,
    title: "THE DOOR OF MERCY",
    story: "A Bedouin came to this door and asked the Prophet, peace be upon him, to make dua for rain. It rained for seven days straight. Then the same Bedouin returned to this exact door - this time to ask for the rain to stop. The Prophet raised his hands again, and the clouds scattered to the outskirts of Medina.",
    task: "Find the door with the number 3 on it. Read the name on the plaque on the door. Translate it into English.",
    question: "Write the English translation of the name.",
    acceptedAnswers: ["door of mercy", "gate of mercy", "bab al rahmah", "bab al-rahmah"],
    hint: null,
    photoChallenge: "Team photo at Door 3",
    answerFormat: "DOOR OF MERCY",
    extractLetters: [{ letter: 2, box: 5 }, { letter: 6, box: 15 }, { letter: 7, box: 7 }],
    navigation: "Make your way to Washroom 207."
  },
  {
    id: 7,
    title: "THE INVISIBLE WALL",
    story: "Medina was once a fortified city protected by two layers of walls - an outer wall and an inner wall. The inner wall ran through this exact spot. Today it has been absorbed into the Masjid itself, invisible to almost everyone who passes. You are standing where the ancient city wall once stood.",
    task: "Find the washroom structure and look at the sign.",
    question: "Write exactly what the sign says for this facility.",
    acceptedAnswers: ["men's toilets", "mens toilets", "men toilets"],
    hint: null,
    photoChallenge: "Team photo near Washroom 207",
    answerFormat: "MEN'S TOILETS",
    extractLetters: [{ letter: 7, box: 17 }, { letter: 10, box: 18 }],
    navigation: "Face the Qibla and look to your right. You will see the domes of a mosque in the distance. Walk in that direction. Exit through Door 310 and keep walking. Look for the green sign with a description of the area."
  },
  {
    id: 8,
    title: "THE OPEN GROUND",
    story: "You have arrived at your final destination. This is Al-Musalla - the open ground where the Prophet, peace be upon him, and his Companions prayed Eid together. During one of those prayers, clouds gathered above this very spot and rain began to fall. This ground still holds that memory.",
    task: "Find the plaque at Al-Musalla and read it carefully.",
    question: "According to the plaque, in which year was this place established? Write that year.",
    acceptedAnswers: ["first hijri", "1 hijri", "first hijra", "al hijri"],
    hint: null,
    photoChallenge: "Full team photo at Al-Musalla - everyone in frame",
    answerFormat: "FIRST HIJRI",
    extractLetters: [{ letter: 6, box: 19 }],
    navigation: null
  }
];

// answerFormat: the answer as shown in the letter boxes. Letters become
// input boxes; spaces split words; hyphens/apostrophes show as fixed marks.
// extractLetters: { letter: position counting letters only (no spaces or
// punctuation), box: which of the 19 mystery-phrase boxes it fills }.
// Those letter boxes are highlighted gold on the clue screen.
// The mystery phrase built from the extracted letters (spaces only mark
// word breaks).
// Points for everything (including the phrase bonus) live in scoring.js.
export const MYSTERY_PHRASE = "LOVE OF MEDINA IS FAITH";

export default clues;
