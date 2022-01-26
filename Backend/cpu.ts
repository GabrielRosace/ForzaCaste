// Algorithm based on Keith Galli videos
// Explanation https://www.youtube.com/watch?v=y7AKtWGOPAE
// Minmax algorithm applied on connect 4 in python https://www.youtube.com/watch?v=MMLtza3CZFM
// Repository GitHub https://github.com/KeithGalli/Connect4-Python/blob/master/README.md


const ROW_COUNT = 6
const COLUMN_COUNT = 7
// const AI_PIECE = 'O'
// const PLAYER_PIECE = 'X'
const EMPTY = '/'

const WINDOW_LENGTH = 4 // Number of consecutive piece


function is_valid_location(board, col) {
  return board[ROW_COUNT - 1][col] == '/'
}


function get_valid_locations(board) {
  let valid_locations = []
  for (let col = 0; col < COLUMN_COUNT; col++) {
    if (is_valid_location(board, col)) {
      valid_locations.push(col)
    }
  }
  return valid_locations
}

function winning_move(board, piece) {
  // Check horizontal locations for win

  for (let c = 0; c < COLUMN_COUNT - 3; c++) {
    for (let r = 0; r < ROW_COUNT; r++) {

      if (board[r][c] == piece && board[r][c + 1] == piece && board[r][c + 2] == piece && board[r][c + 3] == piece) {
        return true
      }
    }
  }

  //Check vertical locations for win
  for (let c = 0; c < COLUMN_COUNT; c++) {
    for (let r = 0; r < ROW_COUNT - 3; r++) {
      if (board[r][c] == piece && board[r + 1][c] == piece && board[r + 2][c] == piece && board[r + 3][c] == piece) {
        return true
      }
    }
  }

  // Check positively sloped diagonals
  for (let c = 0; c < COLUMN_COUNT - 3; c++) {
    for (let r = 0; r < ROW_COUNT - 3; r++) {
      if (board[r][c] == piece && board[r + 1][c + 1] == piece && board[r + 2][c + 2] == piece && board[r + 3][c + 3] == piece) {
        return true
      }
    }
  }

  // Check negatively sloped diagonals
  for (let c = 0; c < COLUMN_COUNT - 3; c++) {
    for (let r = 3; r < ROW_COUNT; r++) {
      if (board[r][c] == piece && board[r - 1][c + 1] == piece && board[r - 2][c + 2] == piece && board[r - 3][c + 3] == piece) {
        return true
      }
    }
  }

  return false
}


function is_terminal_node(board, PLAYER_PIECE, AI_PIECE) {
  return winning_move(board, PLAYER_PIECE) || winning_move(board, AI_PIECE) || get_valid_locations(board).length == 0
}

function count(window, piece) {
  let c = 0
  for (let ele of window) {
    if (ele == piece) {
      c++
    }
  }
  return c
}

function evaluate_window(window, piece,PLAYER_PIECE, AI_PIECE) {
  let score = 0
  let opp_piece = PLAYER_PIECE
  if (piece == PLAYER_PIECE) {
    opp_piece = AI_PIECE
  }

  if (count(window, piece) == 4) {
    score += 100
  } else if (count(window, piece) == 3 && count(window, EMPTY) == 1) {
    score += 5
  } else if (count(window, piece) == 2 && count(window, EMPTY) == 2) {
    score += 2
  }

  if (count(window, opp_piece) == 3 && count(window, EMPTY) == 1) {
    score -= 4
  }

  return score
}

function get_window_positive_sloped_diagonal(board, r, c) {
  let arr = []
  for (let i = 0; i < WINDOW_LENGTH; i++) {
    arr.push(board[r + i][c + i])
  }
  return arr
}


function get_window_positive_sloped_diagonal_2(board, r, c) {
  let arr = []
  for (let i = 0; i < WINDOW_LENGTH; i++) {
    arr.push(board[r + 3 - i][c + i])
  }
  return arr
}

function get_center_array(board) {
  let arr = []
  for (let i = 0; i < ROW_COUNT; i++) {
    arr.push(board[i][Math.floor(COLUMN_COUNT / 2)])
  }
  return arr
}

function get_row_array(board, r) {
  let arr = []
  for (let i = 0; i < COLUMN_COUNT; i++) {
    arr.push(board[r][i])
  }
  return arr
}

function get_col_array(board, c) {
  let arr = []
  for (let i = 0; i < ROW_COUNT; i++) {
    arr.push(board[i][c])
  }
  return arr
}

function score_position(board, piece,PLAYER_PIECE, AI_PIECE) {
  let score = 0

  // Score center column
  let center_array = get_center_array(board)
  let center_count = count(center_array, piece)
  score += center_count * 3

  // Score Horizontal
  for (let r = 0; r < ROW_COUNT; r++) {
    let row_array = get_row_array(board, r)
    for (let c = 0; c < COLUMN_COUNT - 3; c++) {
      let window = row_array.slice(c, c + WINDOW_LENGTH)
      score += evaluate_window(window, piece,PLAYER_PIECE, AI_PIECE)
    }
  }

  // Score Vertical
  for (let c = 0; c < COLUMN_COUNT; c++) {
    let col_array = get_col_array(board, c)
    for (let r = 0; r < ROW_COUNT - 3; r++) {
      let window = col_array.slice(r, r + WINDOW_LENGTH)
      score += evaluate_window(window, piece,PLAYER_PIECE, AI_PIECE)
    }
  }

  // Score positive sloped diagonal
  for (let r = 0; r < ROW_COUNT - 3; r++) {
    for (let c = 0; c < COLUMN_COUNT - 3; c++) {
      let window = get_window_positive_sloped_diagonal(board, r, c)
      score += evaluate_window(window, piece,PLAYER_PIECE, AI_PIECE)
    }
  }

  for (let r = 0; r < ROW_COUNT - 3; r++) {
    for (let c = 0; c < COLUMN_COUNT - 3; c++) {
      let window = get_window_positive_sloped_diagonal_2(board, r, c)
      score += evaluate_window(window, piece,PLAYER_PIECE, AI_PIECE)
    }
  }

  return score
}


function get_next_open_row(board, col) {
  for (let r = 0; r < ROW_COUNT; r++) {
    if (board[r][col] == '/') {
      return r
    }
  }
}

function get_random_choice(valid_locations) {
  let max = valid_locations.length
  let random = Math.floor(Math.random() * max)
  return valid_locations[random]
}

function drop_piece(board, row, col, piece) {
  board[row][col] = piece
}

function min(a, b) {
  return a > b ? b : a
}

function max(a, b) {
  return a > b ? a : b
}


function get_deep_copy(board) {
  let arr = []
  for (let i = 0; i < board.length; i++){
    let tmp = []
    for (let j = 0; j < board[i].length; j++){
      tmp.push(board[i][j])
    }
    arr.push(tmp)
  }
  return arr
}

export function minmax(board, depth, alpha, beta, maximizingPlayer,PLAYER_PIECE, AI_PIECE) {
  let valid_locations = get_valid_locations(board)

  let is_terminal = is_terminal_node(board,PLAYER_PIECE, AI_PIECE)
  if (depth == 0 || is_terminal) {
    if (is_terminal) {
      if (winning_move(board, AI_PIECE)) {
        return { 0: undefined, 1: 100000000000000 }
      } else if (winning_move(board, PLAYER_PIECE)) {
        return { 0: undefined, 1: -10000000000000 }
      } else { // Game is over, no more valid moves
        return { 0: undefined, 1: 0 }
      }
    } else { // Depth is zero
      return { 0: undefined, 1: score_position(board, AI_PIECE,PLAYER_PIECE, AI_PIECE) }
    }
  }

  if (maximizingPlayer) {
    let value = -Infinity
    let column = get_random_choice(valid_locations)
    for (let col of valid_locations) {
      let row = get_next_open_row(board, col)
      let b_copy = get_deep_copy(board)
      drop_piece(b_copy, row, col, AI_PIECE)
      let new_score = minmax(b_copy, depth - 1, alpha, beta, false,PLAYER_PIECE, AI_PIECE)[1]
      if (new_score > value) {
        value = new_score
        column = col
      }
      alpha = max(alpha, value)
      if (alpha >= beta) {
        break
      }
    }
    return { 0: column, 1: value }
  } else { // Minimizing player
    let value = Infinity
    let column = get_random_choice(valid_locations)
    for (let col of valid_locations) {
      let row = get_next_open_row(board, col)
      let b_copy =  get_deep_copy(board)
      drop_piece(b_copy, row, col, PLAYER_PIECE)
      let new_score = minmax(b_copy, depth - 1, alpha, beta, true,PLAYER_PIECE, AI_PIECE)[1]
      if (new_score < value) {
        value = new_score
        column = col
      }
      beta = min(beta, value)
      if (alpha >= beta) {
        break
      }
    }
    return { 0: column, 1: value }
  }
}