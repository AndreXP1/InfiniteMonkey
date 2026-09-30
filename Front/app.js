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

function highlightWord() {
  const word = wordInput.value.trim().toUpperCase();
  const hiddenWord = generatedWords.find(
    (hiddenWord) => hiddenWord.toUpperCase() === word,
  );

  if (!word) {
    status.textContent = "Type a word to highlight";
    return;
  }

  if(!hiddenWord){
    status.textContent = `"${word}" was not found in the list`;
    return;
  }

  const { columns, rows } = getGridShape(generatedCharacters.length);
  const matches = new Set();
  const directions = [[0, 1], [1, 1], [1, -1]];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      for (const [rowStep, columnStep] of directions) {
        const indices = [];
        for (let offset = 0; offset < word.length; offset += 1) {
          const nextRow = row + rowStep * offset;
          const nextColumn = column + columnStep * offset;
          const index = nextRow * columns + nextColumn;
          if (
            nextRow < 0 ||
            nextRow >= rows ||
            nextColumn < 0 ||
            nextColumn >= columns ||
            index >= generatedCharacters.length ||
            generatedCharacters[index] !== word[offset]
          ) {
            break;
          }
          indices.push(index);
        }
        if (indices.length === word.length) {
          indices.forEach((index) => matches.add(index));
        }
      }
    }
  }

  if (matches.size > 0) {
    foundWords.add(hiddenWord);
    matches.forEach((index) => foundWordIndices.add(index));
    renderWordList([...foundWords]);

    grid.querySelectorAll(".character").forEach((cell, index)=>{
      cell.classList.toggle("is-highlighted", foundWordIndices.has(index));
    });
    status.textContent = `"${word}" found and highlighted`;
  }else{
    status.textContent = `"${word}" was not nout in this field`;
  }
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function insertWords(characters, words) {
  const cells = [...characters];
  const occupied = new Set();
  const { columns, rows } = getGridShape(cells.length);
  const directions = [[0, 1], [1, 1], [1, -1]];
  const placedWords = [];

  for (const word of words) {
    const candidates = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        for (const [rowStep, columnStep] of directions) {
          const indices = [];
          let valid = true;
          for (let offset = 0; offset < word.length; offset += 1) {
            const nextRow = row + rowStep * offset;
            const nextColumn = column + columnStep * offset;
            const index = nextRow * columns + nextColumn;
            if (
              nextRow < 0 ||
              nextRow >= rows ||
              nextColumn < 0 ||
              nextColumn >= columns ||
              index >= cells.length ||
              (occupied.has(index) && cells[index] !== word[offset])
            ) {
              valid = false;
              break;
            }
            indices.push(index);
          }
          if (valid) candidates.push(indices);
        }
      }
    }

    const placement = shuffle(candidates)[0];
    if (!placement) continue;
    placement.forEach((index, offset) => {
      cells[index] = word[offset];
      occupied.add(index);
    });
    placedWords.push(word);
  }

  return { characters: cells.join(""), words: placedWords };
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
    const [charactersResponse, wordsResponse] = await Promise.all([
      fetch(`/gen?ammount=${amount}`),
      fetch("/words"),
    ]);
    if (!charactersResponse.ok || !wordsResponse.ok) {
      throw new Error("Generation failed");
    }
    const characters = await charactersResponse.text();
    const { words } = await wordsResponse.json();
    const normalizedWords = words
      .filter((word) => typeof word === "string")
      .map((word) => word.trim().toUpperCase())
      .filter(Boolean);
    const inserted = insertWords(characters, normalizedWords);
    generatedWords = inserted.words;
    foundWords = new Set();
    foundWordIndices = new Set();
    renderCharacters(inserted.characters);
    renderWordList([]);
    if (wordInput.value) {
      highlightWord();
    } else {
      status.textContent = "Fresh field generated";
    }
  } catch (error) {
    status.textContent = "Could not generate characters";
    console.error(error);
  } finally {
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
