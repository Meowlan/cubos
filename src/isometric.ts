// These are the four numbers that define the transform, i hat and j hat
const i_x = 1;
const i_y = 0.5;
const j_x = -1;
const j_y = 0.5;

// Sprite size
const w = 2;
const h = 4;

export interface Vector2 {
    x: number,  
    y: number
}

export function to_screen_coordinate(tile: Vector2) {
  // Without accounting for sprite size
/*   return {
    x: tile.x * i_x + tile.y * j_x,
    y: tile.x * i_y + tile.y * j_y,
  } */

  // Accounting for sprite size
  return {
    x: tile.x * i_x * 0.5 * w + tile.y * j_x * 0.5 * w,
    y: tile.x * i_y * 0.5 * h + tile.y * j_y * 0.5 * h,
  }
}

// Going from screen coordinate to grid coordinate

function invert_matrix(a: number, b: number, c: number, d: number) {
  // Determinant 
  const det = (1 / (a * d - b * c));
  
  return {
    a: det * d,
    b: det * -b,
    c: det * -c,
    d: det * a,
  }
}

export function to_grid_coordinate(screen:  Vector2) {
  const a = i_x * 0.5 * w;
  const b = j_x * 0.5 * w;
  const c = i_y * 0.5 * h;
  const d = j_y * 0.5 * h;
  
  const inv = invert_matrix(a, b, c, d);
  
  return {
    x: screen.x * inv.a + screen.y * inv.b,
    y: screen.x * inv.c + screen.y * inv.d,
  }
}