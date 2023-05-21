import { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import { BoardState, Board, Game, getTiles } from "./play";

export interface GameResult {
  board: BoardState;
  date: number;
  totalTime: number;
}
interface Score extends GameResult {
  score: number;
}

const calculateScores = (scores: GameResult[]) => {
  scores.forEach(
    (score) =>
      ((score as Score).score = [...getTiles(score.board)]
        .map(({ x, y }) => 2 ** score.board[y]![x]!.value)
        .reduce((a, b) => a + b))
  );
  return scores as Score[];
};

const byScore = ({ score }: Score, { score: other }: Score) => other - score;
const byDate = ({ date }: Score, { date: other }: Score) => other - date;

const Scores: NextPage = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [sortByDate, setSortByDate] = useState(false);

  useEffect(
    () =>
      setScores(
        calculateScores(JSON.parse(localStorage.getItem("scores") ?? "[]"))
      ),
    []
  );

  if (scores.length === 0) {
    return (
      <div className="text-5xl text-white">
        You have not played any games yet
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-5xl text-white">My Scores</div>
      <div className="mb-4 text-2xl text-white">
        Sort by:{" "}
        <button
          className={sortByDate ? "" : "underline"}
          onClick={() => setSortByDate(false)}
        >
          score
        </button>
        {" / "}
        <button
          className={sortByDate ? "underline" : ""}
          onClick={() => setSortByDate(true)}
        >
          date
        </button>
      </div>
      <div className="grid w-full max-w-6xl grid-cols-1 content-start gap-6 px-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {scores.sort(sortByDate ? byDate : byScore).map((score) => (
          <div key={score.date} className="text-2xl text-white">
            <Board board={score.board} />
            Date: {new Date(score.date).toLocaleDateString()}
            <br />
            Score: {score.score}
          </div>
        ))}
      </div>
    </>
  );
};

export default Scores;
