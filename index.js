const readline = require('readline-sync')
const robots = {
  text: require('./robots/text')
}
async function start() {
  const content = {
    maximumSentences: 7,
  }

  content.searchTerm = askAndReturnSearchTerm()
  content.prefix = askAndReturnPrefix()

  await robots.text(content)

  function askAndReturnSearchTerm() {
    const term = readline.question('Type a Wikipedia search term: ')
    console.log('What language do you want?')
    const languages = ['de', 'el', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'zh']
    const language = readline.keyInSelect(languages, 'Choose one option: ')
    const selectedLanguage = languages[language]
    const searchTerm = {
      "articleName": term,
      "lang": selectedLanguage
    }
    return searchTerm
  }

  function askAndReturnPrefix() {
    const prefixes = ['Who is', 'What is', 'The history of']
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
    const selectedPrefixText = prefixes[selectedPrefixIndex]

    return selectedPrefixText
  }
  console.log(JSON.stringify(content, null, 4))
}

start()