interface DatamuseWord {
    word: string;
    score?: number;
}
  

const BASE_URL = "https://api.datamuse.com/words";

/**
 * Fetch words from the Datamuse API based on a given letter and length.
 * @param {string} letter - The starting letter of the words.
 * @param {number} length - The exact length of the words.
 * @returns {Promise<any[]>} - The JSON response from the API.
 */
async function fetchWordsByLetterAndLength(letter: string, length: number): Promise<DatamuseWord[]> {
    try {
      // Construct the query URL to include words containing the letter
      const query = `${BASE_URL}?sp=*${letter}*&max=1000`;
      const response = await fetch(query);
  
      if (!response.ok) {
        throw new Error(`Error fetching data from Datamuse API: ${response.statusText}`);
      }
  
      const json: DatamuseWord[] = await response.json();
  
      // Filter results based on exact length
      return json.filter((item) => item.word.length === length && !item.word.startsWith("-"));
    } catch (error) {
      console.error("Error in fetchWordsByLetterAndLength:", error);
      return [];
    }
  }
  
/**
 * Extract words from the API response and return them as a string array.
 * @param {any[]} response - The JSON response from the Datamuse API.
 * @returns {string[]} - An array of words.
 */
function extractWords(response: DatamuseWord[]): string[] {
  return response.map((item: DatamuseWord) => item.word);
}


export { fetchWordsByLetterAndLength, extractWords };
