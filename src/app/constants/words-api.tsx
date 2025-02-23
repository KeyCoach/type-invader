interface DatamuseWord {
  word: string;
  score?: number;
}

const BASE_URL = "https://api.datamuse.com/words";

/**
 * Fetch words from the Datamuse API based on a given letter and length.
 * @param {string} letter - A single letter that must appear in the words.
 * @param {number} length - The exact length of the words.
 * @returns {Promise<DatamuseWord[]>} - The filtered and shuffled JSON response.
 */
async function fetchWordsByLetterAndLength(letter: string, length: number): Promise<DatamuseWord[]> {
  try {
    // Validate inputs
    if (!letter || letter.length !== 1 || !/^[a-z]$/i.test(letter)) {
      throw new Error("Invalid letter: Must be a single alphabetic character.");
    }
    if (length < 1) {
      throw new Error("Invalid length: Must be a positive number.");
    }

    // Construct the query URL to include words containing the letter
    const query = `${BASE_URL}?sp=*${letter}*&max=1000`;
    const response = await fetch(query);

    if (!response.ok) {
      throw new Error(`Error fetching data from Datamuse API: ${response.statusText}`);
    }

    const json: DatamuseWord[] = await response.json();

    // Filter words to match the length, exclude those starting with "-", and randomize the order
    const filteredWords = json
      .filter(
        (item) =>
          item.word.length === length && // Exact length
          !item.word.startsWith("-") && // Exclude words starting with "-"
          item.word.includes(letter) // Ensure it contains the desired letter
      );

    // Shuffle results to ensure a diverse mix of starting letters
    return shuffleArray(filteredWords);
  } catch (error) {
    console.error(`Error in fetchWordsByLetterAndLength for letter "${letter}" and length ${length}:`, error);
    return [];
  }
}

/**
 * Shuffle an array to randomize the order of elements.
 * @param {DatamuseWord[]} array - The array to shuffle.
 * @returns {DatamuseWord[]} - The shuffled array.
 */
function shuffleArray(array: DatamuseWord[]): DatamuseWord[] {
  if (!array || array.length === 0) return [];
  return array.sort(() => Math.random() - 0.5);
}

/**
 * Extract words from the API response and return them as a string array.
 * @param {DatamuseWord[]} response - The JSON response from the Datamuse API.
 * @returns {string[]} - An array of words.
 */
function extractWords(response: DatamuseWord[]): string[] {
  return response.map((item) => item.word);
}

export { fetchWordsByLetterAndLength, extractWords };
