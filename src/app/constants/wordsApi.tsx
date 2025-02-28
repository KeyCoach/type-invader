import { gameSettings } from "@/game";


interface DatamuseWord {
  word: string;
  score?: number;
}

const BASE_URL = "https://api.datamuse.com/words";

/**
 * Fetch words from the Datamuse API.
 * - If a letter is provided, fetch words that contain that letter.
 * - If no letter is provided, fetch random words.
 * @param {string} [letter] - (Optional) Letter that must appear in the words.
 * @returns {Promise<string[]>} - A shuffled array of words.
 */
async function fetchWords(letter?: string): Promise<string[]> {
  try {
    // Construct API query based on whether a letter is provided
    const query = letter 
      ? `${BASE_URL}?sp=*${letter}*&max=1000`  // Words containing a specific letter
      : `${BASE_URL}?rel_trg=${gameSettings.theme}&max=1000`;  // General word list

    const response = await fetch(query);

    if (!response.ok) {
      throw new Error(`Error fetching data from Datamuse API: ${response.statusText}`);
    }

    const json: DatamuseWord[] = await response.json();

    // Extract words as strings
    const words = json.map((item) => item.word).filter((word) => !word.startsWith("-"));

    // Shuffle words for randomness
    return shuffleArray(words);
  } catch (error) {
    console.error(`Error in fetchWords:`, error);
    return [];
  }
}

/**
 * Shuffle an array to randomize the order of elements.
 * @param {string[]} array - The array to shuffle.
 * @returns {string[]} - The shuffled array.
 */
function shuffleArray(array: string[]): string[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export { fetchWords };