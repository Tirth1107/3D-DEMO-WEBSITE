import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useProgress } from '@react-three/drei'
import { Table } from './components/Table'

// --- Data & Constants ---
const MATERIALS = {
    oak: {
        id: 'oak',
        name: 'Oak Wood',
        basePrice: 599,
        type: 'Wood',
        texturePath: '/textures/wood_diffuse.jpg',
        variants: [
            { id: 'natural', name: 'Natural Oak', color: '#e6d8ad' },
            { id: 'smoked', name: 'Smoked Oak', color: '#8d6e63' },
            { id: 'black', name: 'Black Oak', color: '#2c2c2c' },
        ],
        props: { roughness: 0.7, metalness: 0.1, useMap: true, envMapIntensity: 1 }
    },
    walnut: {
        id: 'walnut',
        name: 'Walnut',
        basePrice: 699,
        type: 'Wood',
        texturePath: '/textures/wood_diffuse.jpg',
        variants: [
            { id: 'natural', name: 'American Walnut', color: '#5d4037' },
            { id: 'dark', name: 'Dark Walnut', color: '#3e2723' },
        ],
        props: { roughness: 0.6, metalness: 0.1, useMap: true, envMapIntensity: 1 }
    },
    ash: {
        id: 'ash',
        name: 'Ash Wood',
        basePrice: 629,
        type: 'Wood',
        texturePath: '/textures/wood_diffuse.jpg',
        variants: [
            { id: 'white', name: 'White Ash', color: '#f2f0eb' },
            { id: 'grey', name: 'Grey Ash', color: '#d3d3d3' },
        ],
        props: { roughness: 0.8, metalness: 0.05, useMap: true, envMapIntensity: 0.8 }
    },
    marble: {
        id: 'marble',
        name: 'Marble',
        basePrice: 899,
        type: 'Stone',
        texturePath: '/textures/marble_diffuse.jpg',
        variants: [
            { id: 'carrara', name: 'Carrara White', color: '#f5f5f5' },
            { id: 'nero', name: 'Nero Marquina', color: '#1a1a1a' },
            { id: 'emperador', name: 'Emperador', color: '#4e342e' },
        ],
        props: { roughness: 0.1, metalness: 0.1, useMap: true, envMapIntensity: 1.5 }
    },
    granite: {
        id: 'granite',
        name: 'Granite',
        basePrice: 799,
        type: 'Stone',
        texturePath: '/textures/marble_diffuse.jpg',
        variants: [
            { id: 'black', name: 'Absolute Black', color: '#111111' },
            { id: 'grey', name: 'Steel Grey', color: '#4a4a4a' },
        ],
        props: { roughness: 0.4, metalness: 0.2, useMap: true, envMapIntensity: 1.0 }
    },
    concrete: {
        id: 'concrete',
        name: 'Concrete',
        basePrice: 649,
        type: 'Stone',
        texturePath: '/textures/marble_diffuse.jpg',
        variants: [
            { id: 'light', name: 'Light Grey', color: '#cfcfcf' },
            { id: 'dark', name: 'Anthracite', color: '#595959' },
        ],
        props: { roughness: 0.9, metalness: 0.1, useMap: false, envMapIntensity: 0.5 }
    }
}

const SHAPES = [
    { id: 'rectangular', label: 'Rectangular' },
    { id: 'oval', label: 'Oval' },
    { id: 'round', label: 'Round' },
    { id: 'pebble', label: 'Pebble' },
]

const SIZES = [
    { id: 'small', label: '180 x 90 cm', scale: [0.9, 1, 0.9], priceMod: 0 },
    { id: 'medium', label: '220 x 100 cm', scale: [1, 1, 1], priceMod: 200 },
    { id: 'large', label: '260 x 110 cm', scale: [1.2, 1, 1.1], priceMod: 450 },
]

const LEG_COLORS = [
    { id: '#000000', name: 'Black', hex: '#000000' },
    { id: '#ffffff', name: 'White', hex: '#ffffff' },
    { id: '#888888', name: 'Industrial', hex: '#888888' },
]

function LoadingScreen() {
    const { progress, active } = useProgress()

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="text-4xl font-bold text-slate-900 mb-4 animate-pulse">Tirth Joshi</div>
            <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-slate-900 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="mt-2 text-sm text-slate-400 font-medium">
                Loading 3D Experience... {Math.round(progress)}%
            </div>
        </div>
    )
}

function App() {
    // --- State ---
    const [selectedCategory, setSelectedCategory] = useState('Wood')
    const [selectedMaterialKey, setSelectedMaterialKey] = useState('oak')
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

    const [selectedShape, setSelectedShape] = useState('rectangular')
    const [selectedSize, setSelectedSize] = useState(SIZES[1])
    const [selectedLegColor, setSelectedLegColor] = useState(LEG_COLORS[0])
    const [autoRotate, setAutoRotate] = useState(true)

    // Derived state
    const materialGroup = MATERIALS[selectedMaterialKey]
    const currentVariant = materialGroup.variants[selectedVariantIndex]

    const finalMaterialProps = {
        ...materialGroup.props,
        color: currentVariant.color
    }

    const totalPrice = materialGroup.basePrice + selectedSize.priceMod

    const handleCategoryChange = (category) => {
        setSelectedCategory(category)
        const firstMaterialInCat = Object.values(MATERIALS).find(m => m.type === category)
        if (firstMaterialInCat) {
            setSelectedMaterialKey(firstMaterialInCat.id)
            setSelectedVariantIndex(0)
        }
    }

    const handleMaterialChange = (key) => {
        setSelectedMaterialKey(key)
        setSelectedVariantIndex(0)
    }

    // --- Handlers ---
    const timeoutRef = useRef(null)
    const handleStart = () => {
        setAutoRotate(false)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    const handleEnd = () => {
        timeoutRef.current = setTimeout(() => setAutoRotate(true), 2000)
    }

    return (
        <div className="flex flex-col lg:flex-row w-full h-screen bg-white font-sans text-slate-800 overflow-hidden">
            {/* Loading Overlay */}
            <LoadingScreen />

            {/* --- Left Panel: 3D Viewer --- */}
            {/* Mobile: 40% height, Desktop: Full height, 2/3 width */}
            <div className="relative w-full h-[40vh] lg:h-full lg:w-2/3 bg-slate-100 shrink-0">
                <Canvas shadows camera={{ position: [5, 4, 7], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    <Suspense fallback={null}>
                        <Environment preset="city" />
                        <group position={[0, -0.5, 0]}>
                            <Table
                                materialProps={finalMaterialProps}
                                texturePath={materialGroup.texturePath}
                                legColor={selectedLegColor.id}
                                scale={selectedSize.scale}
                                shape={selectedShape}
                            />
                            <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
                        </group>
                    </Suspense>

                    <OrbitControls
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2.1}
                        enablePan={false}
                        autoRotate={autoRotate}
                        autoRotateSpeed={2}
                        onStart={handleStart}
                        onEnd={handleEnd}
                    />
                </Canvas>

                {/* AR Toggle Button */}
                <div className="absolute bottom-4 lg:bottom-8 left-1/2 transform -translate-x-1/2 w-max">
                    <button className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 lg:px-6 lg:py-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-slate-200 text-xs lg:text-sm font-semibold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        View in AR
                    </button>
                </div>

                {/* Brand */}
                <div className="absolute top-4 left-4 lg:top-8 lg:left-8">
                    <h2 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900">Tirth Joshi</h2>
                </div>
            </div>

            {/* --- Right Panel: Configurator Sidebar --- */}
            {/* Mobile: Remaining height (flex-1), Desktop: Full height, 1/3 width */}
            <div className="w-full h-full lg:w-1/3 overflow-y-auto bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none z-10">

                {/* Header (Sticky) */}
                <div className="p-6 lg:p-8 pb-4 border-b border-slate-100 bg-white sticky top-0 z-20">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">3D Table Configurator</h1>
                        <div className="text-right">
                            <span className="block text-xl lg:text-2xl font-bold text-indigo-600">€{totalPrice},-</span>
                            <span className="text-[10px] lg:text-xs text-slate-400">Incl. VAT</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs lg:text-sm">Design your custom table in 4 simple steps.</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-6 lg:p-8 space-y-8 lg:space-y-10">

                    {/* Step 1: Material Category & Selection */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
                            <h3 className="font-semibold text-base lg:text-lg">Choose Material</h3>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                            {['Wood', 'Stone'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                     ${selectedCategory === cat ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {Object.values(MATERIALS)
                                .filter(m => m.type === selectedCategory)
                                .map((config) => (
                                    <button
                                        key={config.id}
                                        onClick={() => handleMaterialChange(config.id)}
                                        className={`p-3 lg:p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                    ${selectedMaterialKey === config.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <span className="relative z-10 font-medium text-sm lg:text-base">{config.name}</span>
                                        {selectedMaterialKey === config.id && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" />}
                                    </button>
                                ))}
                        </div>
                    </section>

                    {/* Step 2: Shape & Size */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
                            <h3 className="font-semibold text-base lg:text-lg">Shape & Size</h3>
                        </div>

                        {/* Shapes */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {SHAPES.map(shape => (
                                <button
                                    key={shape.id}
                                    onClick={() => setSelectedShape(shape.id)}
                                    className={`px-3 py-2 lg:px-4 rounded-lg text-xs lg:text-sm font-medium border transition-colors
                    ${selectedShape === shape.id
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                >
                                    {shape.label}
                                </button>
                            ))}
                        </div>

                        {/* Sizes */}
                        <select
                            value={selectedSize.id}
                            onChange={(e) => setSelectedSize(SIZES.find(s => s.id === e.target.value))}
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {SIZES.map(s => (
                                <option key={s.id} value={s.id}>{s.label} (+€{s.priceMod})</option>
                            ))}
                        </select>
                    </section>

                    {/* Step 3: Finishes/Textures */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">3</span>
                            <h3 className="font-semibold text-base lg:text-lg">Finish</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {materialGroup.variants.map((variant, index) => (
                                <button
                                    key={variant.id}
                                    className={`relative aspect-square rounded-full border-2 transition-all shadow-sm overflow-hidden
                     ${selectedVariantIndex === index ? 'border-indigo-600 scale-110 ring-2 ring-indigo-200' : 'border-slate-100 hover:scale-105'}`}
                                    style={{ background: variant.color }}
                                    onClick={() => setSelectedVariantIndex(index)}
                                    title={variant.name}
                                >
                                    {/* Optional: Add a checkmark or similar if selected */}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-600 transition-all">
                            {currentVariant.name}
                        </div>
                    </section>

                    {/* Step 4: Legs */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">4</span>
                            <h3 className="font-semibold text-base lg:text-lg">Legs / Base</h3>
                        </div>

                        <div className="mb-3">
                            <label className="text-sm font-medium text-slate-500 mb-2 block">Leg Color</label>
                            <div className="flex gap-3">
                                {LEG_COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => setSelectedLegColor(color)}
                                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                      ${selectedLegColor.id === color.id ? 'border-indigo-600 scale-110 shadow-md' : 'border-slate-200'}`}
                                        style={{ background: color.hex }}
                                        title={color.name}
                                    >
                                        {selectedLegColor.id === color.id &&
                                            <span className={`block w-2 h-2 rounded-full ${color.id === '#ffffff' ? 'bg-black' : 'bg-white'}`} />
                                        }
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer (Sticky) */}
                <div className="p-6 lg:p-8 border-t border-slate-100 bg-slate-50">
                    {/* Summary */}
                    <div className="text-xs text-slate-500 mb-4 space-y-1">
                        <div className="flex justify-between">
                            <span>Selection:</span>
                            <span className="font-medium text-slate-900">{materialGroup.name} ({currentVariant.name}), {selectedShape.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Size:</span>
                            <span className="font-medium text-slate-900">{selectedSize.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Base:</span>
                            <span className="font-medium text-slate-900">{selectedLegColor.name}</span>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2 text-indigo-600 text-xs lg:text-sm font-medium bg-indigo-50 p-2 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Delivered within 4-6 weeks
                    </div>

                    <button className="w-full bg-slate-900 text-white py-3 lg:py-4 rounded-xl font-bold text-base lg:text-lg hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95">
                        Add to Cart — €{totalPrice},-
                    </button>
                </div>

            </div>
        </div>
    )
}

export default App
