// Lightweight QR Code generator for WeChat Mini Program Canvas 2D
// Supports alphanumeric content up to version 10

const EC_LEVEL_L = 1
const MODE_BYTE = 4

// Error correction codewords and block info for versions 1-10, EC level L
const EC_TABLE = [
  null,
  { totalCw: 26, ecCwPerBlock: 7, blocks: 1 },
  { totalCw: 44, ecCwPerBlock: 10, blocks: 1 },
  { totalCw: 70, ecCwPerBlock: 15, blocks: 1 },
  { totalCw: 100, ecCwPerBlock: 20, blocks: 1 },
  { totalCw: 134, ecCwPerBlock: 26, blocks: 1 },
  { totalCw: 172, ecCwPerBlock: 18, blocks: 2 },
  { totalCw: 196, ecCwPerBlock: 20, blocks: 2 },
  { totalCw: 242, ecCwPerBlock: 24, blocks: 2 },
  { totalCw: 292, ecCwPerBlock: 30, blocks: 2 },
  { totalCw: 346, ecCwPerBlock: 18, blocks: 4 }
]

// Data capacity (bytes) for each version at EC level L
const DATA_CAPACITY = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274]

// Alignment pattern positions
const ALIGN_POS = [
  null, [], [6, 18], [6, 22], [6, 26], [6, 30],
  [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
]

// Format info bits (mask pattern 0-7, EC level L=01)
const FORMAT_INFO = [
  0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976,
]

function getVersion(dataLen) {
  for (let v = 1; v <= 10; v++) {
    if (dataLen <= DATA_CAPACITY[v]) return v
  }
  return -1
}

function getSize(version) {
  return 17 + version * 4
}

// GF(256) arithmetic
const GF_EXP = new Array(256)
const GF_LOG = new Array(256)
;(function initGF() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x >= 256) x ^= 0x11D
  }
  GF_EXP[255] = GF_EXP[0]
})()

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255]
}

function generateECCodewords(data, ecCount) {
  const gen = new Array(ecCount + 1).fill(0)
  gen[0] = 1
  for (let i = 0; i < ecCount; i++) {
    for (let j = i + 1; j >= 1; j--) {
      gen[j] = gen[j] ^ gfMul(gen[j - 1], GF_EXP[i])
    }
  }

  const msg = new Array(data.length + ecCount).fill(0)
  for (let i = 0; i < data.length; i++) msg[i] = data[i]

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i]
    if (coef !== 0) {
      for (let j = 1; j <= ecCount; j++) {
        msg[i + j] ^= gfMul(gen[j], coef)
      }
    }
  }

  return msg.slice(data.length)
}

function encodeData(text, version) {
  const dataCapacity = DATA_CAPACITY[version]
  const bytes = []
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i))
  }

  const bits = []
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1)
    }
  }

  // Mode indicator
  pushBits(MODE_BYTE, 4)
  // Character count (8 bits for version 1-9, 16 for 10+)
  const ccBits = version <= 9 ? 8 : 16
  pushBits(bytes.length, ccBits)
  // Data
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8)
  }
  // Terminator
  const totalDataBits = dataCapacity * 8
  const terminatorLen = Math.min(4, totalDataBits - bits.length)
  pushBits(0, terminatorLen)
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0)
  // Pad bytes
  const padBytes = [0xEC, 0x11]
  let padIdx = 0
  while (bits.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8)
    padIdx++
  }

  // Convert to bytes
  const dataBytes = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    dataBytes.push(byte)
  }

  return dataBytes
}

function createMatrix(version) {
  const size = getSize(version)
  // 0 = unset, 1 = dark function, 2 = light function, 3 = dark data, 4 = light data
  const matrix = Array.from({ length: size }, () => new Array(size).fill(0))
  return matrix
}

function placeFinderPattern(matrix, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r, mc = col + c
      if (mr < 0 || mr >= matrix.length || mc < 0 || mc >= matrix.length) continue
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        const isDark = (r === 0 || r === 6 || c === 0 || c === 6 ||
                       (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        matrix[mr][mc] = isDark ? 1 : 2
      } else {
        matrix[mr][mc] = 2
      }
    }
  }
}

function placeAlignmentPattern(matrix, row, col) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isDark = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0))
      matrix[row + r][col + c] = isDark ? 1 : 2
    }
  }
}

function placeTimingPatterns(matrix) {
  const size = matrix.length
  for (let i = 8; i < size - 8; i++) {
    const val = (i % 2 === 0) ? 1 : 2
    if (matrix[6][i] === 0) matrix[6][i] = val
    if (matrix[i][6] === 0) matrix[i][6] = val
  }
}

function placeFunctionPatterns(matrix, version) {
  const size = matrix.length
  // Finder patterns
  placeFinderPattern(matrix, 0, 0)
  placeFinderPattern(matrix, 0, size - 7)
  placeFinderPattern(matrix, size - 7, 0)
  // Timing patterns
  placeTimingPatterns(matrix)
  // Dark module
  matrix[size - 8][8] = 1
  // Alignment patterns
  const positions = ALIGN_POS[version]
  if (positions.length > 0) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const r = positions[i], c = positions[j]
        if (matrix[r][c] !== 0) continue
        placeAlignmentPattern(matrix, r, c)
      }
    }
  }
  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    if (matrix[8][i] === 0) matrix[8][i] = 2
    if (matrix[8][size - 1 - i] === 0) matrix[8][size - 1 - i] = 2
    if (matrix[i][8] === 0) matrix[i][8] = 2
    if (matrix[size - 1 - i][8] === 0) matrix[size - 1 - i][8] = 2
  }
  if (matrix[8][8] === 0) matrix[8][8] = 2
}

function placeData(matrix, codewords) {
  const size = matrix.length
  const bits = []
  for (let i = 0; i < codewords.length; i++) {
    for (let j = 7; j >= 0; j--) {
      bits.push((codewords[i] >> j) & 1)
    }
  }

  let bitIdx = 0
  let upward = true
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)
    for (const row of rows) {
      for (let c = col; c >= col - 1; c--) {
        if (matrix[row][c] !== 0) continue
        const dark = bitIdx < bits.length ? bits[bitIdx] : 0
        matrix[row][c] = dark ? 3 : 4
        bitIdx++
      }
    }
    upward = !upward
  }
}

function applyMask(matrix, maskNum) {
  const size = matrix.length
  const maskFn = getMaskFn(maskNum)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] < 3) continue
      if (maskFn(r, c)) {
        matrix[r][c] = matrix[r][c] === 3 ? 4 : 3
      }
    }
  }
}

function getMaskFn(num) {
  switch (num) {
    case 0: return (r, c) => (r + c) % 2 === 0
    case 1: return (r, c) => r % 2 === 0
    case 2: return (r, c) => c % 3 === 0
    case 3: return (r, c) => (r + c) % 3 === 0
    case 4: return (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
    case 5: return (r, c) => ((r * c) % 2 + (r * c) % 3) === 0
    case 6: return (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0
    case 7: return (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
    default: return () => false
  }
}

function placeFormatInfo(matrix, maskNum) {
  const size = matrix.length
  const info = FORMAT_INFO[maskNum]
  // Place around top-left finder
  for (let i = 0; i <= 5; i++) {
    matrix[8][i] = ((info >> (14 - i)) & 1) ? 1 : 2
  }
  matrix[8][7] = ((info >> 8) & 1) ? 1 : 2
  matrix[8][8] = ((info >> 7) & 1) ? 1 : 2
  matrix[7][8] = ((info >> 6) & 1) ? 1 : 2
  for (let i = 0; i <= 5; i++) {
    matrix[5 - i][8] = ((info >> (i)) & 1) ? 1 : 2
  }
  // Place around other finders
  for (let i = 0; i <= 7; i++) {
    matrix[size - 1 - i][8] = ((info >> (14 - i)) & 1) ? 1 : 2
  }
  for (let i = 0; i <= 6; i++) {
    matrix[8][size - 7 + i] = ((info >> (i)) & 1) ? 1 : 2
  }
}

function calculatePenalty(matrix) {
  const size = matrix.length
  let penalty = 0
  // Rule 1: consecutive same-color modules in row/col
  for (let r = 0; r < size; r++) {
    let count = 1
    for (let c = 1; c < size; c++) {
      if (isDark(matrix[r][c]) === isDark(matrix[r][c - 1])) {
        count++
        if (count === 5) penalty += 3
        else if (count > 5) penalty += 1
      } else {
        count = 1
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let count = 1
    for (let r = 1; r < size; r++) {
      if (isDark(matrix[r][c]) === isDark(matrix[r - 1][c])) {
        count++
        if (count === 5) penalty += 3
        else if (count > 5) penalty += 1
      } else {
        count = 1
      }
    }
  }
  return penalty
}

function isDark(val) {
  return val === 1 || val === 3
}

function generateQR(text) {
  const dataBytes = []
  for (let i = 0; i < text.length; i++) {
    dataBytes.push(text.charCodeAt(i))
  }

  const version = getVersion(dataBytes.length)
  if (version < 0) return null

  const ecInfo = EC_TABLE[version]
  const encoded = encodeData(text, version)

  // Split into blocks
  const blocks = []
  const dataPerBlock = Math.floor(encoded.length / ecInfo.blocks)
  const extra = encoded.length % ecInfo.blocks
  let offset = 0
  for (let i = 0; i < ecInfo.blocks; i++) {
    const blockLen = dataPerBlock + (i >= ecInfo.blocks - extra ? 1 : 0)
    blocks.push(encoded.slice(offset, offset + blockLen))
    offset += blockLen
  }

  // Generate EC for each block
  const ecBlocks = blocks.map(b => generateECCodewords(b, ecInfo.ecCwPerBlock))

  // Interleave data
  const interleaved = []
  const maxDataLen = Math.max(...blocks.map(b => b.length))
  for (let i = 0; i < maxDataLen; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i < blocks[j].length) interleaved.push(blocks[j][i])
    }
  }
  for (let i = 0; i < ecInfo.ecCwPerBlock; i++) {
    for (let j = 0; j < ecBlocks.length; j++) {
      interleaved.push(ecBlocks[j][i])
    }
  }

  // Find best mask
  let bestMask = 0
  let bestPenalty = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const m = createMatrix(version)
    placeFunctionPatterns(m, version)
    placeData(m, interleaved)
    applyMask(m, mask)
    placeFormatInfo(m, mask)
    const p = calculatePenalty(m)
    if (p < bestPenalty) {
      bestPenalty = p
      bestMask = mask
    }
  }

  const matrix = createMatrix(version)
  placeFunctionPatterns(matrix, version)
  placeData(matrix, interleaved)
  applyMask(matrix, bestMask)
  placeFormatInfo(matrix, bestMask)

  // Convert to boolean grid
  const size = getSize(version)
  const result = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => isDark(matrix[r][c]))
  )

  return result
}

function drawQRCode(ctx, content, canvasSize) {
  const modules = generateQR(content)
  if (!modules) return

  const qrSize = modules.length
  const quietZone = 2
  const totalModules = qrSize + quietZone * 2
  const moduleSize = canvasSize / totalModules

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // Draw modules
  ctx.fillStyle = '#000000'
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (modules[r][c]) {
        ctx.fillRect(
          (c + quietZone) * moduleSize,
          (r + quietZone) * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }
}

module.exports = { drawQRCode, generateQR }
