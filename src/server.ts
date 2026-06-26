import { app } from './app.ts'

const PORT = 3000

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      message: 'Server is running',
      port: PORT
    })
  )
})
