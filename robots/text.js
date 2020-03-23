const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey

const NaturalLanguageUndestandngV1 = require('watson-developer-cloud/natural-language-understanding/v1')

const nlu = new NaturalLanguageUndestandngV1({
  iam_apikey: watsonApiKey,
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

async function robot(content) {
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)
  limitMaximumSentence(content)
  await fetchKeywordsOfAllSentences(content)

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
      return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
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

  function limitMaximumSentence(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }

  async function fetchKeywordsOfAllSentences(content) {
    for (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
  }

  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze({
        text: sentence,
        features: {
          keywords: {}
        }
      }, (error, res) => {
        if (error) {
          throw error
        }
        const keywords = res.keywords.map((keyword) => {
          return keyword.text
        })
        resolve(keywords)
      })
    })
  }
}

module.exports = robot