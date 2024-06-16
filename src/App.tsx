import { Component, Show, createSignal, mergeProps, onMount } from "solid-js"
import p5 from 'p5'
import Matter from "matter-js";

const App: Component = () => {
    const [width, setWidth] = createSignal(innerWidth);
    const [height, setHeight] = createSignal(innerHeight);
    const [movies, setMovies] = createSignal<string[]>([])
    const [loading, setLoading] = createSignal(false)
    const [username, setUsername] = createSignal('')
    const [fontSize, setFontSize] = createSignal(20)
    const [textColors, setTextColors] = createSignal<any>([]) 

    let p5Instance: p5

    var Engine = Matter.Engine
    var World = Matter.World
    var Bodies = Matter.Bodies
    var Composite = Matter.Composite
    var Runner = Matter.Runner

    let engine: Matter.Engine
    let runner: Matter.Runner

    let ground: Matter.Body
    let leftWall: Matter.Body
    let rightWall: Matter.Body
    let roof: Matter.Body

    let boxArray: Matter.Body[] = []

    let colorRed = Math.random()*255
    let colorGreen = Math.random()*255
    let colorBlue = Math.random()*255

    onMount(() => {
        const sketch = (p: p5) => {
            p.setup = () => {
                p.createCanvas(width(), height());
                p.background(0, 0);

                engine = Engine.create()

                ground = Bodies.rectangle(width() / 2, height(), width(), 10, { isStatic: true });
                leftWall = Bodies.rectangle(0, height() / 2, 10, height(), { isStatic: true });
                rightWall = Bodies.rectangle(width(), height() / 2, 10, height(), { isStatic: true });
                roof = Bodies.rectangle(width() / 2, 0, width(), 10, { isStatic: true });

                World.add(engine.world, [ground, leftWall, rightWall, roof])

                engine.gravity.y = 0
                engine.gravity.x = 0
            
                runner = Runner.create();
            
                Runner.run(runner, engine);
            };  
        
            p.draw = () => {
                p.clear()   

                p.fill('black');
                p.rectMode(p.CENTER)

                boxArray.forEach((box, index) => {
                    p.push()
                    p.translate(box.position.x, box.position.y)
                    p.textSize(fontSize());
                    p.textAlign(p.CENTER, p.CENTER)
                    let text = movies()[index]
                    let textWidth = p.textWidth(text)
                    let textHeight = p.textAscent()
                    // p.fill(textColors()[index]);
                    p.text(text, 0, 0, textWidth*1.1, textHeight*1.1);
                    p.pop()
                });
            };
        };
        
        // p5 fait la correspondance avec le string et l'id dans l'html
        p5Instance = new p5(sketch, 'p5-canvas')
    })

    window.addEventListener('resize', () => { 
        setWidth(innerWidth)
        setHeight(innerHeight)
        p5Instance.resizeCanvas(width(), height(), true)
        World.remove(engine.world, [ground, leftWall, rightWall, roof])
        ground = Bodies.rectangle(width() / 2, height(), width(), 10, { isStatic: true });
        leftWall = Bodies.rectangle(0, height() / 2, 10, height(), { isStatic: true });
        rightWall = Bodies.rectangle(width(), height() / 2, 10, height(), { isStatic: true });
        roof = Bodies.rectangle(width() / 2, 0, width(), 10, { isStatic: true });
        World.add(engine.world, [ground, leftWall, rightWall, roof])
        centerPosition()
    })

    const showMovies = async () => {
        p5Instance.removeElements()
        boxArray = []
        setMovies([])
        Composite.clear(engine.world, false)
        Composite.add(engine.world, [ground, leftWall, rightWall, roof]);

        setLoading(true)

        if(username().trim() === '') {
            setLoading(false)
            alert("Type a username please")
        } else {
            const response = await fetch('http://localhost:5555/letterbox', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({user: username().trim()}),
            })

            let result: string[] = await response.json()

            if(result.includes('User does not exist')) {
                setLoading(false)
                alert('User does not exist')
                setUsername('')
                return 0
            } 

            let rawMovies = result.join(" ")
    
            let allParsedMovies: string[] = []
    
            let whitespaceRegex = /^.*?\((\d{4})\).*?$/gm
            let titlesRegex = /^.*?\)/g
    
            let noWhiteSpaceMovies = rawMovies.match(whitespaceRegex)
    
            noWhiteSpaceMovies?.forEach((oneMovie, index) => {
                allParsedMovies.push(String(oneMovie.trim().match(titlesRegex)))
            })
    
            setMovies(allParsedMovies)

            setLoading(false)

            movies().forEach( (movie, index) => {
                textColors().push(p5Instance.color(Math.random() * 255, Math.random() * 255, Math.random() * 255))
                boxArray.push(Bodies.rectangle(width() / 2, height() / 2, 30, 30, { isStatic: false, friction: 0, restitution: 1, frictionAir: 0, frictionStatic: 0 }))
            });

            boxArray.forEach(box => {
                Matter.Body.setVelocity(box, {
                    x: (Math.random() - 0.5) * 16,
                    y: (Math.random() - 0.5) * 16,
                })
            });

            Composite.add(engine.world, boxArray);
        }
    }

    const boost = async () => {
        boxArray.forEach(box => {
            Matter.Body.setVelocity(box, {
                x: (Math.random() - 0.5) * 32,
                y: (Math.random() - 0.5) * 32,
            })
        });
    }

    const centerPosition = () => {
        boxArray.forEach(box => {
            Matter.Body.setPosition(box, { x: width()/2, y: height()/2 })
        });
    }

    return (
        <div class="relative">
        <div id="p5-canvas" class="canvas-container absolute pointer-events-none z-10"></div>
            <div class="content-container relative z-0">
                <div class="text-center bg-amber-100 selection:bg-orange-200">
                    <header class='min-h-screen flex flex-col items-center justify-center p-5 text-3xl'>
                        <Show when={!loading()} fallback={<div class='flex flex-col items-center'>loading... (totally not webscraping)<svg class='mt-10' xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-dasharray="15" stroke-dashoffset="15" stroke-linecap="round" stroke-width="2" d="M12 3C16.9706 3 21 7.02944 21 12"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="15;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg></div>}>
                            <input class='text-zinc-800 bg-amber-50 placeholder:text-zinc-200 rounded-xl text-center' value={username()} onInput={(e) => setUsername(e.currentTarget.value)} placeholder='letterboxd username' required></input>
                            <button class='m-5 p-1 border-solid border-2 border-white bg-amber-50 text-zinc-800 hover:bg-amber-200 rounded-xl' onClick={showMovies}>show me my watched movies</button>
                            <Show when={movies().length != 0}>
                                <button class='p-1 border-solid border-2 border-white bg-amber-50 text-zinc-800 hover:bg-amber-200 rounded-xl' onClick={boost}>shake shake</button>
                                <input class='mt-5' type='range' min='10' max='50' value='20' step='5' onChange={(e) => setFontSize(Number(e.currentTarget.value))}></input>
                                <label>font size</label>
                            </Show>
                        </Show>
                    </header>
                </div>
            </div>
        </div>
    )
}

export default App