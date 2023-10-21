import '@/styles/globals.css'
import "@biconomy/web3-auth/dist/src/style.css"
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'

export default function App({ Component, pageProps }: AppProps) {
  return (
  <ChakraProvider>
    <Component {...pageProps} />
  </ChakraProvider>
  )
}