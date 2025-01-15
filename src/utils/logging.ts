import { stripVTControlCharacters } from "node:util"
import pc from "picocolors"

export const UI = {
  indent: 2,
}

/**
 * Wraps a string in backticks and adds a blue color to
 * @param text
 */
export function highlight(text: string) {
  return `${pc.dim(pc.blue("`"))}${pc.blue(text)}${pc.dim(pc.blue("`"))}`
}

/**
 * Wraps a string in backticks and adds a gray color to
 * @param text
 */
export function grayText(text: string) {
  return `${pc.gray(text)}`
}

/**
 * Wraps a string in backticks and adds a green color to
 * @param text
 */
export function errorText(text: string) {
  return `${pc.dim(pc.red("`"))}${pc.red(text)}${pc.dim(pc.blue("`"))}`
}

/**
 * Wraps a string in backticks and adds a red color to
 * @param text
 */
export function warningText(text: string) {
  return `${pc.dim(pc.yellow("`"))}${pc.yellow(text)}${pc.dim(pc.blue("`"))}`
}

/**
 * Wrap `text` into multiple lines based on the `width`.
 */
export function wordWrap(text: string, width: number): string[] {
  // Handle text with newlines by maintaining the newlines, then splitting
  // each line separately.
  if (text.includes("\n")) {
    return text.split("\n").flatMap((line) => wordWrap(line, width))
  }

  const words = text.split(" ")
  const lines = []

  let line = ""
  let lineLength = 0
  for (const word of words) {
    const wordLength = stripVTControlCharacters(word).length

    if (lineLength + wordLength + 1 > width) {
      lines.push(line)
      line = ""
      lineLength = 0
    }

    line += (lineLength ? " " : "") + word
    lineLength += wordLength + (lineLength ? 1 : 0)
  }

  if (lineLength) {
    lines.push(line)
  }

  return lines
}

export function indent(value: string, offset = 0) {
  return `${" ".repeat(offset + UI.indent)}${value}`
}

function log(message: string, { art = pc.gray("\u2502"), prefix = "", print = eprintln }) {
  const prefixLength = prefix.length
  const padding = " "
  const paddingLength = padding.length
  const artLength = stripVTControlCharacters(art).length
  const availableWidth = process.stderr.columns
  const totalWidth = availableWidth - prefixLength - paddingLength * 2 - artLength

  wordWrap(message, totalWidth).map((line, idx) => {
    return print(
      `${art}${padding}${idx === 0 ? prefix : " ".repeat(prefixLength)}${line}${padding}`,
    )
  })
  print()
}

export function success(message: string, { prefix = "", print = eprintln } = {}) {
  log(message, { art: pc.green("\u2502"), prefix, print })
}

export function info(message: string, { prefix = "", print = eprintln } = {}) {
  log(message, { art: pc.blue("\u2502"), prefix, print })
}

export function error(message: string, { prefix = "", print = eprintln } = {}) {
  log(message, { art: pc.red("\u2502"), prefix, print })
}

export function warn(message: string, { prefix = "", print = eprintln } = {}) {
  log(message, { art: pc.yellow("\u2502"), prefix, print })
}

// Rust inspired functions to print to the console:

export function eprintln(value = "") {
  process.stderr.write(`${value}\n`)
}

export function println(value = "") {
  process.stdout.write(`${value}\n`)
}
