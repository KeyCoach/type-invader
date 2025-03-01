import { gameSettings } from "@/game";
import { DatamuseWord } from "../constants/definitions"


const BASE_URL = "https://api.datamuse.com/words";

/**
 * Fetch words from the Datamuse API, ensuring at least 5 unique starting letters.
 * - If a letter is provided, fetch words that contain that letter and ensure diversity.
 * - If no letter is provided, fetch general words related to the theme.
 * @param {string} [letter] - (Optional) Letter that must appear in the words.
 * @returns {Promise<string[]>} - A shuffled array of words with >=5 unique starting letters.
 */
async function fetchWords(letter?: string): Promise<string[]> {
  try {
    let words: string[] = [];
    
    // Primary API call
    const query = letter
      ? `${BASE_URL}?sp=*${letter}*&max=500`  // Words containing a specific letter
      : `${BASE_URL}?rel_trg=${gameSettings.theme}&max=1000`;  // General word list

    words = await extractValidWords(query);

    // Check unique starting letters
    const uniqueLetters = new Set(words.map(word => word.charAt(0).toLowerCase()));
    
    // If fewer than 5 unique starting letters, fetch more words
    if (letter && uniqueLetters.size < 5) {
      console.log(`Only ${uniqueLetters.size} unique starting letters found, fetching more words...`);
      
      const additionalQueries = [
        `${BASE_URL}?sp=*${letter}&max=500`,  // Words ending in the letter
        `${BASE_URL}?sp=?${letter}*&max=500`  // Words starting with any character + letter
      ];
      
      for (const q of additionalQueries) {
        const extraWords = await extractValidWords(q);
        words = words.concat(extraWords);
        
        // Update unique letter count
        extraWords.forEach(word => uniqueLetters.add(word.charAt(0).toLowerCase()));
        
        // Stop if we reach 5 unique letters
        if (uniqueLetters.size >= 5) break;
      }
    }

    return shuffleArray(words);
  } catch (error) {
    console.error(`Error in fetchWordsFromApi:`, error);
    return [];
  }
}

/**
 * Fetch a list of words from Datamuse API.
 * @param {string} query - The Datamuse API query URL.
 * @returns {Promise<string[]>} - An array of words.
 */
async function extractValidWords(query: string): Promise<string[]> {
  try {
    const response = await fetch(query);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const json: DatamuseWord[] = await response.json();

    // Extract words as strings, ensuring no words start with "-"
    const words = json.map((item) => item.word).filter((word) => !word.startsWith("-"));

    return words;
  } catch (error) {
    console.error(`Error fetching word list:`, error);
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