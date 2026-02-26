import { createCanvas } from 'canvas'
import fs from 'fs'

async function chartImage(data) {
    const filename = `./tmp/${Date.now()}.png`
    const width = 800
    const height = 400
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const numCandles = data.length
    const totalAvailableWidth = width - 100
    const candleWidth = totalAvailableWidth / (numCandles * 1.5)
    const spaceBetweenCandles = candleWidth / 2
    const chartTop = 50
    const chartBottom = height - 50
    const chartHeight = chartBottom - chartTop

    const allPrices = data.flat()
    let maxPrice = Math.max(...allPrices)
    let minPrice = Math.min(...allPrices)

    if (maxPrice === minPrice) {
        maxPrice += 1
    }

    const lastCandle = data[data.length - 1]
    const currentPrice = lastCandle[3]

    data.forEach((candle, index) => {
        const [open, high, low, close] = candle
        const x = index * (candleWidth + spaceBetweenCandles) + 50

        const yOpen = chartBottom - ((open - minPrice) / (maxPrice - minPrice)) * chartHeight
        const yClose = chartBottom - ((close - minPrice) / (maxPrice - minPrice)) * chartHeight
        const yHigh = chartBottom - ((high - minPrice) / (maxPrice - minPrice)) * chartHeight
        const yLow = chartBottom - ((low - minPrice) / (maxPrice - minPrice)) * chartHeight

        if (close >= open) {
            ctx.fillStyle = 'green'
            ctx.strokeStyle = 'green'
        } else {
            ctx.fillStyle = 'red'
            ctx.strokeStyle = 'red'
        }

        ctx.beginPath()
        ctx.moveTo(x + candleWidth / 2, yHigh)
        ctx.lineTo(x + candleWidth / 2, yLow)
        ctx.stroke()

        ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, Math.abs(yClose - yOpen))
    })

    const yCurrentPrice = chartBottom - ((currentPrice - minPrice) / (maxPrice - minPrice)) * chartHeight
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, yCurrentPrice)
    ctx.lineTo(width - 50, yCurrentPrice)
    ctx.stroke()

    ctx.fillStyle = 'black'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(`Current Price: ${currentPrice}`, width - 150, yCurrentPrice - 5)

    const priceLevels = 10
    const priceStep = (maxPrice - minPrice) / priceLevels

    ctx.fillStyle = 'black'
    ctx.font = '12px Arial'
    for (let i = 0; i <= priceLevels; i++) {
        const price = minPrice + i * priceStep
        const y = chartBottom - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight

        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(50, y)
        ctx.lineTo(width - 50, y)
        ctx.stroke()

        ctx.fillStyle = 'black'
        ctx.fillText(price.toFixed(2), width - 45, y + 4)
    }

    const buffer = canvas.toBuffer('image/png')
    await fs.writeFileSync(filename, buffer)
    return fs.readFileSync(filename)
}

export default chartImage