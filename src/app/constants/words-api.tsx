interface DatamuseWord {
  word: string;
  score?: number;
}

const BASE_URL = "https://api.datamuse.com/words";

/**
 * Fetch words from the Datamuse API that contain a specific letter and have a specific length.
 * Ensures that words do not start with the same letter to improve variety.
 * @param {string} letter - The letter that must appear in the words.
 * @param {number} length - The exact length of the words.
 * @returns {Promise<string[]>} - A sorted array of words with unique starting letters.
 */
async function fetchWordsByLetterAndLength(letter: string, length: number): Promise<string[]> {
  try {
    // Validate inputs
    if (!letter || letter.length !== 1 || !/^[a-z]$/i.test(letter)) {
      throw new Error("Invalid letter: Must be a single alphabetic character.");
    }
    if (length < 1) {
      console.error(`Invalid length provided: ${length}`);
      throw new Error("Invalid length: Must be a positive number.");
    }

    // Construct API query to fetch words containing the desired letter
    // Request more words (max=300) to ensure we get enough variety
    const query = `${BASE_URL}?sp=*${letter}*&max=300`;
    const response = await fetch(query);

    if (!response.ok) {
      throw new Error(`Error fetching data from Datamuse API: ${response.statusText}`);
    }

    const json: DatamuseWord[] = await response.json();

    // Extract words as strings
    const words = json.map((item) => item.word);

    // Filter words to match exact length, exclude words starting with "-", and ensure they contain the desired letter
    const filteredWords = words.filter(
      (word) => word.length === length && !word.startsWith("-") && word.includes(letter)
    );

    // If we have fewer than 5 words, don't try to filter by starting letter
    if (filteredWords.length < 5) {
      console.warn(`Found only ${filteredWords.length} words containing '${letter}' with length ${length}`);
      return filteredWords;
    }

    // Shuffle the array to improve randomness
    const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
    
    // Select only words with different starting letters if possible, but ensure we return at least 5 words
    const uniqueWords: string[] = [];
    const seenLetters = new Set<string>();

    // First pass - try to get words with unique starting letters
    for (const word of shuffledWords) {
      const firstLetter = word.charAt(0).toLowerCase();
      if (!seenLetters.has(firstLetter)) {
        uniqueWords.push(word);
        seenLetters.add(firstLetter);
      }
      if (uniqueWords.length >= 10) break; // Aim for 10 words with unique starting letters
    }

    // Second pass - if we don't have at least 5 words, add more even if starting letters repeat
    if (uniqueWords.length < 5) {
      for (const word of shuffledWords) {
        if (!uniqueWords.includes(word)) {
          uniqueWords.push(word);
        }
        if (uniqueWords.length >= 5) break;
      }
    }

    console.log(`Returning ${uniqueWords.length} words for letter "${letter}" and length ${length}`);
    return uniqueWords;
  } catch (error) {
    console.error(`Error in fetchWordsByLetterAndLength for letter "${letter}" and length ${length}:`, error);
    // Return a small set of fallback words in case of error
    return getFallbackWords(letter, length);
  }
}

/**
 * Returns fallback words in case the API call fails
 */
function getFallbackWords(letter: string, length: number): string[] {
  // Create some basic fallback words containing the letter
  const fallbacks: Record<string, string[]> = {
    a: ["apple", "banana", "attack", "around", "avocado"],
    b: ["banana", "bubble", "boolean", "baseball", "babble"],
    c: ["cosmic", "castle", "concert", "corner", "calculate"],
    d: ["domain", "dragon", "diamond", "defend", "direct"],
    e: ["energy", "element", "excite", "eleven", "empire"],
    f: ["frozen", "finger", "forest", "funny", "filter"],
    g: ["garden", "google", "gaming", "gather", "golden"],
    h: ["harbor", "hidden", "hockey", "hammer", "hamper"],
    i: ["island", "icicle", "iconic", "internet", "invite"],
    j: ["jacket", "jungle", "jigsaw", "joking", "jumper"],
    k: ["kettle", "kindle", "koala", "knight", "kayak"],
    l: ["lemon", "loaded", "listen", "launch", "learner"],
    m: ["mango", "master", "modern", "minute", "music"],
    n: ["number", "native", "normal", "notice", "napkin"],
    o: ["orange", "octopus", "oddity", "option", "object"],
    p: ["python", "purple", "picture", "perfect", "package"],
    q: ["quaint", "quick", "quartz", "quantum", "queen"],
    r: ["random", "remote", "rust", "robot", "ready"],
    s: ["system", "strong", "swift", "simple", "smart"],
    t: ["testing", "typing", "talent", "turtle", "target"],
    u: ["update", "unicorn", "useful", "unclear", "upbeat"],
    v: ["vector", "vision", "virtual", "violin", "verbose"],
    w: ["window", "weather", "winter", "wonder", "widget"],
    x: ["xenon", "xylophone", "xerox", "xbox", "xray"],
    y: ["yellow", "yonder", "yummy", "yearly", "yoga"],
    z: ["zebra", "zombie", "zealot", "zircon", "zippy"]
  };
  
  // Get fallback words for this letter, or use defaults
  const letterWords = fallbacks[letter.toLowerCase()] || ["apple", "gaming", "python", "rocket", "swift"];
  
  // Filter to match the requested length if possible
  const matchingLength = letterWords.filter(word => word.length === length);
  
  // Return matching length words, or original words if none match
  return matchingLength.length > 0 ? matchingLength : letterWords;
}

/**
 * Shuffle an array to randomize the order of elements.
 * @param {string[]} array - The array to shuffle.
 * @returns {string[]} - The shuffled array.
 */
function shuffleArray(array: string[]): string[] {
  if (!array || array.length === 0) return [];
  return [...array].sort(() => Math.random() - 0.5);
}

/**
 * Extract words from the API response and return them as a string array.
 * @param {DatamuseWord[]} response - The JSON response from the Datamuse API.
 * @returns {string[]} - An array of words.
 */
function extractWords(response: DatamuseWord[]): string[] {
  return response.map((item) => item.word);
}

/**
 * Fetch random words from the Datamuse API for Free Play mode.
 * Ensures words match the exact length and are randomized each round.
 * @param {number} length - The exact length of the words.
 * @returns {Promise<string[]>} - A shuffled array of words.
 */
async function fetchWordsForFreePlay(length: number): Promise<string[]> {
  try {
    // Validate input
    if (length < 1) {
      console.error(`Invalid length provided: ${length}`);
      throw new Error("Invalid length: Must be a positive number.");
    }

    // Use a better query that will return more varied words
    // Generate an array of letters to search for words containing different letters
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const allWords: string[] = [];
    
    // Try a different approach - get words starting with different letters
    for (let i = 0; i < 5; i++) {
      // Pick random letters to get more diversity
      const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
      const query = `${BASE_URL}?sp=${randomLetter}${"*".repeat(length-1)}&max=50`;
      
      try {
        const response = await fetch(query);
        if (response.ok) {
          const json: DatamuseWord[] = await response.json();
          const words = json.map(item => item.word)
            .filter(word => word.length === length);
          allWords.push(...words);
        }
      } catch (e) {
        console.warn(`Error fetching words starting with ${randomLetter}:`, e);
      }
    }

    // Fallback to the old method if we didn't get enough words
    if (allWords.length < 10) {
      const query = `${BASE_URL}?sp=${"*".repeat(length)}&max=100`;
      const response = await fetch(query);

      if (response.ok) {
        const json: DatamuseWord[] = await response.json();
        const words = json.map(item => item.word)
          .filter(word => word.length === length);
        allWords.push(...words);
      }
    }

    // Filter duplicates
    const uniqueWords = [...new Set(allWords)];
    
    if (uniqueWords.length < 5) {
      console.warn(`Not enough unique words found for length ${length}, using fallbacks`);
      return getFallbackWordsForFreePlay(length);
    }

    // Shuffle words for randomness
    return shuffleArray(uniqueWords);
  } catch (error) {
    console.error(`Error in fetchWordsForFreePlay for length ${length}:`, error);
    return getFallbackWordsForFreePlay(length);
  }
}

/**
 * Get fallback words for free play mode
 */
function getFallbackWordsForFreePlay(length: number): string[] {
  // Pre-defined fallback words by length
  const fallbacks: Record<number, string[]> = {
    3: ["cat", "dog", "run", "big", "fun", "hit", "pot", "red", "sun", "box"],
    4: ["game", "code", "play", "time", "book", "word", "jump", "fish", "bike", "wind"],
    5: ["react", "swift", "laser", "brain", "robot", "music", "beach", "dance", "space", "fruit"],
    6: ["python", "coding", "rocket", "system", "galaxy", "sunset", "dragon", "puzzle", "casino", "turtle"],
    7: ["physics", "builder", "fantasy", "cookies", "network", "science", "desktop", "rainbow", "captain", "phoenix"],
    8: ["dinosaur", "computer", "bacteria", "elements", "universe", "aircraft", "keyboard", "memories", "tomorrow", "baseball"],
    9: ["astronaut", "character", "developer", "adventure", "telescope", "chocolate", "butterfly", "vegetable", "fireworks", "alligator"],
    10: ["technology", "programmer", "basketball", "spacecraft", "strawberry", "creativity", "restaurant", "friendship", "automobile", "elementary"]
  };
  
  // Get words for the requested length or default to 5-letter words
  return fallbacks[length] || fallbacks[5] || ["react", "swift", "laser", "brain", "robot"];
}

export { fetchWordsByLetterAndLength, extractWords, fetchWordsForFreePlay };