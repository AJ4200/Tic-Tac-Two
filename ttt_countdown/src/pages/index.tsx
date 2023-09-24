import { Inter } from 'next/font/google'
import TicTacTwo from './TicTacTwo'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <><TicTacTwo/><audio autoPlay={true} muted={false} src='Loli.mp3'/></>
  )
}
