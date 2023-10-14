import Image from 'next/image'
import { Inter } from 'next/font/google'
import TicTacToe from './TicTacToe'

export default function Home() {

  return (
    <main
      className={`flex max-h-screen flex-col items-center justify-between p-24`}
    >
      <span className='fixed top-0 text-black'>Dev Demo</span>
      <TicTacToe />
    </main>
  );
}
