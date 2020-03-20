const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAutenticated = algorithmia(algorithmiaApiKey)
    const wikipediaAlgorithm = algorithmiaAutenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
    const wikipediaContent = wikipediaResponse.get()

    content.sourceContentOriginal = wikipediaContent.content
  }

  function sanitizeContent(content) {
    const whithoutBlankLinesAndMarkDown = removeBlankLinesAndMarkDown(content.sourceContentOriginal)
    const whithoutDatesInParentheses = removeDatesInParentheses(whithoutBlankLinesAndMarkDown)

    content.sourceContentSanitized = whithoutDatesInParentheses

    function removeBlankLinesAndMarkDown(text) {
      const allLines = text.split('\n')

      const whithoutBlankLinesAndMarkDown = allLines.filter((line) => {
        if (line.trim().length === 0 || line.trim().startsWith('=')) {
          return false
        }

        return true
      })
      return whithoutBlankLinesAndMarkDown.join(' ')
    }

    function removeDatesInParentheses(text) {
      return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
  }

  function breakContentIntoSentences(content) {
    content.sentences = []

    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence) => {
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: []
      })
    })
  }
}

module.exports = robot