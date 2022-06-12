import * as PIXI from 'pixi.js'
import * as isometric from './isometric';
import { keyboard } from './keyboard';

let width = 1920
let height = 1080

let floorsize = {x: 8, y:8}

PIXI.utils.skipHello()

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const app = new PIXI.Application({
  antialias: false,
  width: width,
  height: height,
  backgroundColor: isDarkMode ? 0x1D2333 : 0xffffff,
});

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

document.body.appendChild(app.view);

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

PIXI.Loader.shared.add("assets/spritesheet.json").load(setup);

function setPos(sprite: PIXI.Sprite, pos: isometric.Vector2) {
  let _pos = isometric.to_grid_coordinate({x: (pos.x+2)*(sprite.height), y: (pos.y-1)*(sprite.height)})
  
  sprite.x = _pos.x + (width/2 - sprite.width*4.5)
  sprite.y = (_pos.y/2)+(height/2)-(sprite.height*0.25)
}

function lerpColor(ah: number, bh: number, amount: number) { 
  let ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
      br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);

  return ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0)
}

function setup() {
  let level: number = 0
  let moves: number = 20
  let availablePos = new Array()
  let sheet = PIXI.Loader.shared.resources["assets/spritesheet.json"].spritesheet;

  function getAvailablePos() {
    availablePos = []

    for (let x = floorsize.x; x > 0; x--) {
      for (let y = 0; y < floorsize.y; y++) {
        availablePos.push({x: x-1,y: y})
      }
    }
  }

  function randomPos() {
    let index = Math.floor(Math.random()*availablePos.length)
    let pos = availablePos[index]
    availablePos.splice(index, 1)
    return pos
  }

  getAvailablePos()

  const floor = new PIXI.Container();

  function spawnFloor() {
    let color1 = 0xffffff * Math.random()
    let color2 = 0xffffff * Math.random()
    for (let x = floorsize.x; x > 0; x--) {
      for (let y = 0; y < floorsize.y; y++) {
        let sprite = new PIXI.Sprite(sheet?.textures["isometric_blank.png"]);

        sprite.height = sprite.height * 2.5
        sprite.width = sprite.width * 2.5

        let pos = isometric.to_grid_coordinate({x: x*(sprite.height), y: y*(sprite.height)})
        
        pos.x = pos.x + (width/2 - sprite.width*4.5)
        pos.y =  (pos.y/2)+(height/2)-(sprite.height*0.25)

        sprite.x = pos.x
        sprite.y = pos.y
        
        let t = (x / floorsize.x + y / floorsize.y)/2

        sprite.tint = lerpColor(color1, color2/* *(Math.random()/160000) */, t)

        floor.addChild(sprite )
      }
    }
  }

  spawnFloor()
  
  const level_text = new PIXI.Text(`level: ${level.toString()}`,{fontFamily : 'Arial', fontSize: 24, fill : 0xeeeeee, align : 'center'})
  const fps_text = new PIXI.Text(`FPS: ${level.toString()}`,{fontFamily : 'Arial', fontSize: 24, fill : 0xeeeeee, align : 'center'})
  const moves_text = new PIXI.Text(`Moves: ${level.toString()}`,{fontFamily : 'Arial', fontSize: 24, fill : 0xeeeeee, align : 'center'})

  moves_text.position = {x: 0, y: 25}
  fps_text.position = {x: 0, y: 50}

  const cubos = new PIXI.Sprite(sheet?.textures["isometric_cubos_right.png"]);

  const main = new PIXI.Container();

  let box_pos: isometric.Vector2
  let box: PIXI.Sprite

  function spawnBox() {
    box = new PIXI.Sprite(sheet?.textures["isometric_box.png"]);
    main.addChild(box)
    box.height = box.height * 2.5
    box.width = box.width * 2.5
    let pos = randomPos()
    box_pos = {x: clamp(pos.x, 1, floorsize.x-2), y: clamp(pos.y, 1, floorsize.y-2)}
    console.log(`A box apperad at: x ${box_pos.x} y ${box_pos.y}`)
    setPos(box, box_pos)
  }

  spawnBox()

  let goal_pos: isometric.Vector2
  let goal: PIXI.Sprite

  function spawnGoal() {
    goal = new PIXI.Sprite(sheet?.textures["isometric_letterbox_open.png"]);
    main.addChild(goal)
    goal.height = goal.height * 2.5
    goal.width = goal.width * 2.5
    goal_pos =  randomPos()
    console.log(`A goal apperad at: x ${goal_pos.x} y ${goal_pos.y}`)
    setPos(goal, goal_pos)
  }

  spawnGoal()

  let rocks: { 
    sprite: PIXI.Sprite,
    pos: {x: Number, y: Number}
  }[] = []

  function spawnRocks(amount: number = 1) {
    rocks = []
    let texture = sheet?.textures["isometric_rock.png"]
    for (let i = 0; i < amount; i++) {
      if (Math.random() <= 0.95) continue

      let rock = new PIXI.Sprite(texture);
      rock.height = rock.height * 2.5
      rock.width = rock.width * 2.5
      let pos =  randomPos()
      setPos(rock, pos)
      console.log(`A rock apperad at: x ${pos.x} y ${pos.y}`)
      main.addChild(rock)
      rocks.push({sprite: rock, pos: pos})
    }
  }

  function reset() {
    getAvailablePos()
    floor.removeChildren()

    availablePos.splice(availablePos.findIndex((value) => {return cubos_pos.x == value.x && cubos_pos.y == value.y}),1)

    rocks.forEach((element) => {
      element.sprite.destroy()
    })
    
    goal.destroy()
    box.destroy()
  
    spawnFloor()
    spawnRocks(level+1)
    spawnBox()
    spawnGoal()

    moves = 20
  }  

  main.addChild(cubos)
  main.addChild(level_text)
  main.addChild(moves_text)
  main.addChild(fps_text)

  let cubos_pos = randomPos()
  let cubos_motion = {x: 0,y: 0}

  cubos.height = cubos.height * 2.5
  cubos.width = cubos.width * 2.5

  const key_w = keyboard("w");
  const key_a = keyboard("a");
  const key_s = keyboard("s");
  const key_d = keyboard("d");

  let texture1 = sheet?.textures["isometric_blank.png"]
  let texture2 = sheet?.textures["isometric_cubos_right.png"]
  let texture3 = sheet?.textures["isometric_cubos_down.png"]

  app.stage.addChild(floor);
  app.stage.addChild(main)

  key_w.press = () => {
    if (moves <= 0) return
    if (texture1) cubos.texture = texture1
    if (cubos_pos.x > floorsize.x-2) return
    cubos_motion.x++
    moves--
  }
  key_a.press = () => {
    if (moves <= 0) return
    if (texture1) cubos.texture = texture1
    if (cubos_pos.y <= 0) return
    cubos_motion.y--
    moves--
  }
  key_s.press = () => {
    if (moves <= 0) return
    if (texture3) cubos.texture = texture3
    if (cubos_pos.x <= 0) return
    cubos_motion.x--
    moves--
  }
  key_d.press = () => {
    if (moves <= 0) return
    if (texture2) cubos.texture = texture2
    if (cubos_pos.y > floorsize.y-2) return
    cubos_motion.y++
    moves--
  }

  //let _elapsed = 0.0
  app.ticker.add((_delta) => {
    //_elapsed += delta;
    let skipPush: Boolean = false
    fps_text.text = `FPS: ${Math.round(app.ticker.FPS)}`
    moves_text.text = `Moves: ${moves}`

    main.children.sort((a,b) => {
      a.y = a.y || 0 ;
      b.y = b.y || 0;
      return a.y - b.y;
    })

    for (let i = 0; i < rocks.length; i++) {
      let element = rocks[i]
      if (cubos_pos.x+cubos_motion.x == element.pos.x && cubos_pos.y+cubos_motion.y == element.pos.y) {
        cubos_motion.x = 0
        cubos_motion.y = 0
        return
      }

      if(box_pos.x+cubos_motion.x == element.pos.x && box_pos.y+cubos_motion.y == element.pos.y && 
        cubos_pos.x+cubos_motion.x == box_pos.x && cubos_pos.y+cubos_motion.y == box_pos.y) {

        cubos_motion.x = 0
        cubos_motion.y = 0
        skipPush = true
        return
      }
    }

    if (cubos_pos.x+cubos_motion.x == box_pos.x && cubos_pos.y+cubos_motion.y == box_pos.y){ // check if gonna collide. if yes, push
      if (skipPush == true) return
      if (box_pos.x + cubos_motion.x >= floorsize.x || box_pos.x + cubos_motion.x < 0) {cubos_motion.x = 0; return} //check if pushable
      if (box_pos.y + cubos_motion.y >= floorsize.y || box_pos.y + cubos_motion.y < 0) {cubos_motion.y = 0; return}

      box_pos.x += cubos_motion.x // push
      box_pos.y += cubos_motion.y

      setPos(box, box_pos)
    }
    
    if (cubos_pos.x+cubos_motion.x == goal_pos.x && cubos_pos.y+cubos_motion.y == goal_pos.y){ // collision with letterbox
    
      cubos_motion.x = 0
      cubos_motion.y = 0
      return
    }

    if (box_pos.x == goal_pos.x && box_pos.y == goal_pos.y) { // next level requirement
      reset()

      level++
      level_text.text = `Level: ${level}`
    }

    cubos_pos.x += cubos_motion.x; 
    cubos_pos.y += cubos_motion.y; 

    setPos(cubos, {x: cubos_pos.x, y: cubos_pos.y})

    cubos_motion.x = cubos_motion.x-cubos_motion.x
    cubos_motion.y = cubos_motion.y-cubos_motion.y
  });
}