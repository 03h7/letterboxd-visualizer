import { $DEVCOMP, createSignal, For, onMount, Show, type Component } from 'solid-js'
import Matter, { Bodies, Composite, Composites, Constraint, Engine, IBodyRenderOptions, Render, Runner, World } from 'matter-js'

const App: Component = () => {

    const [movies, setMovies] = createSignal<string[]>([])
    const [loading, setLoading] = createSignal(false)
    const [username, setUsername] = createSignal('')

    let engine: Matter.Engine
    let render: Matter.Render
    let runner: Matter.Runner
    let boxArray: Matter.Body[] = []
    let boxElements: HTMLDivElement[] = [];
    let ground = Bodies.rectangle(0, window.innerHeight, window.innerWidth*2, 10, { isStatic: true, render: { fillStyle: 'rgb(254 243 199)' } });
    let leftWall = Bodies.rectangle(window.innerWidth, 0, 10, window.innerHeight*2, { isStatic: true, render: { fillStyle: 'rgb(254 243 199)' } });
    let rightWall = Bodies.rectangle(0, 0, 10, window.innerHeight*2, { isStatic: true, render: { fillStyle: 'rgb(254 243 199)' } });
    let roof = Bodies.rectangle(0, 0, window.innerWidth*2, 10, { isStatic: true, render: { fillStyle: 'rgb(254 243 199)' } });

    onMount(() => {
        let Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite;
            
        engine = Engine.create();
    
        // render = Render.create({
        //     element: document.querySelector('.canvas-container') as HTMLElement,
        //     engine: engine,
        //     options: {
        //         wireframes: false,
        //         background: 'rgba(255, 0, 0, 0)',
        //         height: window.innerHeight,
        //         width: window.innerWidth,
        //         pixelRatio: devicePixelRatio,
        //     },
        // });

        Composite.add(engine.world, [ground, leftWall, rightWall, roof]);

        // Render.run(render);
    
        // runner = Runner.create();
    
        // Runner.run(runner, engine);

        engine.gravity.y = 0
        engine.gravity.x = 0

        setInterval(() => {
            Engine.update(engine)
            renderBoxes()
        }, 1000 / 60)
    })

    const renderBoxes = () => {
        boxArray.forEach((box, index) => {
            const { x, y } = box.position;
            const boxElement = boxElements[index];
            if (boxElement) {
                boxElement.style.top = `${y - 40}px`;
                boxElement.style.left = `${x - 70}px`;
                boxElement.style.transform = `rotate(${box.angle}rad)`;
            }
        });
    };

    const showMovies = async () => {
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

            Composite.clear(engine.world, false)
            Composite.add(engine.world, [ground, leftWall, rightWall, roof]);

            movies().forEach( (movie, index) => {
                boxArray.push(Bodies.rectangle(index*10+index, index*10+index, 30, 30, { isStatic: false, friction: 0, restitution: 1, frictionAir: 0, frictionStatic: 0 }))
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
                x: (Math.random() - 0.5) * 16,
                y: (Math.random() - 0.5) * 16,
            })
        });
    }

    window.addEventListener('resize', () => {
        // console.log("height: " + window.innerHeight + " / width: "+window.innerWidth)
        render.bounds.max.x = window.innerWidth;
        render.bounds.max.y = window.innerHeight;
        render.options.width = window.innerWidth;
        render.options.height = window.innerHeight;
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        Matter.Render.setPixelRatio(render, window.devicePixelRatio);
    })

    // setInterval(() => {
    //     window.dispatchEvent(new Event('resize'))
    // }, 1000);

    return (
    <div class="relative">
        <div class="canvas-container absolute pointer-events-none z-10"></div>
            <div class="content-container relative z-0">
                <div class="text-center bg-amber-100 selection:bg-orange-200">
                    <header class='min-h-screen flex flex-col items-center justify-center p-5 text-3xl'>
                        <Show when={!loading()} fallback={<div class='flex flex-col items-center'>loading... (totally not webscraping ahah..)<svg class='mt-10' xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-dasharray="15" stroke-dashoffset="15" stroke-linecap="round" stroke-width="2" d="M12 3C16.9706 3 21 7.02944 21 12"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="15;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg></div>}>
                            <input class='text-zinc-800 bg-amber-50 placeholder:text-zinc-200 rounded-xl text-center' value={username()} onInput={(e) => setUsername(e.currentTarget.value)} placeholder='your letterboxd username' required></input>
                            <button class='m-5 p-1 border-solid border-2 border-white bg-amber-50 text-zinc-800 hover:bg-amber-200 rounded-xl' onClick={showMovies}>show me my watched movies</button>
                            <Show when={movies().length != 0}>
                                <button class='p-1 border-solid border-2 border-white bg-amber-50 text-zinc-800 hover:bg-amber-200 rounded-xl' onClick={boost}>shake shake</button>
                            </Show>
                            <div class='movies'>
                            <For each={movies()}>
                                {(movie, index) => (<div class='box' ref={(el) => { boxElements[index()] = el}}><h1>{movie}</h1></div>)}
                            </For>
                            </div>
                        </Show>
                    </header>
                </div>
            </div>
        </div>
    )
}

export default App