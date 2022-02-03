
let stripContent = (scriptText) => {
  let start = scriptText.indexOf('```') + '```'.length,
      end   = scriptText.lastIdnexOf('```')

  return scriptText.substring(start, end)
}

let runScript = (scriptText) => {

  console.log(scriptText)

  let sketchScript = document.createElement('script')

  sketchScript.textContent = scriptText

  // it runs when added to document
  document.body.appendChild(sketchScript)
}

window.runScript = runScript


