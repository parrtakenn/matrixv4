//@ts-check
const symbols = [
  "日",
  "ﾊ",
  "ﾐ",
  "ﾋ",
  "ｰ",
  "ｳ",
  "ｼ",
  "ﾅ",
  "ﾓ",
  "ﾆ",
  "ｻ",
  "ﾜ",
  "ﾂ",
  "ｵ",
  "ﾘ",
  "ｱ",
  "ﾎ",
  "ﾃ",
  "ﾏ",
  "ｹ",
  "ﾒ",
  "ｴ",
  "ｶ",
  "ｷ",
  "ﾑ",
  "ﾕ",
  "ﾗ",
  "ｾ",
  "ﾈ",
  "ｽ",
  "ﾀ",
  "ﾇ",
  "ﾍ",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "7",
  "8",
  "9",
  "T",
  "H",
  "E",
  "M",
  "A",
  "T",
  "R",
  "I",
  "X",
  ":",
  "・",
  ".",
  "=",
  "*",
  "+",
  "-",
  "<",
  ">",
  "¦",
  "｜",
  "ｸ",
  "ç",
  "ﾘ",
  "Ɛ",
]

/**
 * @typedef {Object} IColor
 * @property {number} red
 * @property {number} green
 * @property {number} blue
 * @property {number=} alpha
 */

/**
 * @typedef {Object} IConfiguration
 * @property {number} maxSymbolCount
 * @property {number} symbolAlphaFadeRate
 * @property {number} symbolFontSize
 * @property {string} symbolFontFamily
 * @property {IColor} symbolColorForeground
 * @property {IColor} symbolColorFade
 * @property {IColor} canvasBackgroundColor
 * @property {number} frameRatePerSecond
 */

/**
 * @typedef {Object} ISymbolCoordinate
 * @property {string} symbol
 * @property {number} x
 * @property {number} y
 */

const getCanvasHeight = () => {
  return window.innerHeight
}

const getCanvasWidth = () => {
  return window.innerWidth
}

const getRandomSymbol = () =>
  symbols[Math.floor(Math.random() * (symbols.length - 1))]

/**
 * @param {ISymbolCoordinate} coordinate
 * @param {number} symbolFontSize
 * @return {ISymbolCoordinate}
 */
const calcFallSymbolCoordinate = ({ x, y }, symbolFontSize) => {
  const fallDistance =
    (Math.random() * symbolFontSize * 3) / 4 + (symbolFontSize * 3) / 4
  const newY = y + fallDistance

  return newY > getCanvasHeight()
    ? initializeSymbolCoordinate(symbolFontSize, 8)
    : {
        symbol: getRandomSymbol(),
        x,
        y: newY,
      }
}

/**
 * @param {ISymbolCoordinate[]} symbolsPool
 * @param {number} symbolFontSize
 */
const calcNextFrameSymbolsFall = (symbolsPool, symbolFontSize) =>
  symbolsPool.map((coordinate) =>
    calcFallSymbolCoordinate(coordinate, symbolFontSize)
  )

/** @param {IColor} color*/
const formatToRbgString = ({ red, green, blue, alpha }) =>
  `rgba(${red}, ${green}, ${blue}, ${alpha || 1})`

/** @param {number} symbolFontSize*/
/** @param {string} symbolFontFamily*/
const formatToFontString = (symbolFontSize, symbolFontFamily) =>
  `${symbolFontSize}px ${symbolFontFamily}`

/**
 * @param {number} symbolFontSize
 * @return {ISymbolCoordinate}
 */
const initializeSymbolCoordinate = (symbolFontSize, offset = 1) => {
  return {
    symbol: getRandomSymbol(),
    x:
      Math.floor((Math.random() * getCanvasWidth()) / symbolFontSize) *
      symbolFontSize,
    y: (Math.random() * getCanvasHeight()) / offset - 50,
  }
}

/** @param {number} ms */
const wait = (ms) => new Promise((res) => setTimeout(res, ms))

/**
 * @param {HTMLCanvasElement} canvas
 */
const watchScreenForCanvasDimensions = (canvas) => {
  const resizeCanvas = () => {
    canvas.width = getCanvasWidth()
    canvas.height = getCanvasHeight()
  }

  resizeCanvas() // On init
  window.addEventListener("resize", resizeCanvas) // On screen resize
}

/**
 * @param {IConfiguration} config
 * @returns {{
 *   renderToCanvas: (coordinates: ISymbolCoordinate[], symbolColor: IColor) => void
 * }}
 */
const configureCanvasFnFactory = (config) => {
  // Canvas config
  const {
    symbolFontSize,
    symbolFontFamily,
    canvasBackgroundColor,
    symbolAlphaFadeRate,
  } = config
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById("canvas")
  )
  const canvasContext = canvas.getContext("2d")
  watchScreenForCanvasDimensions(canvas)

  // Init Background
  canvasContext.fillStyle = formatToRbgString({
    ...canvasBackgroundColor,
  })
  canvasContext.fillRect(0, 0, getCanvasWidth(), getCanvasHeight())

  // Returned function to render canvas
  return {
    renderToCanvas: (coordinates, symbolColor) => {
      // Draw Background
      canvasContext.fillStyle = formatToRbgString({
        ...canvasBackgroundColor,
        alpha: symbolAlphaFadeRate,
      })
      canvasContext.fillRect(0, 0, getCanvasWidth(), getCanvasHeight())

      // Draw Symbols
      canvasContext.font = formatToFontString(symbolFontSize, symbolFontFamily)
      canvasContext.fillStyle = formatToRbgString(symbolColor)
      coordinates.forEach(({ symbol, x, y }) => {
        canvasContext.fillText(symbol, x, y)
      })
    },
  }
}

/** @param {IConfiguration} config */
const runMatrix = (config) => {
  const {
    maxSymbolCount,
    symbolFontSize,
    frameRatePerSecond,
    symbolColorFade,
    symbolColorForeground,
  } = config
  const { renderToCanvas } = configureCanvasFnFactory(config)

  let symbolsPool = Array.from(Array(maxSymbolCount), () =>
    initializeSymbolCoordinate(symbolFontSize)
  )

  const stepAnimation = async (frameNumber = 0) => {
    if (frameNumber % 2 === 0) {
      symbolsPool = calcNextFrameSymbolsFall(symbolsPool, symbolFontSize)
      renderToCanvas(symbolsPool, symbolColorFade)
    } else {
      renderToCanvas(symbolsPool, symbolColorForeground)
    }

    // Render next frame
    window.requestAnimationFrame(async () => {
      await wait(1000 / frameRatePerSecond)
      stepAnimation(frameNumber + 1)
    })
  }
  stepAnimation() // Begin animation recursion
}

const main = () => {
  const config = /** @type {IConfiguration} */ ({
    canvasBackgroundColor: { red: 0, green: 0, blue: 0 },
    frameRatePerSecond: 30,
    maxSymbolCount: 60,
    symbolAlphaFadeRate: 0.05,
    symbolColorFade: { red: 255, green: 255, blue: 255 },
    symbolColorForeground: { red: 0, green: 255, blue: 0 },
    symbolFontSize: 16,
  })
  runMatrix(config)
}
main()
