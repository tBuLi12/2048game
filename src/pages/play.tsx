import { clear, time } from "console";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import resetIcon from "public/reset.svg";
import Image from "next/image";
import { GameResult } from "./scores";

interface TileProperties {
  value: number;
  key: number;
  tileOnTop: TileProperties | null;
  pop?: boolean;
}

export type BoardState = (TileProperties | null)[][] & { dirty?: boolean };

function* getFreeTiles(board: BoardState) {
  for (const [y, row] of board.entries()) {
    for (const [x, tile] of row.entries()) {
      if (tile === null) {
        yield { x, y };
      }
    }
  }
}

export function* getTiles(board: BoardState) {
  for (const [y, row] of board.entries()) {
    for (const [x, tile] of row.entries()) {
      if (tile) {
        yield { x, y, key: tile.key };
        if (tile.tileOnTop) {
          yield { x, y, key: tile.tileOnTop.key };
        }
      }
    }
  }
}

let id = 0;

const spawnRandomTile = (board: BoardState) => {
  const freeTiles = [...getFreeTiles(board)];
  const { x, y } = freeTiles[Math.floor(Math.random() * freeTiles.length)]!;
  const newTile = {
    value: Math.random() > 0.5 ? 1 : 2,
    key: ++id,
    tileOnTop: null,
  };

  const boardCopy = board.map((row) =>
    row.map((tile) => (tile ? ({ ...tile } as TileProperties) : null))
  );
  boardCopy[y]![x] = newTile;
  return boardCopy;
};

const reversedViewOf = <T,>(array: T[]): T[] => {
  return Object.defineProperties(
    Object.create(array),
    [...array.keys()].map((index) => ({
      get() {
        return array[array.length - 1 - index];
      },
      set(value: T) {
        array[array.length - 1 - index] = value;
      },
      wrtiable: true,
    })) as unknown as PropertyDescriptorMap
  ) as T[];
};

const columnViewsOf = <T,>(array: T[][]): T[][] => {
  return [...array.keys()].map(
    (columnIndex: number): T[] =>
      Object.defineProperties(
        Object.create(array),
        [...array.keys()].map((index) => ({
          get() {
            return array[index]![columnIndex];
          },
          set(value: T) {
            array[index]![columnIndex] = value;
          },
          wrtiable: true,
        })) as unknown as PropertyDescriptorMap
      ) as T[]
  );
};

const joinTiles = (row: (TileProperties | null)[]): boolean => {
  let i = 0;
  let j;
  let tilesWereMoved = false;
  while ((j = row.findIndex((tile, idx) => idx > i && tile)) !== -1) {
    if (row[i]?.value === row[j]!.value) {
      tilesWereMoved = true;
      row[i]!.tileOnTop = row[j]!;
      row[j] = null;
      ++i;
    } else if (row[i] && j !== i + 1) {
      tilesWereMoved = true;
      row[i + 1] = row[j]!;
      row[j] = null;
      ++i;
    } else if (!row[i]) {
      tilesWereMoved = true;
      row[i] = row[j]!;
      row[j] = null;
    } else {
      ++i;
    }
  }
  return tilesWereMoved;
};

const mergeTiles = (board: BoardState) => {
  const newBoard = board.map((row) =>
    row.map((tile): TileProperties | null =>
      tile
        ? {
            key: tile.tileOnTop
              ? tile.key % 1 == 0
                ? tile.key + 0.5
                : tile.key - 0.5
              : tile.key,
            tileOnTop: null,
            value: tile.tileOnTop ? tile.value + 1 : tile.value,
            pop: !!tile.tileOnTop || tile.pop,
          }
        : null
    )
  );
  return spawnRandomTile(newBoard);
};

const copyBoard = (board: BoardState): BoardState =>
  board.map((row) =>
    row.map((tile) => (tile ? ({ ...tile } as TileProperties) : null))
  );

const emptyBoard = [
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
];

const tileColors = [
  "bg-cyan-500", // 2
  "bg-sky-500", // 4
  "bg-blue-500", // 8
  "bg-indigo-600", // 16
  "bg-violet-500", // 32
  "bg-purple-700", // 64
  "bg-fuchsia-600", // 128
  "bg-pink-500", // 256
  "bg-rose-500", // 512
  "bg-red-500", // 1024
  "bg-amber-500", // 2048
];

const Tile = ({
  x,
  y,
  value,
  pop,
}: Omit<TileProperties, "tileOnTop"> & { x: number; y: number }) => {
  return (
    <div
      className={`absolute ${
        pop ? "animate-pop" : "animate-fade-in"
      } flex items-center justify-center rounded-md text-white shadow-tile transition-[left,top] duration-200 ${tileColors[
        value - 1
      ]!}`}
      style={{
        width: `calc((100% - 5 * var(--grid-spacing)) / 4)`,
        height: `calc((100% - 5 * var(--grid-spacing)) / 4)`,
        left: `calc(var(--grid-spacing) + ${x} * (100% - var(--grid-spacing)) / 4)`,
        top: `calc(var(--grid-spacing) + ${y} * (100% - var(--grid-spacing)) / 4)`,
      }}
    >
      {2 ** value}
    </div>
  );
};

const Empty = ({ x, y }: { x: number; y: number }) => {
  return (
    <div
      className="absolute rounded-md bg-slate-400 shadow-empty"
      style={{
        width: `calc((100% - 5 * var(--grid-spacing)) / 4)`,
        height: `calc((100% - 5 * var(--grid-spacing)) / 4)`,
        left: `calc(var(--grid-spacing) + ${x} * (100% - var(--grid-spacing)) / 4)`,
        top: `calc(var(--grid-spacing) + ${y} * (100% - var(--grid-spacing)) / 4)`,
      }}
    ></div>
  );
};

const saveScore = (score: GameResult) => {
  const scores = JSON.parse(
    localStorage.getItem("scores") ?? "[]"
  ) as GameResult[];
  scores.push(score);
  localStorage.setItem("scores", JSON.stringify(scores));
};

export const Game = () => {
  const startTime = useMemo(Date.now, []);
  const tileMergingTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTouchedPoint = useRef<{ x: number; y: number } | null>(null);
  const [board, setBoard] = useState(
    (): BoardState => emptyBoard.map((row) => [...row])
  );

  const currentBoard = useRef(board);
  currentBoard.current = board;

  // the initial board state cannot include the first tile,
  // as it's random nature interferes with SSR
  useEffect(() => {
    let initialBoard = board;

    setBoard((board) =>
      getTiles(board).next().done
        ? (currentBoard.current = initialBoard = spawnRandomTile(board))
        : (currentBoard.current = initialBoard = board)
    );

    return () => {
      if (initialBoard !== currentBoard.current) {
        saveScore({
          board: currentBoard.current,
          date: Date.now(),
          totalTime: Date.now() - startTime,
        });
      }
    };
  }, []);

  const clean = () => {
    if (tileMergingTimeout.current) {
      clearTimeout(tileMergingTimeout.current);
      setBoard((board) => {
        const newBoard = copyBoard(board);
        if (board.dirty) {
          return mergeTiles(newBoard);
        }
        return board;
      });
    }

    tileMergingTimeout.current = setTimeout(() => {
      tileMergingTimeout.current = null;
      setBoard((board) => {
        const newBoard = copyBoard(board);
        if (board.dirty) {
          return mergeTiles(newBoard);
        }
        return board;
      });
    }, 200);
  };

  const arrows = {
    ArrowUp() {
      clean();
      doSetBoard(setBoard, (board: BoardState) =>
        columnViewsOf(board)
          .map(joinTiles)
          .reduce((a, b) => a || b)
      );
    },
    ArrowDown() {
      clean();
      doSetBoard(setBoard, (board: BoardState) =>
        columnViewsOf(board)
          .map(reversedViewOf)
          .map(joinTiles)
          .reduce((a, b) => a || b)
      );
    },
    ArrowLeft() {
      clean();
      doSetBoard(setBoard, (board: BoardState) =>
        board.map(joinTiles).reduce((a, b) => a || b)
      );
    },
    ArrowRight() {
      clean();
      doSetBoard(setBoard, (board: BoardState) =>
        board
          .map(reversedViewOf)
          .map(joinTiles)
          .reduce((a, b) => a || b)
      );
    },
  };

  useArrows(arrows);

  const touchMove = ({ touches }: React.TouchEvent<HTMLDivElement>) => {
    if (touches[0] && lastTouchedPoint.current) {
      const xDistance = touches[0].clientX - lastTouchedPoint.current.x;
      const yDistance = touches[0].clientY - lastTouchedPoint.current.y;
      lastTouchedPoint.current = null;
      if (Math.abs(xDistance) > Math.abs(yDistance)) {
        xDistance > 0 ? arrows.ArrowRight() : arrows.ArrowLeft();
      } else {
        yDistance > 0 ? arrows.ArrowDown() : arrows.ArrowUp();
      }
    }
  };
  const touchStart = ({ touches }: React.TouchEvent<HTMLDivElement>) => {
    if (touches[0]) {
      lastTouchedPoint.current = {
        x: touches[0].clientX,
        y: touches[0].clientY,
      };
    }
  };

  const victory = [...getTiles(board)].some(
    ({ x, y }) => board[y]![x]!.value === 11
  );
  const loss = !victory && getFreeTiles(board).next().done;

  return (
    <div className="contents" onTouchStart={touchStart} onTouchMove={touchMove}>
      <Board board={board}>
        {(victory || loss) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(0,0,0,0.5)] text-5xl text-white ">
            {victory ? "You Win!" : "Game Over"}
          </div>
        )}
      </Board>
    </div>
  );
};

export const Board = ({
  board,
  children,
}: {
  board: BoardState;
  children?: React.ReactNode;
}) => {
  return (
    <div className="relative col-span-2 row-start-1 aspect-square w-full max-w-xl rounded-md bg-slate-500 lg:col-span-1 lg:row-auto ">
      {children}
      {allPositions.map((position) => (
        <Empty {...position} key={position.key} />
      ))}
      {[...getTiles(board)]
        // sorting ensures that tiles are always rendered in the same order
        // otherwise CSS transition do not work properly
        .sort(({ key }, { key: other }) => key - other)
        .map(({ x, y, key }) => (
          <Tile
            x={x}
            y={y}
            value={board[y]![x]!.value}
            key={key}
            pop={board[y]![x]!.pop}
          />
        ))}
    </div>
  );
};

const useArrows = (arrows: { [eventName: string]: () => void }) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => void arrows[event.key]?.();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
};

const doSetBoard = (
  setBoard: (reducer: (board: BoardState) => BoardState) => void,
  doit: (state: BoardState) => boolean
) => {
  setBoard((board: BoardState) => {
    const newBoard = copyBoard(board);
    newBoard.dirty = doit(newBoard);
    return newBoard;
  });
};

const allPositions = [...Array(4).keys()].flatMap((y) =>
  [...Array(4).keys()].map((x) => ({ x, y, key: x * 4 + y }))
);

const Play: NextPage = () => {
  const [gameKey, setGameKey] = useState(true);

  return (
    <>
      <div className="my-12 text-5xl text-white tablet:text-6xl">
        Reach 2048!
      </div>
      <div className="grid w-full max-w-xl grid-cols-2 grid-rows-1 items-center justify-items-center gap-[var(--grid-spacing)] px-8 text-2xl tablet:text-4xl lg:w-full lg:max-w-7xl lg:grid-cols-[1fr_2fr_1fr]">
        <button
          onClick={() => setGameKey((key) => !key)}
          className="mt-[var(--grid-spacing)] block flex h-12 w-full items-center justify-center gap-4 rounded-xl bg-indigo-800 text-white shadow-button hover:bg-indigo-900 tablet:h-16 sm:text-3xl lg:w-48"
        >
          <Image src={resetIcon as string} alt="reset" />
          Reset
        </button>
        <Game key={+gameKey} />
        <Link
          href="/scores"
          className="mt-[var(--grid-spacing)] block flex h-12 w-full items-center justify-center gap-4 rounded-xl bg-indigo-800 text-white shadow-button hover:bg-indigo-900 tablet:h-16 sm:text-3xl lg:w-48"
        >
          My Scores
        </Link>
      </div>
    </>
  );
};

export default Play;
