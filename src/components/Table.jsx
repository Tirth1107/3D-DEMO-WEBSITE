import React, { useEffect } from 'react'
import { useFBX, useTexture } from '@react-three/drei'
import * as THREE from 'three'

export function Table({ materialProps, texturePath, legColor = '#000000', scale = [1, 1, 1], shape = 'rectangular' }) {
    // Load the FBX file instead of GLTF
    const fbx = useFBX('/table.fbx')

    // Create the texture
    const texture = useTexture(texturePath || "/textures/wood_diffuse.jpg")

    // Config texture repeat if needed
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)

    // Clone the FBX scene so we can modify materials without affecting the cached original if needed
    const scene = fbx.clone()

    // Apply material to the first mesh found (or specific name if known)
    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                // Heuristic: Check if it's likely the Table Top
                // Since we don't know exact node names of the FBX, let's assume valid top names
                const isTableTop = child.name.toLowerCase().includes('top') ||
                    child.name.toLowerCase().includes('plane') ||
                    child.name.toLowerCase().includes('cube') || // Fallback
                    !child.name.toLowerCase().includes('leg')

                if (isTableTop) {
                    // Apply our material props to Table Top
                    child.material = new THREE.MeshStandardMaterial({
                        ...materialProps,
                        map: materialProps.useMap ? texture : null,
                        envMapIntensity: materialProps.envMapIntensity || 1
                    })
                } else {
                    // Apply Leg Color to others (Legs/Base)
                    child.material = new THREE.MeshStandardMaterial({
                        color: legColor,
                        roughness: 0.8,
                        metalness: 0.2,
                        envMapIntensity: 0.5
                    })
                }

                child.castShadow = true
                child.receiveShadow = true
            }
        })
    }, [scene, materialProps, texture, legColor])

    // Adjust scale based on shape/size for visual feedback
    // 'oval' might stretch on X, 'round' might be uniform
    const finalScale = [...scale]
    if (shape === 'oval') finalScale[0] *= 1.2
    if (shape === 'round') { finalScale[0] = finalScale[2]; } // Make square-ish for round

    return <primitive object={scene} dispose={null} scale={finalScale} />
}

// Preload the FBX
useFBX.preload('/table.fbx')
