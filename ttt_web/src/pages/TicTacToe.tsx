// TicTacToe.tsx
import React, { useState } from "react";
import X from "../components/game/X";
import O from "../components/game/O";
import PlayerO from "@/components/game/player/PlayerO";
import PlayerX from "@/components/game/player/PlayerX";


const initialBoard = Array(9).fill(null);


const calculateWinner = (squares: Array<string | null>): string | null => {
   const lines = [
     [0, 1, 2],
     [3, 4, 5],
     [6, 7, 8],
     [0, 3, 6],
     [1, 4, 7],
     [2, 5, 8],
     [0, 4, 8],
     [2, 4, 6],
   ];

   for (const [a, b, c] of lines) {
     if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
       return squares[a] as string;
     }
   }

   return null;
};

const TicTacToe: React.FC = () => {
  const [squares, setSquares] = useState<Array<string | null>>(initialBoard);
  const [xIsNext, setXIsNext] = useState<boolean>(true);

  const handleClick = (i: number): void => {
    if (squares[i] || calculateWinner(squares)) {
      return;
    }

    const newSquares = squares.slice();
    newSquares[i] = xIsNext ? "X" : "O";

    setSquares(newSquares);
    setXIsNext(!xIsNext);
  };

  const renderSquare = (i: number): JSX.Element => (
    <div className="square" onClick={() => handleClick(i)}>
      {squares[i] === "X" ? <X /> : squares[i] === "O" ? <O /> : null}
    </div>
  );

  const winner = calculateWinner(squares);
  const status = winner
    ? `Winner: ${winner}`
    : `Next player: ${xIsNext ? "X" : "O"}`;

  return (
    <>
      <div>
        <div className="status">{status}</div>
        <div className="board">
          <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
          </div>
          <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
          </div>
          <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
        </div>
      </div>
      <PlayerX
        alias="PlayerX"
        picture={`https://robohash.org/X`}
        wins={5}
        losses={2}
        draws={1}
        mood="😊"
      />
      <PlayerO
        alias="PlayerO"
        picture={`https://robohash.org/O`}
        wins={3}
        losses={4}
        draws={2}
        mood="☹️"
      />
    </>
  );
};

export default TicTacToe;