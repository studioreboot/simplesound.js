import { Sound } from "./Sound";

interface SoundPosition {
    x: number, y: number, z: number
}

/**
 * Like three.js' Vector3
 */

class SoundPosition {
    /**
     * Creates a new SoundPosition (litearly like THREE.Vector3)
     * in 3D space.
     * @param x the X coordinate
     * @param y the Y coordinate
     * @param z the Z coordinate
     */

    constructor (x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Makes a copy of this SoundPosition
     * @returns The new copy
     */

    copy () {
        var shallowCopy = new SoundPosition();
        shallowCopy.x = this.x;
        shallowCopy.y = this.y;
        shallowCopy.z = this.z;
        return shallowCopy;
    }

    /**
     * Updates the specified sound's position to this SoundPosition
     * @param sound The sound to update
     */

    updateSoundPosition (sound:Sound) {
        sound.panner!.positionX.value = this.x;
        sound.panner!.positionY.value = this.y;
        sound.panner!.positionZ.value = this.z;
    }
}

export { SoundPosition }

if (window) {
    // @ts-ignore
    window.SoundPosition = SoundPosition;
}