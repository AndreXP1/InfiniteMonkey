const amountInput = document.querySelector("#amount");
const generateButton = document.querySelector("#generate");
const wordInput = document.querySelector("#word");
const highlightButton = document.querySelector("#highlight");
const grid = document.querySelector("#grid");
const status = document.querySelector("#status");
const count = document.querySelector("#count");
const wordList = document.querySelector("#word-list");

let generatedCharacters = "";
let currentGameId = null
let foundWords = new Set();
let foundWordIndices = new Set();

function getGridShape(length) {
  const columns = Math.max(4, Math.min(16, Math.ceil(Math.sqrt(length))));
  return { columns, rows: Math.ceil(length / columns) };
}

function renderCharacters(characters) {
  generatedCharacters = characters;
  const { columns } = getGridShape(characters.length);
  grid.style.setProperty("--columns", columns);
  grid.replaceChildren(
    ...[...characters].map((character, index) => {
      const cell = document.createElement("span");
      cell.className = "character";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Character ${index + 1}: ${character}`);
      cell.textContent = character;
      return cell;
    }),
  );
  count.textContent = `${characters.length} character${characters.length === 1 ? "" : "s"}`;
}

function renderWordList(words) {
  wordList.hidden = words.length === 0;
  wordList.replaceChildren(
    ...words.map((word) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-chip";
      button.textContent = word;
      button.addEventListener("click", () => {
        wordInput.value = word;
        highlightWord();
      });
      return button;
    }),
  );
}

async function highlightWord() {
  const word = wordInput.value.trim().toUpperCase();

  if (!word) {
    status.textContent = "Type a word to highlight";
    return;
  }

  if(!currentGameId){
    status.textContent = `"Generate grid first"`;
    return;
  }

  status.textContent = "Searching..."

  try{
    const response = await fetch("/api/game/guess", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        game_id: currentGameId,
        word: word,
      }),
    });
    
    if(!response.ok){
      throw new Error("Guess validation failed");
    }

    const result = await response.json();

    if (result.found){
      foundWords.add(word);
      result.indices.forEach((index)=>foundWordIndices.add(index));

      renderWordList([...foundWords]);

      grid.querySelectorAll(".character").forEach((cell, index)=>{
        cell.classList.toggle("is-highlighted", foundWordIndices.has(index));
      });
      status.textContent = result.message || `"${word} found and highlighted"`;
    }else{
      status.textContent = result.message || `"${word} was not found"`;
    }
  }catch (error){
    status.textContent = "Error checking word";
    console.error(error);
  }
}

async function generateCharacters() {
  const amount = Number.parseInt(amountInput.value, 10);
  if (!Number.isInteger(amount) || amount < 1 || amount > 5000) {
    status.textContent = "Choose between 1 and 5000 characters";
    amountInput.focus();
    return;
  }

  generateButton.disabled = true;
  status.textContent = "Generating...";

  try {
    const response = await fetch(`/api/game/new?amount=${amount}`);
    if (!response.ok){
      throw new Error("Generations failed");
    }

    const data = await response.json();

    currentGameId = data.game_id;
    foundWords = new Set();
    foundWordIndices = new Set();

    renderCharacters(data.characters);
    renderWordList([]);
    status.textContent = "Fresh field generated";
  }catch(error){
    status.textContent = "Could not generate characters";
    console.error(error);
  }finally{
    generateButton.disabled = false;
  }
}

generateButton.addEventListener("click", generateCharacters);
highlightButton.addEventListener("click", highlightWord);
wordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    highlightWord();
  }
});
amountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    generateCharacters();
  }
});

generateCharacters();
