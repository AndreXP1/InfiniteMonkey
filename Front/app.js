const amountInput = document.querySelector("#amount");
const generateButton = document.querySelector("#generate");
const wordInput = document.querySelector("#word");
const highlightButton = document.querySelector("#highlight");
const dictionaryList = document.querySelector("#dictionary");
const grid = document.querySelector("#grid");
const status = document.querySelector("#status");
const count = document.querySelector("#count");
let generatedCharacters = "";
let dictionary = [];

function renderCharacters(characters) {
  generatedCharacters = characters;
  const columns = Math.max(4, Math.min(16, Math.ceil(Math.sqrt(characters.length))));
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

function highlightWord() {
  const word = wordInput.value.trim().toUpperCase();
  grid.querySelectorAll(".character").forEach((cell) => cell.classList.remove("is-highlighted"));

  if (!word) {
    status.textContent = "Type a word to highlight";
    return;
  }

  const matches = [];
  let start = generatedCharacters.indexOf(word);
  while (start !== -1) {
    for (let index = start; index < start + word.length; index += 1) {
      matches.push(index);
    }
    start = generatedCharacters.indexOf(word, start + 1);
  }

  matches.forEach((index) => grid.children[index]?.classList.add("is-highlighted"));
  status.textContent = matches.length
    ? `"${word}" found and highlighted`
    : `"${word}" was not found in this field`;
}

async function loadDictionary() {
  const response = await fetch("/static/words.json");
  if (!response.ok) {
    throw new Error(`Dictionary failed with status ${response.status}`);
  }
  dictionary = (await response.json()).words;
  dictionary.forEach((word) => {
    const option = document.createElement("option");
    option.value = word;
    dictionaryList.append(option);
  });
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
    const response = await fetch(`/gen?ammount=${amount}`);
    if (!response.ok) {
      throw new Error(`Generation failed with status ${response.status}`);
    }
    renderCharacters(await response.text());
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

Promise.all([loadDictionary(), generateCharacters()]).catch((error) => {
  status.textContent = "Could not load the English dictionary";
  console.error(error);
});
