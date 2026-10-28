import * as THREE from 'three';

/*
 * AETHER — CINEMATIC 3D ENGINE
 *
 * Procedural metallic sculpture
 * Orbital energy rings
 * Instanced geometric fragments
 * Shader-based particle field
 * Scroll-linked camera choreography
 * Mouse and touch interaction
 */

export class AetherScene {

    constructor(canvas) {

        this.canvas = canvas;

        this.paused = false;
        this.mode = 'pulse';
        this.scroll = 0;

        this.time = 0;
        this.lastTime = 0;
        this.frame = null;

        this.pointer = new THREE.Vector2();
        this.pointerTarget = new THREE.Vector2();

        this.dragRotation = new THREE.Vector2();
        this.dragStart = null;

        this.mobile = innerWidth < 700;

        this.motionSpeed = 1;
        this.energy = 1;

        this.initialize();
    }

    initialize() {

        /* 01 — Renderer */

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: !this.mobile,
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(
            Math.min(
                devicePixelRatio,
                this.mobile ? 1.15 : 1.7
            )
        );

        this.renderer.setSize(innerWidth, innerHeight);

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        this.renderer.toneMappingExposure = 1.35;

        /* 02 — Scene */

        this.scene = new THREE.Scene();

        this.scene.fog = new THREE.FogExp2(
            0x050508,
            0.014
        );

        /* 03 — Camera */

        this.camera = new THREE.PerspectiveCamera(
            42,
            innerWidth / innerHeight,
            0.1,
            180
        );

        this.camera.position.set(0, 0, 17);

        /* 04 — Sculpture hierarchy */

        this.world = new THREE.Group();

        this.sculpture = new THREE.Group();

        this.world.add(this.sculpture);
        this.scene.add(this.world);

        /* 05 — Build all scene elements */

        this.createLights();
        this.createSculpture();
        this.createOrbitalRings();
        this.createDebris();
        this.createParticles();
        this.createEnergyTrails();
        this.createGlowEffects();
        this.createWorldChapters();
        this.setupBloom();

        /* 06 — Events */

        this.bindEvents();

        /* 07 — First frame */

        this.update(0);
        this.render();
        this.start();
    }

    /* =======================================
       LIGHTING
    ======================================= */

    createLights() {

        this.scene.add(
            new THREE.AmbientLight(0x595779, 1.8)
        );

        const lights = [
            {
                color: 0x72dfff,
                intensity: 145,
                position: [5, 5, 7]
            },
            {
                color: 0xa052ff,
                intensity: 180,
                position: [-6, 1, 4]
            },
            {
                color: 0xff7847,
                intensity: 110,
                position: [2, -6, 3]
            },
            {
                color: 0xffffff,
                intensity: 100,
                position: [0, 3, -6]
            }
        ];

        lights.forEach(item => {

            const light = new THREE.PointLight(
                item.color,
                item.intensity,
                30
            );

            light.position.set(...item.position);

            this.scene.add(light);
        });
    }

    /* =======================================
       METALLIC CENTRAL SCULPTURE
    ======================================= */

    createSculpture() {

        /*
         * A TorusKnot creates complex interwoven
         * geometry without an external 3D model.
         */

        const geometry = new THREE.TorusKnotGeometry(
            1.45,
            0.47,
            this.mobile ? 160 : 260,
            this.mobile ? 14 : 24,
            3,
            7
        );

        this.chromeMaterial =
            new THREE.MeshPhysicalMaterial({
                color: 0xc7c4da,
                metalness: 0.91,
                roughness: 0.15,
                clearcoat: 1,
                clearcoatRoughness: 0.12,
                envMapIntensity: 1.8,
                side: THREE.DoubleSide
            });

        this.chrome = new THREE.Mesh(
            geometry,
            this.chromeMaterial
        );

        this.sculpture.add(this.chrome);

        /* Outer wireframe echo */

        this.wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x8beaff,
            wireframe: true,
            transparent: true,
            opacity: 0.13,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.wire = new THREE.Mesh(
            geometry.clone(),
            this.wireMaterial
        );

        this.wire.scale.setScalar(1.085);

        this.sculpture.add(this.wire);

        /* Inner crystalline energy core */

        const crystalGeometry =
            new THREE.IcosahedronGeometry(0.85, 2);

        this.crystalMaterial =
            new THREE.MeshPhysicalMaterial({
                color: 0x5135cb,
                emissive: 0x22116a,
                emissiveIntensity: 0.7,
                metalness: 0.65,
                roughness: 0.2,
                transparent: true,
                opacity: 0.82,
                flatShading: true
            });

        this.crystal = new THREE.Mesh(
            crystalGeometry,
            this.crystalMaterial
        );

        this.sculpture.add(this.crystal);

        /* Internal luminous geometric shell */

        const shell = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.12, 1),
            new THREE.MeshBasicMaterial({
                color: 0xb179ff,
                wireframe: true,
                transparent: true,
                opacity: 0.25,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );

        this.sculpture.add(shell);
        this.shell = shell;
    }

    /* =======================================
       ROTATING ORBITAL STRUCTURES
    ======================================= */

    createOrbitalRings() {

        this.rings = [];

        for (let i = 0; i < 7; i++) {

            const radius = 2.8 + i * 0.22;

            const geometry = new THREE.TorusGeometry(
                radius,
                0.011 + i * 0.002,
                8,
                180
            );

            const color =
                i % 3 === 0
                    ? 0xff986d
                    : i % 2 === 0
                        ? 0xa47bff
                        : 0x7fe5ff;

            const material =
                new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.25 + i * 0.055,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

            const ring = new THREE.Mesh(
                geometry,
                material
            );

            ring.rotation.set(
                0.3 + i * 0.47,
                i * 0.64,
                i * 0.28
            );

            this.sculpture.add(ring);

            this.rings.push(ring);
        }

        /* Fine orbital outlines */

        for (let i = 0; i < 4; i++) {

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(
                    4.3 + i * 0.32,
                    0.004,
                    4,
                    180
                ),
                new THREE.MeshBasicMaterial({
                    color: i % 2
                        ? 0x895cff
                        : 0x74dfff,
                    transparent: true,
                    opacity: 0.19,
                    depthWrite: false
                })
            );

            ring.rotation.set(
                i * 0.8,
                i * 0.35,
                i * 0.66
            );

            this.sculpture.add(ring);
            this.rings.push(ring);
        }
    }

    /* =======================================
       FLOATING GEOMETRIC FRAGMENTS
    ======================================= */

    createDebris() {

        const count = this.mobile ? 100 : 270;

        const geometry =
            new THREE.TetrahedronGeometry(0.12, 0);

        const material =
            new THREE.MeshPhysicalMaterial({
                color: 0x9e8bbb,
                metalness: 0.8,
                roughness: 0.25,
                flatShading: true,
                side: THREE.DoubleSide
            });

        this.debris = new THREE.InstancedMesh(
            geometry,
            material,
            count
        );

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {

            const theta = Math.random() * Math.PI * 2;
            const z = Math.random() * 2 - 1;
            const radius = 3.5 + Math.random() * 5;

            const planar = Math.sqrt(1 - z * z);

            dummy.position.set(
                radius * planar * Math.cos(theta),
                radius * planar * Math.sin(theta),
                radius * z
            );

            dummy.rotation.set(
                Math.random() * 6,
                Math.random() * 6,
                Math.random() * 6
            );

            const scale = 0.25 + Math.random() * 2.3;

            dummy.scale.setScalar(scale);
            dummy.updateMatrix();

            this.debris.setMatrixAt(i, dummy.matrix);

            color.setHex(
                i % 4 === 0
                    ? 0xff9068
                    : i % 3 === 0
                        ? 0x8a6cff
                        : 0xa4eaff
            );

            this.debris.setColorAt(i, color);
        }

        this.debris.instanceMatrix.needsUpdate = true;

        this.sculpture.add(this.debris);
    }

    /* =======================================
       CINEMATIC PARTICLE FIELD
    ======================================= */

    createParticles() {

        const count = this.mobile ? 1900 : 4800;

        const positions =
            new Float32Array(count * 3);

        const colors =
            new Float32Array(count * 3);

        const sizes =
            new Float32Array(count);

        const speeds =
            new Float32Array(count);

        const cyan = new THREE.Color(0x80e7ff);
        const violet = new THREE.Color(0x9063ff);
        const orange = new THREE.Color(0xff966a);

        for (let i = 0; i < count; i++) {

            const index = i * 3;

            positions[index] =
                (Math.random() - 0.5) * 70;

            positions[index + 1] =
                (Math.random() - 0.5) * 48;

            positions[index + 2] =
                (Math.random() - 0.5) * 100;

            const random = Math.random();

            let color;

            if (random < 0.45) {
                color = cyan;
            } else if (random < 0.85) {
                color = violet;
            } else {
                color = orange;
            }

            colors[index] = color.r;
            colors[index + 1] = color.g;
            colors[index + 2] = color.b;

            sizes[i] = 0.6 + Math.random() * 2.8;

            speeds[i] = 0.5 + Math.random() * 1.5;
        }

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );

        geometry.setAttribute(
            'aColor',
            new THREE.BufferAttribute(colors, 3)
        );

        geometry.setAttribute(
            'aSize',
            new THREE.BufferAttribute(sizes, 1)
        );

        geometry.setAttribute(
            'aSpeed',
            new THREE.BufferAttribute(speeds, 1)
        );

        const material = new THREE.ShaderMaterial({

            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,

            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 1 },
                uPixelRatio: {
                    value: Math.min(devicePixelRatio, 1.7)
                }
            },

            vertexShader: `
                attribute vec3 aColor;
                attribute float aSize;
                attribute float aSpeed;

                uniform float uTime;
                uniform float uPixelRatio;

                varying vec3 vColor;
                varying float vAlpha;

                void main() {

                    vColor = aColor;

                    vec3 p = position;

                    float movement = uTime * aSpeed;

                    p.z = mod(
                        p.z + movement * 1.8 + 50.0,
                        100.0
                    ) - 50.0;

                    p.x += sin(
                        uTime * 0.15 + p.y * 0.2
                    ) * 0.2;

                    p.y += cos(
                        uTime * 0.11 + p.x * 0.2
                    ) * 0.2;

                    vec4 mvPosition =
                        modelViewMatrix * vec4(p, 1.0);

                    float depth = max(
                        1.0,
                        -mvPosition.z
                    );

                    gl_PointSize = min(
                        22.0,
                        aSize * uPixelRatio * 48.0 / depth
                    );

                    gl_Position =
                        projectionMatrix * mvPosition;

                    vAlpha = smoothstep(
                        75.0,
                        3.0,
                        depth
                    );
                }
            `,

            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                uniform float uIntensity;

                void main() {

                    vec2 uv = gl_PointCoord - 0.5;

                    float distanceToCenter = length(uv);

                    float glow = exp(
                        -distanceToCenter *
                        distanceToCenter * 24.0
                    );

                    float core = 1.0 - smoothstep(
                        0.0,
                        0.15,
                        distanceToCenter
                    );

                    float alpha =
                        (glow * 0.6 + core * 0.5)
                        * vAlpha
                        * uIntensity;

                    gl_FragColor = vec4(
                        vColor,
                        alpha
                    );
                }
            `
        });

        this.particles = new THREE.Points(
            geometry,
            material
        );

        this.scene.add(this.particles);
    }

    /* =======================================
       ENERGY LIGHT TRAILS
    ======================================= */

    createEnergyTrails() {

        this.trails = new THREE.Group();

        for (let i = 0; i < 12; i++) {

            const points = [];

            const radius = 3.1 + Math.random() * 1.2;

            const phase = Math.random() * Math.PI * 2;

            for (let j = 0; j <= 120; j++) {

                const t = j / 120;
                const angle = t * Math.PI * 2 + phase;

                const wave = Math.sin(
                    angle * 3 + i
                ) * 0.2;

                points.push(
                    new THREE.Vector3(
                        Math.cos(angle) * (radius + wave),
                        Math.sin(angle) * (radius + wave),
                        Math.sin(angle * 2 + i) * 0.65
                    )
                );
            }

            const curve =
                new THREE.CatmullRomCurve3(points);

            const geometry =
                new THREE.BufferGeometry().setFromPoints(
                    curve.getPoints(180)
                );

            const material = new THREE.LineBasicMaterial({
                color: i % 3 === 0
                    ? 0xff956d
                    : i % 2
                        ? 0x9c72ff
                        : 0x76dfff,
                transparent: true,
                opacity: 0.15 + Math.random() * 0.3,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const line = new THREE.Line(
                geometry,
                material
            );

            line.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            this.trails.add(line);
        }

        this.sculpture.add(this.trails);
    }

    /* =======================================
       USER INTERACTIONS
    ======================================= */

/* =========================================
   CINEMATIC GLOW EFFECTS
========================================= */

createGlowEffects() {

    // Create a soft radial glow texture.

    const canvas = document.createElement('canvas');

    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(
        128, 128, 0,
        128, 128, 128
    );

    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.12, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.22)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);

    this.glowTexture = texture;
    this.glows = [];

    const glowSettings = [
        {
            color: 0x744aff,
            size: 10,
            opacity: 0.32,
            position: [0, 0, -2.5]
        },
        {
            color: 0x46dfff,
            size: 5,
            opacity: 0.19,
            position: [2, 1, -1]
        },
        {
            color: 0xff8455,
            size: 4.2,
            opacity: 0.16,
            position: [-2, -1.5, -1.5]
        }
    ];

    glowSettings.forEach(settings => {

        const material = new THREE.SpriteMaterial({
            map: texture,
            color: settings.color,
            transparent: true,
            opacity: settings.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });

        const sprite = new THREE.Sprite(material);

        sprite.position.set(...settings.position);

        sprite.scale.set(
            settings.size,
            settings.size,
            1
        );

        this.sculpture.add(sprite);
        this.glows.push(sprite);
    });

    // Metallic surface refinements.

    this.chromeMaterial.metalness = 0.68;
    this.chromeMaterial.roughness = 0.22;

    this.chromeMaterial.color.setHex(0xd7d2ef);

    this.chromeMaterial.emissive =
        new THREE.Color(0x171124);

    this.chromeMaterial.emissiveIntensity = 0.18;

    // Increase the luminosity of orbitals.

    this.rings.forEach(ring => {

        ring.material.opacity = Math.min(
            0.85,
            ring.material.opacity * 1.35
        );
    });
}

/* =========================================
   AETHER — ADDITIONAL 3D WORLDS
========================================= */

createWorldChapters() {

    // WORLD TWO: THE LUMINOUS PORTAL

    this.portalWorld = new THREE.Group();
    this.world.add(this.portalWorld);

    this.portalWorld.position.set(-3.0, 0, -1.5);

    this.portalRings = [];

    for (let i = 0; i < 12; i++) {

        const radius = 0.7 + i * 0.19;

        const geometry = new THREE.TorusGeometry(
            radius,
            0.018,
            8,
            128
        );

        const material = new THREE.MeshBasicMaterial({
            color: i % 2 === 0
                ? 0x73eaff
                : 0x9b70ff,

            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const ring = new THREE.Mesh(
            geometry,
            material
        );

        ring.position.z = -i * 0.16;

        ring.rotation.x = i * 0.08;
        ring.rotation.y = i * 0.12;

        this.portalWorld.add(ring);
        this.portalRings.push(ring);
    }

    // Add a luminous geometric center.

    const portalCore = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.65, 2),
        new THREE.MeshBasicMaterial({
            color: 0x96eaff,
            wireframe: true,
            transparent: true,
            opacity: 0.65
        })
    );

    this.portalWorld.add(portalCore);
    this.portalCore = portalCore;

    // WORLD THREE: THE FRACTURE

    this.fractureWorld = new THREE.Group();
    this.world.add(this.fractureWorld);

    this.fractureWorld.position.set(0, 0, -2);

    this.fracturePieces = [];

    const fragmentGeometry =
        new THREE.OctahedronGeometry(0.24, 0);

    const fragmentMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.55,
            roughness: 0.25,
            flatShading: true,
            vertexColors: false
        });

    for (let i = 0; i < 60; i++) {

        const piece = new THREE.Mesh(
            fragmentGeometry,
            fragmentMaterial.clone()
        );

        const angle = Math.random() * Math.PI * 2;
        const radius = 0.8 + Math.random() * 3.1;
        const height = (Math.random() - 0.5) * 4.6;

        piece.userData.basePosition = new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );

        piece.position.copy(piece.userData.basePosition);

        piece.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        piece.scale.setScalar(
            0.3 + Math.random() * 1.5
        );

        piece.material.color.setHex(
            i % 4 === 0
                ? 0xff875f
                : i % 3 === 0
                    ? 0x9d70ff
                    : 0xa4e9ff
        );

        piece.material.emissive =
            new THREE.Color(
                i % 4 === 0
                    ? 0x4c1308
                    : 0x120b38
            );

        this.fractureWorld.add(piece);
        this.fracturePieces.push(piece);
    }

    // Main crystal at the center of the fracture.

    const fractureCore = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.05, 1),
        new THREE.MeshPhysicalMaterial({
            color: 0x7755dd,
            emissive: 0x301066,
            emissiveIntensity: 0.6,
            metalness: 0.7,
            roughness: 0.18,
            flatShading: true
        })
    );

    this.fractureWorld.add(fractureCore);
    this.fractureCore = fractureCore;

    // Initial state: hide both new artworks.

   this.portalWorld.visible = true;
this.fractureWorld.visible = false;

    this.portalWorld.scale.setScalar(1.8);
this.fractureWorld.scale.setScalar(0.001);
}

/* =========================================
   AETHER — REAL CINEMATIC BLOOM
========================================= */

async setupBloom() {

    try {

        const [
            composerModule,
            renderModule,
            bloomModule,
            outputModule
        ] = await Promise.all([

            import(
                'three/addons/postprocessing/EffectComposer.js'
            ),

            import(
                'three/addons/postprocessing/RenderPass.js'
            ),

            import(
                'three/addons/postprocessing/UnrealBloomPass.js'
            ),

            import(
                'three/addons/postprocessing/OutputPass.js'
            )
        ]);

        const { EffectComposer } = composerModule;
        const { RenderPass } = renderModule;
        const { UnrealBloomPass } = bloomModule;
        const { OutputPass } = outputModule;

        // Set up cinematic tone mapping.

        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        this.renderer.toneMappingExposure = 1.15;

        // Create the postprocessing pipeline.

        const composer = new EffectComposer(
            this.renderer
        );

        composer.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.5)
        );

        const size = new THREE.Vector2();

        this.renderer.getSize(size);

        composer.setSize(size.x, size.y);

        // First: render the original 3D world.

        composer.addPass(
            new RenderPass(
                this.scene,
                this.camera
            )
        );

        // Second: spread light from bright objects.

        const bloom = new UnrealBloomPass(
            new THREE.Vector2(size.x, size.y),
            0.65,
            0.35,
            0.8
        );

        composer.addPass(bloom);

        // Finally: correct color and tone mapping.

        composer.addPass(new OutputPass());

        this.bloomPass = bloom;
        this.composer = composer;

        console.log('AETHER cinematic bloom enabled');

    } catch (error) {

        console.warn(
            'Bloom unavailable; using normal 3D rendering.',
            error
        );
    }
}

    bindEvents() {

        this.onResize = () => {

            this.mobile = innerWidth < 700;

            this.camera.aspect =
                innerWidth / innerHeight;

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(
                innerWidth,
                innerHeight
            );

            this.render();
        };

        window.addEventListener(
            'resize',
            this.onResize,
            { passive: true }
        );

        this.onPointerMove = event => {

            this.pointerTarget.x =
                (event.clientX / innerWidth - 0.5) * 2;

            this.pointerTarget.y =
                (event.clientY / innerHeight - 0.5) * 2;

            if (this.dragStart) {

                const dx =
                    event.clientX - this.dragStart.x;

                const dy =
                    event.clientY - this.dragStart.y;

                this.dragRotation.x += dy * 0.004;
                this.dragRotation.y += dx * 0.004;

                this.dragStart.x = event.clientX;
                this.dragStart.y = event.clientY;
            }
        };

        window.addEventListener(
            'pointermove',
            this.onPointerMove,
            { passive: true }
        );

        this.onPointerDown = event => {

            if (event.pointerType === 'touch') {
                return;
            }

            this.dragStart = {
                x: event.clientX,
                y: event.clientY
            };
        };

        this.onPointerUp = () => {
            this.dragStart = null;
        };

        this.canvas.addEventListener(
            'pointerdown',
            this.onPointerDown
        );

        window.addEventListener(
            'pointerup',
            this.onPointerUp
        );
    }

    /* =======================================
       SCROLL-LINKED CAMERA MOVEMENT
    ======================================= */

    setScroll(progress) {

        this.scroll = THREE.MathUtils.clamp(
            progress,
            0,
            1
        );

        if (this.paused) {
            this.update(0);
            this.render();
        }
    }

    /* =======================================
       ENERGY MODES
    ======================================= */

    setMode(mode) {

        if (!['pulse', 'flux', 'void'].includes(mode)) {
            return;
        }

        this.mode = mode;

        const colors = {
            pulse: {
                wire: 0x8beaff,
                crystal: 0x5135cb
            },
            flux: {
                wire: 0xff966b,
                crystal: 0xb14a79
            },
            void: {
                wire: 0xc3a5ff,
                crystal: 0x18102b
            }
        };

        this.wireMaterial.color.setHex(
            colors[mode].wire
        );

        this.crystalMaterial.color.setHex(
            colors[mode].crystal
        );

        if (this.paused) {
            this.update(0);
            this.render();
        }
    }

    /* =======================================
       PAUSE / RESUME
    ======================================= */

    setPaused(paused) {

        if (this.paused === paused) return;

        this.paused = paused;

        if (paused) {

            cancelAnimationFrame(this.frame);
            this.frame = null;

        } else {

            this.lastTime = performance.now();

            this.start();
        }
    }

    start() {

        if (this.paused) return;

        this.lastTime = performance.now();

        const tick = now => {

            if (this.paused) return;

            const dt = Math.min(
                (now - this.lastTime) / 1000,
                0.05
            );

            this.lastTime = now;
            this.time += dt;

            this.update(dt);
            this.render();

            this.frame = requestAnimationFrame(tick);
        };

        this.frame = requestAnimationFrame(tick);
    }

    /* =======================================
       ANIMATION UPDATE
    ======================================= */

    update(dt) {

        const t = this.time;
        const s = this.scroll;
        
// Cinematic breathing glow.

if (this.glows) {

    this.glows.forEach((glow, index) => {

        const pulse =
            1 + Math.sin(t * 1.2 + index) * 0.08;

        const baseSize = [10, 5, 4.2][index];

        glow.scale.set(
            baseSize * pulse,
            baseSize * pulse,
            1
        );

        glow.material.opacity =
            (index === 0 ? 0.32 : 0.18) *
            (0.85 + Math.sin(t * 1.5 + index) * 0.15);

    });
}


        const lerp = THREE.MathUtils.lerp;

        /* Smooth pointer response */

        this.pointer.lerp(
            this.pointerTarget,
            Math.min(1, dt * 3)
        );

        /* Camera movement through the world */

        const targetZ =
            17 - s * 8.5;

        const cameraX =
            Math.sin(s * Math.PI * 2.3) * 2.2 +
            this.pointer.x * 0.55;

        const cameraY =
            Math.sin(s * Math.PI * 3.5) * 1.1 -
            this.pointer.y * 0.38;

        this.camera.position.z = lerp(
            this.camera.position.z,
            targetZ,
            Math.min(1, dt * 1.6)
        );

        this.camera.position.x = lerp(
            this.camera.position.x,
            cameraX,
            Math.min(1, dt * 1.6)
        );

        this.camera.position.y = lerp(
            this.camera.position.y,
            cameraY,
            Math.min(1, dt * 1.6)
        );

        this.camera.lookAt(
            this.pointer.x * 0.1,
            0,
            0
        );

        /* Composition changes throughout the page */

        let targetX;
        let targetScale;

        if (s < 0.20) {

            targetX = 3.0;
            targetScale = 1;

        } else if (s < 0.40) {

            targetX = -3.3;
            targetScale = 1.25;

        } else if (s < 0.63) {

            targetX = 3.1;
            targetScale = 1.05;

        } else if (s < 0.83) {

            targetX = 0;
            targetScale = 1.45;

        } else {

            targetX = 0;
            targetScale = 0.85;
        }

        if (this.mode === 'flux') {
            targetScale *= 1.16;
        }

        if (this.mode === 'void') {
            targetScale *= 0.83;
        }

        this.world.position.x = lerp(
            this.world.position.x,
            targetX,
            Math.min(1, dt * 1.4)
        );

        this.world.position.y =
            Math.sin(t * 0.32) * 0.12;

        this.sculpture.scale.setScalar(
            lerp(
                this.sculpture.scale.x,
                targetScale * (
                    1 + Math.sin(t * 1.5) * 0.025
                ),
                Math.min(1, dt * 1.5)
            )
        );

        /* Sculpture rotation */

        this.sculpture.rotation.y += dt * (
            this.mode === 'flux' ? 0.21 : 0.07
        );

        this.sculpture.rotation.x = lerp(
            this.sculpture.rotation.x,
            this.dragRotation.x +
                Math.sin(t * 0.28) * 0.12,
            Math.min(1, dt * 1.5)
        );

        /* Internal crystal */

        this.crystal.rotation.y += dt * 0.16;
        this.crystal.rotation.x -= dt * 0.08;

        this.shell.rotation.z += dt * 0.08;

        /* Metallic core */

        this.chrome.rotation.z += dt * 0.025;

        /* Orbital rings */

        this.rings.forEach((ring, i) => {

            ring.rotation.z += dt * (
                i % 2 ? -0.085 : 0.075
            );

            ring.rotation.x += dt * 0.018;
        });

        /* Floating shards */

        this.debris.rotation.y -= dt * 0.022;
        this.debris.rotation.z += dt * 0.011;

        /* Energy light trails */

        this.trails.rotation.y += dt * 0.06;
        this.trails.rotation.z -= dt * 0.025;

        /* Breathing wireframe glow */

        this.wireMaterial.opacity =
            this.mode === 'void'
                ? 0.045
                : 0.11 + Math.sin(t * 1.8) * 0.045;

        /* Particle shader animation */

        this.particles.material.uniforms.uTime.value = t;

        this.particles.material.uniforms.uIntensity.value =
            this.mode === 'void'
                ? 0.4
                : this.mode === 'flux'
                    ? 1.5
                    : 1.0;
                    
/* =========================================
   ANIMATE THE ADDITIONAL WORLDS
========================================= */

// Reveal the portal in the middle chapters.



const portalStrength = Math.max(
    0,
    Math.min(
        (s - 0.12) / 0.18,
        (0.65 - s) / 0.18,
        1
    )
);



// Reveal the fractured sculpture later.


const fractureStrength = Math.max(
    0,
    Math.min(
        (s - 0.52) / 0.18,
        (1.04 - s) / 0.14,
        1
    )
);


// Use smooth curves rather than abrupt changes.

const smooth = value =>
    value * value * (3 - 2 * value);

const portalAmount = smooth(portalStrength);
const fractureAmount = smooth(fractureStrength);

// Cinematic transition between the three worlds.
// Keep the original artwork visible at the start.

const transitionAmount = Math.max(
    portalAmount,
    fractureAmount
);

const originScale = Math.max(
    0.22,
    1 - transitionAmount * 0.78
);

// Scale the existing sculpture as the
// new worlds enter the scene.

this.sculpture.scale.setScalar(originScale);

// Gently move the original sculpture backwards.

this.sculpture.position.z =
    -transitionAmount * 3.5;


// Hide geometry when it is not needed.

this.portalWorld.visible = portalAmount > 0.005;

this.fractureWorld.visible =
    fractureAmount > 0.005;

// Portal reveal.

if (this.portalWorld.visible) {

    const portalScale = Math.max(
        0.001,
        portalAmount * 1.3
    );

    this.portalWorld.scale.setScalar(portalScale);

    this.portalWorld.rotation.y += dt * 0.12;

    this.portalRings.forEach((ring, index) => {

        ring.rotation.z += dt * (
            index % 2 === 0 ? 0.12 : -0.09
        );
    });

    this.portalCore.rotation.y += dt * 0.35;
    this.portalCore.rotation.x += dt * 0.19;
}

// Fracture reveal.

if (this.fractureWorld.visible) {

    const fractureScale = Math.max(
        0.001,
        fractureAmount * 1.2
    );

    this.fractureWorld.scale.setScalar(fractureScale);

    this.fractureWorld.rotation.y += dt * 0.08;

    this.fractureCore.rotation.y += dt * 0.22;

    this.fracturePieces.forEach((piece, index) => {

        const base = piece.userData.basePosition;

        piece.position.x =
            base.x + Math.sin(t * 0.7 + index) * 0.12;

        piece.position.y =
            base.y + Math.cos(t * 0.5 + index) * 0.12;

        piece.rotation.y += dt * 0.15;
        piece.rotation.x += dt * 0.09;
    });
}

    }

    /* =======================================
       RENDER
    ======================================= */

  
render() {
    if (this.composer) {
        this.composer.render();
    } else {
        this.renderer.render(
            this.scene,
            this.camera
        );
    }
}


    /* =======================================
       CLEANUP
    ======================================= */

    dispose() {

        this.setPaused(true);

        window.removeEventListener(
            'resize',
            this.onResize
        );

        window.removeEventListener(
            'pointermove',
            this.onPointerMove
        );

        window.removeEventListener(
            'pointerup',
            this.onPointerUp
        );

        this.canvas.removeEventListener(
            'pointerdown',
            this.onPointerDown
        );

        this.scene.traverse(object => {

            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {

                const materials = Array.isArray(
                    object.material
                )
                    ? object.material
                    : [object.material];

                materials.forEach(material => {
                    material.dispose();
                });
            }
        });

        this.renderer.dispose();
    }
}
